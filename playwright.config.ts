import { defineConfig, devices } from '@playwright/test';

import { AUTH_STATE_FILE, canSignIn, environment, loadEnvironment, uiBaseUrl } from './config/environment';

/**
 * One config, four projects, one shared set of fixtures.
 *
 * The projects are layers, not browsers:
 *
 *   api         no browser, HTTP only, fastest, runs everywhere
 *   ui          one application through a real browser
 *   acceptance  one deployed service verified at its own boundary
 *   e2e         several systems, a change made in one, observed in another
 *
 * Splitting them this way means a gate can run exactly the layers its
 * dependencies allow. A pull-request gate that cannot reach a deployed
 * environment runs `api` alone and still means something, instead of running
 * everything and skipping most of it.
 */

loadEnvironment();

const signsIn = canSignIn();

export default defineConfig({
  testDir: './tests',
  // A spec that forgets its own waits should fail, not hang a CI agent.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Fail the run rather than silently pass when a focused test is committed.
  forbidOnly: Boolean(process.env.CI),
  // One retry in CI only. Retries locally hide flakiness from the person who
  // introduced it, which is the only moment it is cheap to fix.
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: uiBaseUrl(),
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // -------------------------------------------------------------------
    // Sign-in runs once and writes a storage state the browser projects
    // reuse, so no spec pays for a login it did not come to test.
    //
    // Guarded on credentials being present: with none configured the
    // project is omitted entirely rather than failing, which lets the api
    // layer run in a gate that holds no secrets.
    // -------------------------------------------------------------------
    ...(signsIn
      ? [
          {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
          },
        ]
      : []),

    {
      name: 'api',
      testDir: './tests/api',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        ...(signsIn ? { storageState: AUTH_STATE_FILE } : {}),
      },
      ...(signsIn ? { dependencies: ['setup'] } : {}),
    },

    {
      name: 'acceptance',
      testDir: './tests/acceptance',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        ...(signsIn ? { storageState: AUTH_STATE_FILE } : {}),
      },
      ...(signsIn ? { dependencies: ['setup'] } : {}),
      // Cross-system flows wait on real propagation between services, so
      // they need a longer budget than a single-application spec.
      timeout: 180_000,
    },
  ],

  metadata: {
    environment: environment(),
  },
});
