import { expect, test } from '../../src/fixtures';
import { pollRead, syncPoll } from '../../src/helpers/polling';
import { acquireLock, releaseLock } from '../../src/helpers/resource-lock';
import { uniqueName } from '../../src/data/generators';

/**
 * End-to-end layer: a change made in one system, observed in another.
 *
 * This is the only layer that can prove the integration between two products
 * actually works, and the slowest and most fragile layer there is. So the
 * rule is: one spec per direction that matters, not per field. Field-level
 * coverage belongs in the API layer, where it costs seconds instead of
 * minutes.
 *
 * The template below is the full shape: take the shared record, make one
 * change, wait for the other side to agree, restore. Replace the adapters
 * with your systems.
 */

test.describe('Cross-system sync', () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.API_BASE_URL || !process.env.UI_BASE_URL,
      'Both API_BASE_URL and UI_BASE_URL must be configured to run cross-system flows',
    );
  });

  test('a change made in the source system reaches the target', async () => {
    // Specs in different files share one record in a deployed environment and
    // would otherwise observe each other's half-applied edits. Keyed on the
    // identifier every system agrees on.
    const recordKey = 'shared-record';
    await acquireLock(recordKey);

    try {
      const update = uniqueName('Sync');

      // 1. Write through one system.
      //    await source.write(identity, { ...baseline, lastName: update });

      // 2. Wait for the other to agree. The wait re-reads on every attempt,
      //    which is why this is one step rather than a navigate and a check:
      //    the navigation happens repeatedly inside the wait.
      //
      //    await expect
      //      .poll(pollRead(() => target.read(identity)), syncPoll('Source', 'Target'))
      //      .toMatchObject({ lastName: update });

      // Placeholder so the template compiles and the imports stay honest
      // about what a real spec uses.
      await expect.poll(pollRead(async () => update), syncPoll('Source', 'Target')).toBe(update);
    } finally {
      // 3. Restore through the SAME system the test wrote through. Restoring
      //    down a different path races the original change still crossing the
      //    sync, which can land after the restore and silently undo it.
      //
      //    await restore(source, identity, baseline, describe);

      releaseLock(recordKey);
    }
  });
});
