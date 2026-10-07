import type { APIRequestContext, APIResponse } from '@playwright/test';

import { BaseApiClient, type ApiClientOptions } from './base.client';
import { ResourceListSchema, ResourceSchema, type Resource } from './schemas/example.schema';

/**
 * Template API client. Replace the routes with your service's.
 *
 * Two kinds of method, and the difference matters:
 *
 *   `getResource`    asserts success and returns a validated body. For the
 *                    arrange steps, where a failure is a broken fixture and
 *                    the spec should say so immediately.
 *
 *   `createResponse` returns the raw response. For the act step, where the
 *                    status code is the thing under test and the client must
 *                    not decide for the spec whether 400 is a failure.
 *
 * Collapsing these into one method is how a suite ends up unable to test its
 * own error paths.
 */
export class ExampleApiClient extends BaseApiClient {
  constructor(request: APIRequestContext, options: ApiClientOptions) {
    super(request, options);
  }

  async listResources(): Promise<Resource[]> {
    const response = await this.request.get(this.url('resources'), { headers: this.headers() });
    await this.expectOk(response, 'GET /resources');

    return this.parse(response, ResourceListSchema, 'GET /resources');
  }

  async getResource(id: string | number): Promise<Resource> {
    const response = await this.request.get(this.url(`resources/${id}`), { headers: this.headers() });
    await this.expectOk(response, `GET /resources/${id}`);

    return this.parse(response, ResourceSchema, `GET /resources/${id}`);
  }

  /** Raw response: the caller is testing the status, not just the happy path. */
  async createResponse(body: Record<string, unknown>): Promise<APIResponse> {
    return this.request.post(this.url('resources'), {
      headers: this.headers({ 'Content-Type': 'application/json' }),
      data: body,
    });
  }

  async create(body: Record<string, unknown>): Promise<Resource> {
    const response = await this.createResponse(body);
    await this.expectOk(response, 'POST /resources');

    return this.parse(response, ResourceSchema, 'POST /resources');
  }

  async deleteResource(id: string | number): Promise<void> {
    const response = await this.request.delete(this.url(`resources/${id}`), { headers: this.headers() });
    await this.expectOk(response, `DELETE /resources/${id}`);
  }
}
