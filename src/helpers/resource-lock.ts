import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LOCK_DIR = resolve(process.cwd(), '.locks');
const POLL_INTERVAL_MS = 250;

/**
 * A lock across worker processes, for a record several spec files share.
 *
 * Playwright's own serial mode orders tests inside one file. It does nothing
 * between files running in parallel workers, so two specs editing the same
 * account observe each other's half-applied changes and fail in ways that
 * never reproduce alone.
 *
 * The better answer is usually a record per spec. Use this only where the
 * environment hands you a fixed one you cannot create more of.
 */

function lockPath(key: string): string {
  return resolve(LOCK_DIR, `${key.replace(/[^\w.-]/g, '_')}.lock`);
}

function isStale(path: string, staleAfterMs: number): boolean {
  try {
    const written = Number(readFileSync(path, 'utf8'));

    return Number.isFinite(written) && Date.now() - written > staleAfterMs;
  } catch {
    // Vanished between the failed create and this read: not stale, just gone.
    return false;
  }
}

/**
 * Takes the lock, waiting for whoever holds it.
 *
 * `staleAfterMs` is the escape hatch for a worker killed mid-test: without
 * it, one crashed run blocks the suite until a person deletes a file. Set it
 * comfortably above the longest test that takes this lock.
 */
export async function acquireLock(key: string, timeoutMs = 300_000, staleAfterMs = 600_000): Promise<void> {
  mkdirSync(LOCK_DIR, { recursive: true });

  const path = lockPath(key);
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    try {
      // 'wx' fails when the file exists, which makes create-or-fail atomic.
      writeFileSync(path, String(Date.now()), { flag: 'wx' });

      return;
    } catch {
      if (isStale(path, staleAfterMs)) {
        rmSync(path, { force: true });
        continue;
      }

      if (Date.now() > deadline) {
        throw new Error(
          `Timed out after ${Math.round(timeoutMs / 1000)}s waiting for the lock on "${key}". ` +
            `Another spec is still holding it, or a previous run left ${path} behind.`,
        );
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }
}

export function releaseLock(key: string): void {
  rmSync(lockPath(key), { force: true });
}
