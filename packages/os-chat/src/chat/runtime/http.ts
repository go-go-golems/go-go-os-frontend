import { stripTrailingWhitespace } from '../sem/semHelpers';
import type { ChatProfileSelection } from './profileTypes';

function resolveBasePrefix(basePrefix?: string): string {
  return typeof basePrefix === 'string' ? basePrefix.replace(/\/$/, '') : '';
}

function toErrorMessage(body: string, fallback: string): string {
  const normalized = stripTrailingWhitespace(body).trim();
  return normalized.length > 0 ? normalized : fallback;
}

export type ChatHttpErrorStage = 'send' | 'hydrate';

export class ChatHttpError extends Error {
  readonly status: number;
  readonly stage: ChatHttpErrorStage;
  readonly url: string;

  constructor(options: { message: string; status: number; stage: ChatHttpErrorStage; url: string }) {
    super(options.message);
    this.name = 'ChatHttpError';
    this.status = options.status;
    this.stage = options.stage;
    this.url = options.url;
  }
}

export interface SubmitPromptOptions {
  fetchImpl?: typeof fetch;
  profileSelection?: ChatProfileSelection;
}

function applyProfileSelection(
  payload: Record<string, unknown>,
  profileSelection?: ChatProfileSelection
) {
  if (!profileSelection) {
    return;
  }
  const profile = String(profileSelection.profile ?? '').trim();
  if (profile.length > 0) {
    payload.profile = profile;
  }
  const registry = String(profileSelection.registry ?? '').trim();
  if (registry.length > 0) {
    payload.registry = registry;
  }
}

export async function submitPrompt(
  prompt: string,
  convId: string,
  basePrefix = '',
  options: SubmitPromptOptions | typeof fetch = fetch
): Promise<void> {
  const fetchImpl = typeof options === 'function' ? options : (options.fetchImpl ?? fetch);
  const profileSelection = typeof options === 'function' ? undefined : options.profileSelection;
  const url = `${resolveBasePrefix(basePrefix)}/chat`;
  const payload: Record<string, unknown> = {
    prompt,
    conv_id: convId,
  };
  applyProfileSelection(payload, profileSelection);
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ChatHttpError({
      message: toErrorMessage(body, `chat request failed (${response.status})`),
      status: response.status,
      stage: 'send',
      url,
    });
  }
}

export async function fetchTimelineSnapshot(
  convId: string,
  basePrefix = '',
  fetchImpl: typeof fetch = fetch
): Promise<unknown> {
  const url = `${resolveBasePrefix(basePrefix)}/api/timeline?conv_id=${encodeURIComponent(convId)}`;
  const response = await fetchImpl(url);

  if (!response.ok) {
    const body = await response.text();
    throw new ChatHttpError({
      message: toErrorMessage(body, `timeline request failed (${response.status})`),
      status: response.status,
      stage: 'hydrate',
      url,
    });
  }

  return response.json();
}
