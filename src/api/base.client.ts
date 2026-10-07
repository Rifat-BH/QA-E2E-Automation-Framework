import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';

export interface ApiClientOptions {
  baseUrl: string;
  /** Sent as `Authorization: Bearer <token>` when present. */
  token?: string;
  /** Merged into every request, for tenant or vendor headers. */
  defaultHeaders?: Record<string, string>;
}

/**
 * What every API client inherits.
 *
 * Specs call named methods on a client, never a raw URL. A route that changes
 * is then one edit here rather than a search across every spec that touched
 * it, and a spec reads as the behaviour it checks instead of a sequence of
 * HTTP calls.
 */
export abstract class BaseApiClient {
  protected constructor(
    protected readonly request: APIRequestContext,
    private readonly options: ApiClientOptions,
  ) {}

  protected url(path: string): string {
    return `${this.options.baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }

  protected headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      accept: 'application/json',
      ...(this.options.token ? { Authorization: `Bearer ${this.options.token}` } : {}),
      ...this.options.defaultHeaders,
      ...extra,
    };
  }

  /**
   * Validates a response body against a schema and returns it typed.
   *
   * Declare schemas with `.strict()` for an API you own: a field the server
   * drops or renames then fails here, naming the field, instead of surfacing
   * as an assertion about an undefined value somewhere downstream. Leave
   * `.strict()` off for a third party's API, where a field they add for their
   * own reasons is not your regression.
   */
  protected async parse<T>(response: APIResponse, schema: ZodType<T>, context: string): Promise<T> {
    const body: unknown = await response.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      throw new Error(
        `${context} returned ${response.status()} with a body that does not match its schema:\n` +
          `${result.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n')}\n` +
          `Body: ${JSON.stringify(body)}`,
      );
    }

    return result.data;
  }

  /**
   * Fails with the body included.
   *
   * A bare status code sends the reader to the server logs. The body usually
   * already says which field was rejected and why, so including it is often
   * the difference between a one-minute fix and a half-hour hunt.
   */
  protected async expectOk(response: APIResponse, context: string): Promise<APIResponse> {
    if (!response.ok()) {
      throw new Error(`${context} returned ${response.status()}: ${await response.text()}`);
    }

    return response;
  }
}
