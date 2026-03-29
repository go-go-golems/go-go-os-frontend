import { stripTrailingWhitespace } from '../sem/semHelpers';
import type { TimelineEntity } from './timelineSlice';

export const SUGGESTIONS_ENTITY_KIND = 'suggestions';
export const STARTER_SUGGESTIONS_ENTITY_ID = 'suggestions:starter';
export const ASSISTANT_SUGGESTIONS_ENTITY_ID = 'suggestions:assistant';

const MAX_SUGGESTIONS = 8;

export const DEFAULT_CHAT_SUGGESTIONS = [
  'Show current inventory status',
  'What items are low stock?',
  'Summarize today sales',
];

export type SuggestionsSource = 'starter' | 'assistant';

export interface SuggestionsEntityProps {
  source: SuggestionsSource;
  items: string[];
  consumedAt?: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseSuggestionsSource(value: unknown): SuggestionsSource | null {
  return value === 'starter' || value === 'assistant' ? value : null;
}

export function normalizeSuggestionList(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const next = stripTrailingWhitespace(value).trim();
    if (!next) continue;

    const key = next.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(next);
    if (out.length >= MAX_SUGGESTIONS) {
      break;
    }
  }

  return out;
}

export function readSuggestionsEntityProps(entity: TimelineEntity | undefined): SuggestionsEntityProps | null {
  if (!entity || entity.kind !== SUGGESTIONS_ENTITY_KIND) {
    return null;
  }
  const props = asRecord(entity.props);
  if (!props) {
    return null;
  }

  const source = parseSuggestionsSource(props.source);
  if (!source) {
    return null;
  }

  const items = Array.isArray(props.items)
    ? normalizeSuggestionList(props.items.filter((value): value is string => typeof value === 'string'))
    : [];

  if (items.length === 0) {
    return null;
  }

  const consumedAt = typeof props.consumedAt === 'number' && Number.isFinite(props.consumedAt)
    ? props.consumedAt
    : undefined;

  return {
    source,
    items,
    consumedAt,
  };
}
