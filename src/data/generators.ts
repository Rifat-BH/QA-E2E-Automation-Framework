import { randomUUID } from 'node:crypto';

/**
 * Values a test writes are generated per run; values a test restores to are
 * pinned in a fixture file.
 *
 * That distinction is worth stating because getting it wrong is subtle and
 * expensive. A suite that adopts whatever it finds on arrival as the baseline
 * teaches itself, after a single failed cleanup, that last run's test values
 * are the record's real ones. The record then drifts a little further every
 * run and never finds its way back. Pinning the baseline means a run repairs
 * that drift instead of compounding it.
 */

/** Short, stable within a run, distinct between runs. */
export const RUN_ID = randomUUID().slice(0, 8);

let counter = 0;

function unique(): string {
  counter += 1;

  return `${RUN_ID}${counter.toString().padStart(2, '0')}`;
}

/**
 * A label carrying the run it came from.
 *
 * When a leftover record turns up weeks later, the run id in its name is the
 * difference between knowing exactly which run abandoned it and guessing.
 */
export function uniqueName(prefix: string): string {
  return `${prefix}${unique()}`;
}

export function uniqueEmail(prefix = 'qa'): string {
  // example.com is reserved by RFC 2606, so a stray send cannot reach a real
  // inbox even if something under test tries.
  return `${prefix}+${unique()}@example.com`;
}

/** ISO date offset from today, for ages and expiry dates. */
export function isoDate(daysFromToday = 0): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);

  return date.toISOString().slice(0, 10);
}

/**
 * Characters that break naive implementations, for the one test per field
 * that should carry them.
 *
 * Spread these across existing scenarios rather than writing a separate
 * "special characters" test: a field that survives a real journey with an
 * apostrophe in it has been tested more honestly than one that survives a
 * dedicated test designed around it.
 */
export const AWKWARD_STRINGS = {
  apostrophe: "O'Brien",
  hyphen: 'Smith-Jones',
  accented: 'Núñez',
  nonLatin: '山田',
  trailingSpace: 'Trailing ',
  long: 'A'.repeat(255),
} as const;
