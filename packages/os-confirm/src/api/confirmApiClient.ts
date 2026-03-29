import type { ConfirmApiClient, ConfirmRequest, SubmitResponsePayload, SubmitScriptEventPayload } from '../types';
import { mapSubmitResponseToProto, mapUIRequestFromProto } from '../proto/confirmProtoAdapter';

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export class ConfirmApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`confirm-api: request failed (${status})`);
    this.name = 'ConfirmApiError';
    this.status = status;
    this.body = body;
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new ConfirmApiError(response.status, body);
  }
  return (await response.json()) as T;
}

export interface ConfirmApiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export function createConfirmApiClient(options: ConfirmApiClientOptions): ConfirmApiClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = trimTrailingSlash(options.baseUrl);

  return {
    async getRequest(requestId: string) {
      const raw = await parseJsonResponse<unknown>(await fetchImpl(`${baseUrl}/api/requests/${encodeURIComponent(requestId)}`));
      const request = mapUIRequestFromProto(raw);
      if (!request) {
        throw new Error('confirm-api: invalid UIRequest payload');
      }
      return request;
    },

    async submitResponse(request: ConfirmRequest, payload: SubmitResponsePayload) {
      const raw = await parseJsonResponse<unknown>(
        await fetchImpl(`${baseUrl}/api/requests/${encodeURIComponent(request.id)}/response`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(mapSubmitResponseToProto(request, payload)),
        }),
      );
      return mapUIRequestFromProto(raw);
    },

    async submitScriptEvent(requestId: string, payload: SubmitScriptEventPayload) {
      const raw = await parseJsonResponse<unknown>(
        await fetchImpl(`${baseUrl}/api/requests/${encodeURIComponent(requestId)}/event`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }),
      );
      return mapUIRequestFromProto(raw);
    },

    async touchRequest(requestId: string) {
      await parseJsonResponse<Record<string, unknown>>(
        await fetchImpl(`${baseUrl}/api/requests/${encodeURIComponent(requestId)}/touch`, {
          method: 'POST',
        }),
      );
    },
  };
}
