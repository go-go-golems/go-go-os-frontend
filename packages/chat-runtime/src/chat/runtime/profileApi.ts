import {
  type ChatExtensionSchemaDocument,
  type ChatMiddlewareSchemaDocument,
  type ChatProfileDocument,
  type ChatProfileListItem,
} from './profileTypes';

function resolveBasePrefix(basePrefix?: string): string {
  return typeof basePrefix === 'string' ? basePrefix.replace(/\/$/, '') : '';
}

function withRegistry(url: string, registry?: string): string {
  const normalized = String(registry ?? '').trim();
  if (!normalized) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}registry=${encodeURIComponent(normalized)}`;
}

function toErrorMessage(body: string, fallback: string): string {
  const normalized = String(body ?? '').trim();
  return normalized.length > 0 ? normalized : fallback;
}

export class ChatProfileApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(options: { message: string; status: number; url: string }) {
    super(options.message);
    this.name = 'ChatProfileApiError';
    this.status = options.status;
    this.url = options.url;
  }
}

interface FetchOptions {
  basePrefix?: string;
  fetchImpl?: typeof fetch;
}

function invalidPayload(url: string, status: number, message: string): ChatProfileApiError {
  return new ChatProfileApiError({
    status,
    url,
    message,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneExtensions(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  return { ...value };
}

function decodeProfileListItems(
  payload: unknown,
  url: string,
  status: number
): ChatProfileListItem[] {
  const rows = Array.isArray(payload)
    ? payload
    : coerceIndexedObjectToList(payload, url, status);
  return rows.map((row, index) => decodeProfileListItem(row, url, status, index));
}

function coerceIndexedObjectToList(
  payload: unknown,
  url: string,
  status: number
): unknown[] {
  if (!isRecord(payload)) {
    throw invalidPayload(url, status, 'invalid profile list response: expected array');
  }
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    return [];
  }
  if (!keys.every((key) => /^[0-9]+$/.test(key))) {
    throw invalidPayload(url, status, 'invalid profile list response: expected array');
  }
  return keys
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => payload[key]);
}

function decodeProfileListItem(
  payload: unknown,
  url: string,
  status: number,
  index: number
): ChatProfileListItem {
  if (!isRecord(payload)) {
    throw invalidPayload(url, status, `invalid profile list item at index ${index}`);
  }
  const slug = typeof payload.slug === 'string' ? payload.slug.trim() : '';
  if (slug.length === 0) {
    throw invalidPayload(url, status, `invalid profile slug at index ${index}`);
  }
  const out: ChatProfileListItem = { slug };
  if (typeof payload.registry === 'string' && payload.registry.trim().length > 0) {
    out.registry = payload.registry.trim();
  }
  if (typeof payload.display_name === 'string') out.display_name = payload.display_name;
  if (typeof payload.description === 'string') out.description = payload.description;
  if (typeof payload.default_prompt === 'string') out.default_prompt = payload.default_prompt;
  if (typeof payload.is_default === 'boolean') out.is_default = payload.is_default;
  if (typeof payload.version === 'number' && Number.isFinite(payload.version)) {
    out.version = Math.trunc(payload.version);
  }
  const extensions = cloneExtensions(payload.extensions);
  if (extensions) {
    out.extensions = extensions;
  }
  return out;
}

function decodeProfileDocument(
  payload: unknown,
  url: string,
  status: number
): ChatProfileDocument {
  if (!isRecord(payload)) {
    throw invalidPayload(url, status, 'invalid profile document response');
  }
  const registry = typeof payload.registry === 'string' ? payload.registry.trim() : '';
  const slug = typeof payload.slug === 'string' ? payload.slug.trim() : '';
  if (registry.length === 0 || slug.length === 0 || typeof payload.is_default !== 'boolean') {
    throw invalidPayload(url, status, 'invalid profile document response');
  }
  const out: ChatProfileDocument = {
    registry,
    slug,
    is_default: payload.is_default,
  };
  if (typeof payload.display_name === 'string') out.display_name = payload.display_name;
  if (typeof payload.description === 'string') out.description = payload.description;
  if (isRecord(payload.runtime)) out.runtime = payload.runtime;
  if (isRecord(payload.policy)) out.policy = payload.policy;
  if (isRecord(payload.metadata)) out.metadata = payload.metadata;
  const extensions = cloneExtensions(payload.extensions);
  if (extensions) {
    out.extensions = extensions;
  }
  return out;
}

function decodeMiddlewareSchemas(
  payload: unknown,
  url: string,
  status: number
): ChatMiddlewareSchemaDocument[] {
  if (!Array.isArray(payload)) {
    throw invalidPayload(url, status, 'invalid middleware schema response: expected array');
  }
  return payload.map((row, index) => {
    if (!isRecord(row)) {
      throw invalidPayload(url, status, `invalid middleware schema at index ${index}`);
    }
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (name.length === 0) {
      throw invalidPayload(url, status, `invalid middleware name at index ${index}`);
    }
    const version = typeof row.version === 'number' && Number.isFinite(row.version)
      ? Math.trunc(row.version)
      : 1;
    const schema = cloneExtensions(row.schema);
    if (!schema) {
      throw invalidPayload(url, status, `invalid middleware schema payload at index ${index}`);
    }
    const out: ChatMiddlewareSchemaDocument = { name, version, schema };
    if (typeof row.display_name === 'string') out.display_name = row.display_name;
    if (typeof row.description === 'string') out.description = row.description;
    return out;
  });
}

function decodeExtensionSchemas(
  payload: unknown,
  url: string,
  status: number
): ChatExtensionSchemaDocument[] {
  if (!Array.isArray(payload)) {
    throw invalidPayload(url, status, 'invalid extension schema response: expected array');
  }
  return payload.map((row, index) => {
    if (!isRecord(row)) {
      throw invalidPayload(url, status, `invalid extension schema at index ${index}`);
    }
    const key = typeof row.key === 'string' ? row.key.trim() : '';
    if (key.length === 0) {
      throw invalidPayload(url, status, `invalid extension schema key at index ${index}`);
    }
    const schema = cloneExtensions(row.schema);
    if (!schema) {
      throw invalidPayload(url, status, `invalid extension schema payload at index ${index}`);
    }
    return { key, schema };
  });
}

async function parseJsonOrThrow(response: Response, url: string, fallback: string): Promise<unknown> {
  if (!response.ok) {
    const body = await response.text();
    throw new ChatProfileApiError({
      status: response.status,
      url,
      message: toErrorMessage(body, fallback),
    });
  }
  return response.json();
}

export async function listProfiles(
  registry?: string,
  options: FetchOptions = {}
): Promise<ChatProfileListItem[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = withRegistry(`${resolveBasePrefix(options.basePrefix)}/api/chat/profiles`, registry);
  const response = await fetchImpl(url);
  const payload = await parseJsonOrThrow(response, url, `profile list request failed (${response.status})`);
  return decodeProfileListItems(payload, url, response.status);
}

export async function getProfile(
  slug: string,
  registry?: string,
  options: FetchOptions = {}
): Promise<ChatProfileDocument> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = withRegistry(`${resolveBasePrefix(options.basePrefix)}/api/chat/profiles/${encodeURIComponent(slug)}`, registry);
  const response = await fetchImpl(url);
  const payload = await parseJsonOrThrow(response, url, `profile request failed (${response.status})`);
  return decodeProfileDocument(payload, url, response.status);
}

export async function listMiddlewareSchemas(options: FetchOptions = {}): Promise<ChatMiddlewareSchemaDocument[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${resolveBasePrefix(options.basePrefix)}/api/chat/schemas/middlewares`;
  const response = await fetchImpl(url);
  const payload = await parseJsonOrThrow(response, url, `middleware schema request failed (${response.status})`);
  return decodeMiddlewareSchemas(payload, url, response.status);
}

export async function listExtensionSchemas(options: FetchOptions = {}): Promise<ChatExtensionSchemaDocument[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `${resolveBasePrefix(options.basePrefix)}/api/chat/schemas/extensions`;
  const response = await fetchImpl(url);
  const payload = await parseJsonOrThrow(response, url, `extension schema request failed (${response.status})`);
  return decodeExtensionSchemas(payload, url, response.status);
}
