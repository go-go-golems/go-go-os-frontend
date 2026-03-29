import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { RuntimeDebugHooks } from '../cards/runtime';
import { ingestEvent } from './debugSlice';

const REDACT_KEYS = ['password', 'token', 'secret', 'authorization'];
const MAX_STRING = 256;
const MAX_ARRAY_ITEMS = 50;

function shouldRedact(key: string): boolean {
  const lower = key.toLowerCase();
  return REDACT_KEYS.some((needle) => lower.includes(needle));
}

export function sanitizeDebugValue(value: unknown): unknown {
  if (typeof value === 'function') {
    return `<function:${value.name || 'anonymous'}>`;
  }

  if (typeof value === 'string') {
    return value.length > MAX_STRING
      ? `${value.slice(0, MAX_STRING)}...<truncated:${value.length - MAX_STRING}>`
      : value;
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) {
      const head = value.slice(0, MAX_ARRAY_ITEMS).map(sanitizeDebugValue);
      return [...head, `<truncated:${value.length - MAX_ARRAY_ITEMS} items>`];
    }
    return value.map(sanitizeDebugValue);
  }

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = shouldRedact(key) ? '<redacted>' : sanitizeDebugValue(nested);
    }
    return out;
  }

  return value;
}

export function useStandardDebugHooks(): RuntimeDebugHooks {
  const dispatch = useDispatch();

  return useMemo<RuntimeDebugHooks>(
    () => ({
      onEvent: (event) => {
        dispatch(ingestEvent(event));
      },
      shouldCapture: () => true,
      sanitize: (payload) => sanitizeDebugValue(payload),
    }),
    [dispatch],
  );
}
