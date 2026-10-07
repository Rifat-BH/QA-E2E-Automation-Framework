import { test as base, expect } from '@playwright/test';

import { apiBaseUrl, apiToken } from '../../config/environment';
import { ExampleApiClient } from '../api/example.client';
import { LoginPage } from '../pages/login.page';

/**
 * The arrangement every spec gets.
 *
 * Specs import `test` and `expect` from here, never from '@playwright/test'.
 * A lint rule enforces it, because the moment one spec reaches past the
 * barrel it silently opts out of the shared setup and starts failing for
 * reasons that look like product bugs.
 *
 * What belongs here: anything more than one spec needs to arrange. What does
 * not: anything specific to a single scenario, which belongs in that spec so
 * a reader can see it without opening another file.
 *
 * Fixtures are lazy. Declaring ten costs a spec nothing; it pays only for the
 * ones it names in its arguments.
 */

interface Fixtures {
  loginPage: LoginPage;
  exampleApi: ExampleApiClient;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // Built on Playwright's own `request` so it inherits the project's proxy,
  // TLS and storage-state settings rather than quietly bypassing them.
  exampleApi: async ({ request }, use) => {
    await use(new ExampleApiClient(request, { baseUrl: apiBaseUrl(), token: apiToken() }));
  },
});

export { expect };
