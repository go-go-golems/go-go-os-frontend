import type { RuntimeAction } from './contracts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateRuntimeAction(value: unknown): RuntimeAction {
  if (!isRecord(value)) {
    throw new Error('Runtime action must be an object');
  }

  if (typeof value.type !== 'string' || value.type.length === 0) {
    throw new Error('Runtime action type must be a non-empty string');
  }

  if (value.meta !== undefined && !isRecord(value.meta)) {
    throw new Error('Runtime action meta must be an object when provided');
  }

  return {
    type: value.type,
    payload: value.payload,
    meta: value.meta,
  };
}

export function validateRuntimeActions(value: unknown): RuntimeAction[] {
  if (!Array.isArray(value)) {
    throw new Error('Runtime actions result must be an array');
  }

  return value.map((action) => validateRuntimeAction(action));
}
