import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerRuntimeSurface,
  unregisterRuntimeSurface,
  getPendingRuntimeSurfaces,
  hasRuntimeSurface,
  onRegistryChange,
  clearRuntimeSurfaceRegistry,
  injectPendingRuntimeSurfaces,
  injectPendingRuntimeSurfacesWithReport,
} from './runtimeSurfaceRegistry';

beforeEach(() => {
  clearRuntimeSurfaceRegistry();
});

describe('runtimeSurfaceRegistry', () => {
  it('registers and retrieves runtime surfaces', () => {
    registerRuntimeSurface('lowStock', '({ ui }) => ({ render() { return ui.text("hi"); } })', 'kanban.v1');
    expect(hasRuntimeSurface('lowStock')).toBe(true);
    expect(getPendingRuntimeSurfaces()).toHaveLength(1);
    expect(getPendingRuntimeSurfaces()[0].surfaceId).toBe('lowStock');
    expect(getPendingRuntimeSurfaces()[0].code).toContain('ui.text');
    expect(getPendingRuntimeSurfaces()[0].packId).toBe('kanban.v1');
  });

  it('overwrites an existing surface with the same id', () => {
    registerRuntimeSurface('lowStock', 'v1', 'ui.card.v1');
    registerRuntimeSurface('lowStock', 'v2', 'kanban.v1');
    expect(getPendingRuntimeSurfaces()).toHaveLength(1);
    expect(getPendingRuntimeSurfaces()[0].code).toBe('v2');
    expect(getPendingRuntimeSurfaces()[0].packId).toBe('kanban.v1');
  });

  it('unregisters surfaces', () => {
    registerRuntimeSurface('lowStock', 'code', 'ui.card.v1');
    unregisterRuntimeSurface('lowStock');
    expect(hasRuntimeSurface('lowStock')).toBe(false);
    expect(getPendingRuntimeSurfaces()).toHaveLength(0);
  });

  it('notifies listeners on change', () => {
    const listener = vi.fn();
    const unsub = onRegistryChange(listener);
    registerRuntimeSurface('a', 'code-a', 'ui.card.v1');
    expect(listener).toHaveBeenCalledTimes(1);
    unregisterRuntimeSurface('a');
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    registerRuntimeSurface('b', 'code-b', 'ui.card.v1');
    expect(listener).toHaveBeenCalledTimes(2); // no more calls after unsub
  });

  it('injects pending surfaces into a service', () => {
    registerRuntimeSurface('lowStock', 'code-a', 'ui.card.v1');
    registerRuntimeSurface('catBrowser', 'code-b', 'kanban.v1');
    const service = { defineRuntimeSurface: vi.fn() };
    const injected = injectPendingRuntimeSurfaces(service, 'session-1');
    expect(injected).toEqual(['lowStock', 'catBrowser']);
    expect(service.defineRuntimeSurface).toHaveBeenCalledTimes(2);
    expect(service.defineRuntimeSurface).toHaveBeenCalledWith('session-1', 'lowStock', 'code-a', 'ui.card.v1');
    expect(service.defineRuntimeSurface).toHaveBeenCalledWith('session-1', 'catBrowser', 'code-b', 'kanban.v1');
  });

  it('continues injecting if one surface fails', () => {
    registerRuntimeSurface('bad', 'syntax error', 'ui.card.v1');
    registerRuntimeSurface('good', 'valid code', 'ui.card.v1');
    const service = {
      defineRuntimeSurface: vi.fn().mockImplementation((_s, surfaceId) => {
        if (surfaceId === 'bad') throw new Error('syntax error');
      }),
    };
    const injected = injectPendingRuntimeSurfaces(service, 'session-1');
    expect(injected).toEqual(['good']); // bad was skipped
    expect(service.defineRuntimeSurface).toHaveBeenCalledTimes(2);
  });

  it('returns injection failure details with report helper', () => {
    registerRuntimeSurface('bad', 'syntax error', 'ui.card.v1');
    registerRuntimeSurface('good', 'valid code', 'ui.card.v1');
    const service = {
      defineRuntimeSurface: vi.fn().mockImplementation((_s, surfaceId) => {
        if (surfaceId === 'bad') throw new Error('syntax error');
      }),
    };
    const report = injectPendingRuntimeSurfacesWithReport(service, 'session-1');
    expect(report.injected).toEqual(['good']);
    expect(report.failed).toEqual([{ surfaceId: 'bad', error: 'syntax error' }]);
  });

  it('rejects registration without a pack id', () => {
    expect(() => registerRuntimeSurface('broken', 'code', '')).toThrow(/packid is required/i);
  });
});
