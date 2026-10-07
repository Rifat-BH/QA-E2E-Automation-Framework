import { z } from 'zod';

/**
 * The shapes the framework agrees on, validated rather than asserted.
 *
 * Fixture files are parsed through these at load time, so a typo in a JSON
 * file fails with the field's name before a single browser opens, instead of
 * surfacing ten minutes later as a confusing UI failure.
 */

/**
 * The canonical vocabulary for a field every system spells differently.
 *
 * Pick one set of values the specs use, and make each adapter translate.
 * Without that, every spec grows a conditional per system and the differences
 * leak into tests that should not care.
 *
 * Replace with your own domain's fields.
 */
export const RecordSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    /** ISO 8601, e.g. "1990-05-04". */
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfBirth must be an ISO date'),
    status: z.enum(['active', 'inactive', 'unspecified']),
  })
  .strict();

/**
 * One fixture: how to find the record in each system, plus the resting values
 * every test restores it to.
 *
 * The identity map is per system because the same record carries a different
 * key in each, and resolving one from another at run time is exactly the
 * coupling that makes a cross-system suite brittle.
 */
export const FixtureSchema = z
  .object({
    /** Human-readable. Quoted in cleanup-failure messages. */
    description: z.string().min(1),
    identities: z.record(z.string(), z.string()),
    baseline: RecordSchema,
  })
  .strict();

export const FixturesSchema = z.array(FixtureSchema).min(1);

export type DomainRecord = z.infer<typeof RecordSchema>;
export type Fixture = z.infer<typeof FixtureSchema>;
