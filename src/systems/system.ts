/**
 * The contract an end-to-end spec talks to.
 *
 * A cross-system scenario is "change it here, see it there". Without an
 * abstraction, the spec fills with the mechanics of each side: this one needs
 * three screens and a confirm dialog, that one needs two API calls and a key
 * lookup. The scenario disappears into the plumbing.
 *
 * With one interface per system, the spec says `read` and `write`, and each
 * adapter keeps its own mechanics to itself. The same spec body then works
 * whichever direction you run it, which is what makes a matrix of directional
 * tests cheap to add.
 *
 * `TRecord` is whatever your domain's shared shape is: the fields every
 * system holds a version of. Define it once in src/types and let each
 * adapter translate its own vocabulary to and from it.
 */
export interface System<TRecord, TIdentity> {
  /** Shown in test titles and failure messages. Use the product's own name. */
  readonly name: string;

  read(identity: TIdentity): Promise<TRecord>;

  write(identity: TIdentity, record: TRecord): Promise<void>;
}

/**
 * Restores a record to a known state after a test has changed it.
 *
 * Restore through the same system the test wrote through. Going down a
 * different path races the original change still crossing the sync, which can
 * land after the restore and silently undo it, leaving the record dirty for
 * the next run.
 *
 * Failures are logged rather than thrown: the test's own result is the
 * interesting one, and a cleanup failure masking a real assertion failure is
 * worse than a loud line in the log. The message carries everything needed to
 * repair the record by hand.
 */
export async function restore<TRecord, TIdentity>(
  system: System<TRecord, TIdentity>,
  identity: TIdentity,
  baseline: TRecord,
  describe: (record: TRecord) => string,
): Promise<void> {
  try {
    await system.write(identity, baseline);

    const after = await system.read(identity);
    if (JSON.stringify(after) !== JSON.stringify(baseline)) {
      console.error(
        `Restore did not fully take. ${system.name} now shows ${describe(after)}, expected ` +
          `${describe(baseline)}. Repair it by hand before the next run.`,
      );
    }
  } catch (error) {
    console.error(
      `Failed to restore through ${system.name} to ${describe(baseline)}. Manual cleanup needed.`,
      error,
    );
  }
}
