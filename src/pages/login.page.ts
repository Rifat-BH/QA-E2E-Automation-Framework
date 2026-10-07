import type { Locator, Page } from '@playwright/test';

import { BasePage } from './base.page';

/**
 * Template page object. Replace the selectors with your application's.
 *
 * It is here as the shape to copy: locators built once in the constructor,
 * methods named for what a user does, and no assertions.
 */
export class LoginPage extends BasePage {
  protected readonly path = '/login';
  protected readonly readyMarker: Locator;

  private readonly username: Locator;
  private readonly password: Locator;
  private readonly submit: Locator;
  private readonly error: Locator;

  constructor(page: Page) {
    super(page);

    this.username = this.byLabel('Username');
    this.password = this.byLabel('Password');
    this.submit = this.byRole('button', { name: 'Sign in' });
    this.error = this.byRole('alert');
    this.readyMarker = this.submit;
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }

  /**
   * Exposes the error element rather than its text, so a spec can assert on
   * visibility, content or absence without this object having to guess which.
   */
  errorMessage(): Locator {
    return this.error;
  }

  /**
   * Resolves once the application has accepted the session.
   *
   * Waiting on a URL rather than a fixed timeout: a redirect that takes two
   * seconds on a cold start and two hundred milliseconds afterwards is normal,
   * and neither should be encoded as a sleep.
   */
  async waitForSignedIn(landingPath = '/'): Promise<void> {
    await this.page.waitForURL((url) => url.pathname.startsWith(landingPath), { timeout: 30_000 });
  }
}
