import { expect, test } from '../../src/fixtures';

/**
 * UI layer: one application, through a real browser.
 *
 * Keep this layer for things only a browser can prove: that a control is
 * reachable, that validation surfaces where a user will see it, that a
 * journey hangs together. Business rules with no visual component are
 * cheaper and steadier in the API layer.
 *
 * These specs run signed out on purpose, so they do not depend on the shared
 * sign-in state the other browser projects reuse.
 */

test.describe('Sign-in', () => {
  test.beforeEach(() => {
    test.skip(!process.env.UI_BASE_URL, 'UI_BASE_URL is not configured for this environment');
  });

  // Signed-out, so this spec ignores the saved session the project provides.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('@smoke the sign-in form is reachable', async ({ loginPage }) => {
    await loginPage.open();

    // `open` already waited on the ready marker, so arriving here is the
    // assertion. Re-checking the same element would add a line and prove
    // nothing new.
  });

  test('wrong credentials show an error and do not sign the user in', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.signIn('not-a-real-user', 'not-a-real-password');

    // Asserting what the user sees, not an internal state. The visible error
    // is the behaviour the scenario is about.
    await expect(loginPage.errorMessage()).toBeVisible();

    // And asserting the negative too. Without this the test passes even if
    // the application shows an error and signs the user in anyway, which is
    // exactly the bug worth catching here.
    await expect(page).toHaveURL(/login/);
  });
});
