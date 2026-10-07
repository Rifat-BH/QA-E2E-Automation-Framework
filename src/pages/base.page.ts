import type { Locator, Page } from '@playwright/test';

/**
 * What every page object inherits, and the contract they all follow.
 *
 * A page object owns locators and the vocabulary of one screen. It does not
 * assert. Keeping assertions in specs is what lets a spec read as the
 * scenario a person wrote down, and lets the same page object serve a test
 * that expects success and one that expects a validation error.
 *
 * Locators are built once in the constructor, never re-queried per call, so a
 * selector appears exactly once in the codebase and a UI change is a one-line
 * fix.
 */
export abstract class BasePage {
  protected constructor(protected readonly page: Page) {}

  /** Path this page lives at, relative to `baseURL`. */
  protected abstract readonly path: string;

  /**
   * A locator that is present only once this page has finished rendering.
   * `open` waits on it, so callers never have to guess at a settle time.
   */
  protected abstract readonly readyMarker: Locator;

  async open(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitUntilReady();
  }

  async waitUntilReady(): Promise<void> {
    await this.readyMarker.waitFor({ state: 'visible' });
  }

  /**
   * Prefer a role, label or test id over a CSS path.
   *
   * A CSS path couples the test to the DOM's shape, so a wrapper div added
   * for layout breaks a test that cares about a button. A role or label
   * couples it to what the user sees, which is what the test is about.
   */
  protected byTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  protected byRole(...args: Parameters<Page['getByRole']>): Locator {
    return this.page.getByRole(...args);
  }

  protected byLabel(...args: Parameters<Page['getByLabel']>): Locator {
    return this.page.getByLabel(...args);
  }

  /**
   * Fills a field only when its value differs.
   *
   * Forms that enable Save on dirty state never enable it when a test writes
   * the value already shown, so the test times out against a button that was
   * never going to appear. Writing only real changes keeps that from
   * happening and keeps the form's dirty state honest.
   */
  protected async fillIfChanged(field: Locator, value: string): Promise<void> {
    if ((await field.inputValue()) === value) {
      return;
    }

    await field.fill(value);
  }
}
