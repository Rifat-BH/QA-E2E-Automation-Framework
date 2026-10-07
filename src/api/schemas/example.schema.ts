import { z } from 'zod';

/**
 * Response contracts, declared once and reused by every spec that touches
 * the endpoint.
 *
 * `.strict()` on an API you own. A field the server renames or drops then
 * fails at the boundary, naming the field, instead of surfacing three
 * assertions later as a complaint about `undefined`. That is the single
 * highest-value habit in an API suite: it turns silent contract drift into a
 * loud, specific failure.
 *
 * Leave `.strict()` off for a third party's API, where a field they add for
 * their own reasons is not your regression.
 */

export const ResourceSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    createdAt: z.string().datetime().optional(),
  })
  .strict();

export const ResourceListSchema = z.array(ResourceSchema);

/** A third party's shape: permissive on purpose. */
export const ExternalResourceSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().nullable(),
});

export type Resource = z.infer<typeof ResourceSchema>;
export type ExternalResource = z.infer<typeof ExternalResourceSchema>;
