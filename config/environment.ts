import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import dotenv from 'dotenv';

/**
 * Every value the framework reads from the outside world passes through this
 * file, and nothing else calls `process.env` directly.
 *
 * Two reasons. A missing variable fails here with a sentence naming what to
 * set, instead of surfacing three layers down as an undefined URL. And the
 * full set of inputs is one file a newcomer can read, rather than a grep.
 */

/** Values live in `config/.env.<name>`; `ENVIRONMENT` picks which. */
export function environment(): string {
  return process.env.ENVIRONMENT ?? 'local';
}

let loaded = false;

/**
 * Loads `config/.env.<environment>`, then `config/.env.local` on top of it.
 *
 * The local file is gitignored and wins, so a developer can point one value
 * at their own machine without editing a shared file and risking committing
 * it. Real variables already in the process always win over both, which is
 * how CI injects secrets.
 */
export function loadEnvironment(): void {
  if (loaded) {
    return;
  }

  for (const file of [`config/.env.${environment()}`, 'config/.env.local']) {
    const path = resolve(process.cwd(), file);
    if (existsSync(path)) {
      dotenv.config({ path, override: false });
    }
  }

  loaded = true;
}

function required(name: string): string {
  loadEnvironment();
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `${name} is not set. Add it to config/.env.${environment()}, or to config/.env.local ` +
        'for a machine-specific value. See config/.env.example for the full list.',
    );
  }

  return value;
}

function optional(name: string, fallback = ''): string {
  loadEnvironment();

  return process.env[name] ?? fallback;
}

/** Root of the application under test in the browser. */
export function uiBaseUrl(): string {
  loadEnvironment();

  return optional('UI_BASE_URL', 'http://localhost:3000');
}

/** Root of the HTTP API under test. */
export function apiBaseUrl(): string {
  return required('API_BASE_URL');
}

/** Optional bearer token for API suites that authenticate with one. */
export function apiToken(): string {
  return optional('API_TOKEN');
}

export const AUTH_STATE_FILE = '.auth/state.json';

/**
 * Whether a sign-in can be attempted at all.
 *
 * Half a credential pair is always a mistake rather than an intentional
 * opt-out, so it throws instead of quietly running signed-out and failing
 * later on an assertion that has nothing to do with the real problem.
 */
export function canSignIn(): boolean {
  loadEnvironment();

  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;

  if (Boolean(username) !== Boolean(password)) {
    const missing = username ? 'APP_PASSWORD' : 'APP_USERNAME';

    throw new Error(
      `${missing} is not set. Set both APP_USERNAME and APP_PASSWORD to sign in, or neither ` +
        'to run only the suites that do not need a session.',
    );
  }

  return Boolean(username);
}

export function credentials(): { username: string; password: string } {
  return { username: required('APP_USERNAME'), password: required('APP_PASSWORD') };
}
