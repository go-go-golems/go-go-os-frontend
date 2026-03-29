import { describe, expect, it } from 'vitest';
import { validateRuntimeAction, validateRuntimeActions } from './intentSchema';

describe('validateRuntimeAction', () => {
  it('accepts actions with type and payload', () => {
    const action = validateRuntimeAction({
      type: 'inventory/updateQty',
      payload: { sku: 'A-1', delta: 2 },
    });

    expect(action).toEqual({
      type: 'inventory/updateQty',
      payload: { sku: 'A-1', delta: 2 },
      meta: undefined,
    });
  });

  it('accepts actions with meta', () => {
    const action = validateRuntimeAction({
      type: 'notify.show',
      payload: { message: 'Reserved A-1' },
      meta: { source: 'vm' },
    });

    expect(action.meta).toEqual({ source: 'vm' });
  });

  it('rejects non-object actions', () => {
    expect(() => validateRuntimeAction('nav.go' as never)).toThrow(/must be an object/i);
  });

  it('rejects actions without a type', () => {
    expect(() => validateRuntimeAction({ payload: 1 })).toThrow(/type/i);
  });

  it('rejects non-object meta values', () => {
    expect(() => validateRuntimeAction({ type: 'draft.patch', meta: [] })).toThrow(/meta/i);
  });
});

describe('validateRuntimeActions', () => {
  it('rejects malformed action arrays', () => {
    expect(() => validateRuntimeActions({} as never)).toThrow(/must be an array/i);
  });
});
