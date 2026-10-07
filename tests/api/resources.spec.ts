import { expect, test } from '../../src/fixtures';
import { uniqueName } from '../../src/data/generators';

/**
 * API layer: one service, through HTTP, no browser.
 *
 * The fastest and most stable layer, so push everything here that does not
 * genuinely need a UI. A rule of thumb that holds up well: if the scenario
 * would still be meaningful described over the phone without mentioning a
 * screen, it belongs here.
 *
 * Replace the routes and assertions with your service's. The shapes are what
 * to copy.
 */

test.describe('Resources API', () => {
  // Guards, not failures. With no API configured the suite says so once per
  // spec and moves on, which lets a gate run the layers it can reach instead
  // of going red on a missing variable.
  test.beforeEach(() => {
    test.skip(!process.env.API_BASE_URL, 'API_BASE_URL is not configured for this environment');
  });

  test('@smoke GET /resources returns a list matching its schema', async ({ exampleApi }) => {
    const resources = await exampleApi.listResources();

    // Asserting the shape, not a count. A fixed count makes the test fail
    // whenever someone else adds data, which trains people to ignore it.
    expect(Array.isArray(resources)).toBe(true);
  });

  test('POST /resources returns the created resource', async ({ exampleApi }) => {
    const name = uniqueName('Resource');

    const created = await exampleApi.create({ name });

    // The response is validated against a .strict() schema inside the client,
    // so reaching this line already proves the contract held. What is left to
    // assert is the behaviour: the value sent is the value stored.
    expect(created.name).toBe(name);
  });

  test('POST /resources rejects a body with no name', async ({ exampleApi }) => {
    // The raw-response method, because the status is the thing under test.
    const response = await exampleApi.createResponse({});

    expect(response.status(), await response.text()).toBe(400);
  });

  test('GET /resources/{id} returns 404 for an id that does not exist', async ({ exampleApi }) => {
    const response = await exampleApi.createResponse({ name: uniqueName('Temp') });
    test.skip(!response.ok(), 'Could not create a resource to derive a missing id from');

    const created = await response.json();
    await exampleApi.deleteResource(created.id);

    await expect(exampleApi.getResource(created.id)).rejects.toThrow(/404/);
  });
});
