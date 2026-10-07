import { AUTH_STATE_FILE, credentials, uiBaseUrl } from '../../config/environment';
import { LoginPage } from '../../src/pages/login.page';
import { expect, test as setup } from '../../src/fixtures';

/**
 * Signs in once and saves the session for every browser project to reuse.
 *
 * Without this, every spec pays for a login it did not come to test, which is
 * both slow and a false dependency: a login outage then fails forty tests
 * that have nothing to do with authentication.
 *
 * What `storageState` captures: cookies, including HttpOnly ones the page
 * cannot read, and localStorage. What it does not: sessionStorage. An
 * application that keeps its token in sessionStorage needs a different
 * approach, usually an init script that replays the token per context.
 */

// Sign-in can involve a redirect chain through an identity provider, which is
// slower than anything the suite does afterwards.
setup.setTimeout(120_000);

setup('authenticate', async ({ page }) => {
  const { username, password } = credentials();
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.signIn(username, password);
  await loginPage.waitForSignedIn();

  // Prove the session exists before saving it. Without this check a failed
  // login still writes a file, and every dependent spec then fails on a
  // confusing assertion instead of here, where the cause is obvious.
  await expect(page).toHaveURL(new RegExp(`^${uiBaseUrl().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));

  await page.context().storageState({ path: AUTH_STATE_FILE });
});
