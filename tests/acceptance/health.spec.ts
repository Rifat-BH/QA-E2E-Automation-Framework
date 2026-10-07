import { expect, test } from '../../src/fixtures';
import { apiBaseUrl } from '../../config/environment';

/**
 * Acceptance layer: one deployed service, verified at its own boundary.
 *
 * The distinction from the API layer is where it runs, not how. API specs run
 * against anything, including a service started locally. Acceptance specs run
 * against a deployment, after it, and answer "is the thing we just shipped
 * actually working".
 *
 * Keep this layer small and fast. It gates a deploy, so every minute here is
 * a minute before a rollback can begin.
 */

test.describe('Deployment health', () => {
  test.beforeEach(() => {
    test.skip(!process.env.API_BASE_URL, 'API_BASE_URL is not configured for this environment');
  });

  test('@smoke the service reports healthy', async ({ request }) => {
    const response = await request.get(`${apiBaseUrl().replace(/\/+$/, '')}/health`);

    expect(response.status(), await response.text()).toBe(200);
  });

  /**
   * Proves the deployment is the build that was just published, not a
   * previous revision still serving traffic.
   *
   * Conditional on EXPECTED_VERSION because only a pipeline knows what it
   * deployed. A re-run that deploys nothing leaves it unset and falls back to
   * plain reachability, rather than failing on a version it was never in a
   * position to assert.
   */
  test('the running version matches the build that was deployed', async ({ request }) => {
    const expected = process.env.EXPECTED_VERSION;
    test.skip(!expected, 'EXPECTED_VERSION is not set: this run did not deploy a new revision');

    const response = await request.get(`${apiBaseUrl().replace(/\/+$/, '')}/health`);
    const body = await response.json();

    expect(body.version).toBe(expected);
  });
});
