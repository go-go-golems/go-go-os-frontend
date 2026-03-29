import { describe, expect, it } from 'vitest';
import { buildRequestActionBarKey, isInteractiveScriptSection, resolveSelectedTableRows } from './ConfirmRequestWindowHost';

describe('ConfirmRequestWindowHost table selection helpers', () => {
  it('keeps no-id rows distinct by index when rowKey is not provided', () => {
    const rows = [
      { env: 'staging', status: 'ok' },
      { env: 'prod', status: 'degraded' },
    ];

    const selected = resolveSelectedTableRows(rows, ['0', '1']);
    expect(selected).toEqual(rows);
  });

  it('respects explicit rowKey when provided', () => {
    const rows = [
      { key: 'srv-1', env: 'staging' },
      { key: 'srv-2', env: 'prod' },
    ];

    const selected = resolveSelectedTableRows(rows, ['srv-2'], 'key');
    expect(selected).toEqual([{ key: 'srv-2', env: 'prod' }]);
  });
});

describe('ConfirmRequestWindowHost action bar key helper', () => {
  it('changes key when request changes', () => {
    const first = buildRequestActionBarKey('req-1', '', 'confirm', 'response');
    const second = buildRequestActionBarKey('req-2', '', 'confirm', 'response');
    expect(first).not.toBe(second);
  });

  it('changes key when script step changes', () => {
    const first = buildRequestActionBarKey('req-1', 'confirm', 'rating', 'script');
    const second = buildRequestActionBarKey('req-1', 'rate', 'rating', 'script');
    expect(first).not.toBe(second);
  });
});

describe('ConfirmRequestWindowHost script section helpers', () => {
  it('treats kind=display sections without widgetType as non-interactive', () => {
    expect(isInteractiveScriptSection({ kind: 'display' })).toBe(false);
  });

  it('treats kind=interactive sections without widgetType as interactive', () => {
    expect(isInteractiveScriptSection({ kind: 'interactive' })).toBe(true);
  });
});
