import { describe, expect, it, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import {
  createRingBuffer,
  ringPush,
  ringWindowSince,
  ringClear,
  ringToArray,
} from '../diagnostics/ringBuffer';
import {
  computeInstantRates,
  computeP95,
  computeSnapshot,
  initDiagnostics,
  pushPerfEvent,
  pushFrameEvent,
  resetDiagnostics,
  setDiagnosticsWindowMs,
  toggleDiagnosticsPause,
  isDiagnosticsPaused,
  getDiagnosticsConfig,
} from '../diagnostics/diagnosticsStore';
import { accumulateHistory } from '../diagnostics/useDiagnosticsSnapshot';
import { createReduxPerfMiddleware } from '../diagnostics/reduxPerfMiddleware';
import type { ReduxPerfEvent, FrameEvent, ActionRateHistory } from '../diagnostics/types';

// ── Ring buffer tests ──

describe('RingBuffer', () => {
  it('pushes items up to capacity', () => {
    const buf = createRingBuffer<number>(3);
    ringPush(buf, 1);
    ringPush(buf, 2);
    ringPush(buf, 3);
    expect(buf.items).toEqual([1, 2, 3]);
    expect(buf.total).toBe(3);
  });

  it('wraps at capacity, evicting oldest', () => {
    const buf = createRingBuffer<number>(3);
    ringPush(buf, 1);
    ringPush(buf, 2);
    ringPush(buf, 3);
    ringPush(buf, 4);
    expect(buf.total).toBe(4);
    expect(ringToArray(buf)).toEqual([2, 3, 4]);
  });

  it('ringWindowSince filters by timestamp', () => {
    const buf = createRingBuffer<{ ts: number; v: string }>(10);
    ringPush(buf, { ts: 100, v: 'a' });
    ringPush(buf, { ts: 200, v: 'b' });
    ringPush(buf, { ts: 300, v: 'c' });

    const result = ringWindowSince(buf, 200);
    expect(result.map((x) => x.v)).toEqual(['b', 'c']);
  });

  it('ringClear resets buffer', () => {
    const buf = createRingBuffer<number>(5);
    ringPush(buf, 1);
    ringPush(buf, 2);
    ringClear(buf);
    expect(buf.items).toEqual([]);
    expect(buf.total).toBe(0);
    expect(buf.cursor).toBe(0);
  });
});

// ── P95 calculation ──

describe('computeP95', () => {
  it('returns 0 for empty input', () => {
    expect(computeP95([])).toBe(0);
  });

  it('returns the single value for a 1-element array', () => {
    expect(computeP95([42])).toBe(42);
  });

  it('computes p95 correctly for 20 values', () => {
    // values 1..20, p95 = value at index ceil(20*0.95)-1 = 19-1 = 18 → value 19
    const values = Array.from({ length: 20 }, (_, i) => i + 1);
    expect(computeP95(values)).toBe(19);
  });

  it('computes p95 for unsorted input', () => {
    const values = [10, 1, 5, 3, 8, 2, 7, 4, 9, 6];
    // sorted: [1,2,3,4,5,6,7,8,9,10], p95 index = ceil(10*0.95)-1 = 9 → value 10
    expect(computeP95(values)).toBe(10);
  });
});

// ── Diagnostics store: rolling throughput math ──

describe('diagnosticsStore', () => {
  beforeEach(() => {
    initDiagnostics({ windowMs: 5000, maxEvents: 100, maxFrames: 100 });
  });

  it('computeSnapshot returns zeros when empty', () => {
    const snap = computeSnapshot();
    expect(snap.actionsPerSec).toBe(0);
    expect(snap.stateChangesPerSec).toBe(0);
    expect(snap.avgReducerMs).toBe(0);
    expect(snap.p95ReducerMs).toBe(0);
    expect(snap.fps).toBe(0);
    expect(snap.longFramesPerSec).toBe(0);
    expect(snap.topActionRates).toEqual([]);
  });

  it('counts actions per second in rolling window', () => {
    const now = Date.now();
    // Push 10 events within the last 5 seconds
    for (let i = 0; i < 10; i++) {
      pushPerfEvent({ ts: now - 100 * i, type: 'test/action', durationMs: 1, changed: true });
    }
    const snap = computeSnapshot();
    // 10 events / 5 seconds = 2 actions/sec
    expect(snap.actionsPerSec).toBe(2);
  });

  it('separates state-changing from non-changing actions', () => {
    const now = Date.now();
    pushPerfEvent({ ts: now, type: 'a', durationMs: 1, changed: true });
    pushPerfEvent({ ts: now, type: 'b', durationMs: 1, changed: false });
    pushPerfEvent({ ts: now, type: 'c', durationMs: 1, changed: true });

    const snap = computeSnapshot();
    expect(snap.actionsPerSec).toBeCloseTo(3 / 5, 1);
    expect(snap.stateChangesPerSec).toBeCloseTo(2 / 5, 1);
  });

  it('computes avg and p95 reducer latency', () => {
    const now = Date.now();
    const durations = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const d of durations) {
      pushPerfEvent({ ts: now, type: 'test', durationMs: d, changed: true });
    }
    const snap = computeSnapshot();
    expect(snap.avgReducerMs).toBeCloseTo(5.5, 1);
    expect(snap.p95ReducerMs).toBe(10); // ceil(10*0.95)-1 = 9 → value at index 9 = 10
  });

  it('ranks top action types by rate', () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) pushPerfEvent({ ts: now, type: 'hot/action', durationMs: 1, changed: true });
    for (let i = 0; i < 3; i++) pushPerfEvent({ ts: now, type: 'cool/action', durationMs: 1, changed: true });

    const snap = computeSnapshot();
    expect(snap.topActionRates[0].type).toBe('hot/action');
    expect(snap.topActionRates[1].type).toBe('cool/action');
    expect(snap.topActionRates[0].perSec).toBeGreaterThan(snap.topActionRates[1].perSec);
  });

  it('filters reduxPerf/* actions from top rates', () => {
    const now = Date.now();
    pushPerfEvent({ ts: now, type: 'reduxPerf/recordPerfEvent', durationMs: 1, changed: true });
    pushPerfEvent({ ts: now, type: 'app/realAction', durationMs: 1, changed: true });

    const snap = computeSnapshot();
    const types = snap.topActionRates.map((r) => r.type);
    expect(types).toContain('app/realAction');
    expect(types).not.toContain('reduxPerf/recordPerfEvent');
  });

  it('excludes events outside the rolling window', () => {
    const now = Date.now();
    pushPerfEvent({ ts: now - 10000, type: 'old', durationMs: 1, changed: true }); // outside 5s window
    pushPerfEvent({ ts: now, type: 'recent', durationMs: 1, changed: true });

    const snap = computeSnapshot();
    expect(snap.actionsPerSec).toBeCloseTo(1 / 5, 1); // only 1 in window
  });

  it('resetDiagnostics clears all data', () => {
    const now = Date.now();
    pushPerfEvent({ ts: now, type: 'x', durationMs: 1, changed: true });
    pushFrameEvent({ ts: now, durationMs: 16 });
    resetDiagnostics();

    const snap = computeSnapshot();
    expect(snap.actionsPerSec).toBe(0);
    expect(snap.fps).toBe(0);
  });

  it('setDiagnosticsWindowMs changes window', () => {
    setDiagnosticsWindowMs(1000);
    expect(getDiagnosticsConfig().windowMs).toBe(1000);

    const snap = computeSnapshot();
    expect(snap.windowMs).toBe(1000);
  });

  it('toggleDiagnosticsPause toggles state', () => {
    expect(isDiagnosticsPaused()).toBe(false);
    toggleDiagnosticsPause();
    expect(isDiagnosticsPaused()).toBe(true);
    toggleDiagnosticsPause();
    expect(isDiagnosticsPaused()).toBe(false);
  });

  it('computeInstantRates counts only events within the given interval', () => {
    const now = Date.now();
    // Events spread across time
    pushPerfEvent({ ts: now - 2000, type: 'old/action', durationMs: 1, changed: true });
    pushPerfEvent({ ts: now - 200, type: 'recent/action', durationMs: 1, changed: true });
    pushPerfEvent({ ts: now - 100, type: 'recent/action', durationMs: 1, changed: true });
    pushPerfEvent({ ts: now - 50, type: 'recent/action', durationMs: 1, changed: true });

    // 500ms window: should only see the 3 recent events
    const rates = computeInstantRates(500);
    const recentRate = rates.find((r) => r.type === 'recent/action');
    const oldRate = rates.find((r) => r.type === 'old/action');

    expect(recentRate).toBeDefined();
    expect(recentRate!.perSec).toBeCloseTo(3 / 0.5, 0); // 6/sec
    expect(oldRate).toBeUndefined(); // outside the 500ms window
  });
});

// ── Long-frame aggregation ──

describe('frame monitoring aggregation', () => {
  beforeEach(() => {
    initDiagnostics({ windowMs: 5000, maxFrames: 100, longFrameThresholdMs: 33.34 });
  });

  it('computes FPS from frame events', () => {
    const now = Date.now();
    // 60 frames at 16.67ms each ≈ 60fps
    for (let i = 0; i < 60; i++) {
      pushFrameEvent({ ts: now - (60 - i) * 16.67, durationMs: 16.67 });
    }
    const snap = computeSnapshot();
    expect(snap.fps).toBeCloseTo(60, 0);
  });

  it('counts long frames (>33.34ms)', () => {
    const now = Date.now();
    pushFrameEvent({ ts: now, durationMs: 16 });  // normal
    pushFrameEvent({ ts: now, durationMs: 50 });  // long
    pushFrameEvent({ ts: now, durationMs: 16 });  // normal
    pushFrameEvent({ ts: now, durationMs: 100 }); // long

    const snap = computeSnapshot();
    expect(snap.longFramesPerSec).toBeCloseTo(2 / 5, 1); // 2 long frames / 5s window
  });

  it('returns fps=0 with fewer than 2 frames', () => {
    const now = Date.now();
    pushFrameEvent({ ts: now, durationMs: 16 });
    const snap = computeSnapshot();
    expect(snap.fps).toBe(0);
  });
});

// ── Middleware state-change detection ──

describe('reduxPerfMiddleware', () => {
  beforeEach(() => {
    initDiagnostics({ windowMs: 5000, maxEvents: 100, maxFrames: 100 });
  });

  it('records events with state-change detection', () => {
    const middleware = createReduxPerfMiddleware();

    // Create a minimal store with the middleware
    const store = configureStore({
      reducer: {
        counter: (state: number = 0, action) =>
          action.type === 'increment' ? state + 1 : state,
      },
      middleware: (getDefault) => getDefault().concat(middleware),
    });

    // Action that changes state
    store.dispatch({ type: 'increment' });
    // Action that does NOT change state
    store.dispatch({ type: 'noop' });

    const snap = computeSnapshot();
    // 2 actions dispatched
    expect(snap.actionsPerSec).toBeCloseTo(2 / 5, 1);
    // 1 state change (increment), 1 no-change (noop)
    expect(snap.stateChangesPerSec).toBeCloseTo(1 / 5, 1);
  });

  it('records action type correctly', () => {
    const middleware = createReduxPerfMiddleware();
    const store = configureStore({
      reducer: { x: (s: number = 0) => s },
      middleware: (getDefault) => getDefault().concat(middleware),
    });

    store.dispatch({ type: 'myFeature/doSomething' });
    const snap = computeSnapshot();
    expect(snap.topActionRates.some((r) => r.type === 'myFeature/doSomething')).toBe(true);
  });
});

// ── Store factory diagnostics paths ──

describe('createAppStore diagnostics paths', () => {
  // We test the concept, not the actual createAppStore (which has many dependencies).
  // The key assertions: disabled path has no middleware, enabled path does.

  it('disabled path: store works without diagnostics reducer', () => {
    const store = configureStore({
      reducer: { counter: (s: number = 0) => s },
    });
    expect(store.getState()).toEqual({ counter: 0 });
    expect((store.getState() as Record<string, unknown>).reduxPerf).toBeUndefined();
  });

  it('enabled path: middleware records events', () => {
    initDiagnostics({ windowMs: 5000, maxEvents: 100, maxFrames: 100 });
    const middleware = createReduxPerfMiddleware();
    const store = configureStore({
      reducer: { counter: (state: number = 0, action) => action.type === 'inc' ? state + 1 : state },
      middleware: (getDefault) => getDefault().concat(middleware),
    });

    store.dispatch({ type: 'inc' });
    store.dispatch({ type: 'inc' });
    store.dispatch({ type: 'inc' });

    const snap = computeSnapshot();
    expect(snap.actionsPerSec).toBeGreaterThan(0);
    // No reduxPerf reducer in the store
    expect((store.getState() as Record<string, unknown>).reduxPerf).toBeUndefined();
  });
});

// ── Sparkline history accumulation and linger ──

describe('accumulateHistory', () => {
  const now = 100_000;

  it('creates new entries for previously unseen action types', () => {
    const prev = new Map<string, ActionRateHistory>();
    const rates = [{ type: 'a/foo', perSec: 5 }];

    const result = accumulateHistory(prev, rates, now);
    expect(result.size).toBe(1);
    const entry = result.get('a/foo')!;
    expect(entry.perSec).toBe(5);
    expect(entry.sparkline).toEqual([5]);
    expect(entry.peakPerSec).toBe(5);
    expect(entry.lastSeenTs).toBe(now);
  });

  it('appends to sparkline on subsequent ticks', () => {
    let history = new Map<string, ActionRateHistory>();
    history = accumulateHistory(history, [{ type: 'x', perSec: 10 }], now);
    history = accumulateHistory(history, [{ type: 'x', perSec: 20 }], now + 500);
    history = accumulateHistory(history, [{ type: 'x', perSec: 5 }], now + 1000);

    const entry = history.get('x')!;
    expect(entry.sparkline).toEqual([10, 20, 5]);
    expect(entry.perSec).toBe(5);
  });

  it('tracks peak across ticks', () => {
    let history = new Map<string, ActionRateHistory>();
    history = accumulateHistory(history, [{ type: 'x', perSec: 10 }], now);
    history = accumulateHistory(history, [{ type: 'x', perSec: 50 }], now + 500);
    history = accumulateHistory(history, [{ type: 'x', perSec: 3 }], now + 1000);

    expect(history.get('x')!.peakPerSec).toBe(50);
  });

  it('records 0 in sparkline when type disappears from current rates', () => {
    let history = new Map<string, ActionRateHistory>();
    history = accumulateHistory(history, [{ type: 'x', perSec: 10 }], now);
    // x not in current rates — should get 0
    history = accumulateHistory(history, [], now + 500);

    const entry = history.get('x')!;
    expect(entry.sparkline).toEqual([10, 0]);
    expect(entry.perSec).toBe(0);
    // lastSeenTs should not have updated
    expect(entry.lastSeenTs).toBe(now);
  });

  it('prunes entries that have lingered beyond the threshold', () => {
    let history = new Map<string, ActionRateHistory>();
    history = accumulateHistory(history, [{ type: 'old', perSec: 5 }], now, 30, 1000);
    // 1500ms later, still no activity — beyond 1000ms linger
    history = accumulateHistory(history, [], now + 1500, 30, 1000);

    expect(history.has('old')).toBe(false);
  });

  it('does NOT prune entries within the linger window', () => {
    let history = new Map<string, ActionRateHistory>();
    history = accumulateHistory(history, [{ type: 'recent', perSec: 5 }], now, 30, 5000);
    // 2s later, no activity — within 5000ms linger
    history = accumulateHistory(history, [], now + 2000, 30, 5000);

    expect(history.has('recent')).toBe(true);
    expect(history.get('recent')!.perSec).toBe(0);
  });

  it('caps sparkline to the configured length', () => {
    let history = new Map<string, ActionRateHistory>();
    for (let i = 0; i < 10; i++) {
      history = accumulateHistory(history, [{ type: 'x', perSec: i }], now + i * 500, 5);
    }

    const entry = history.get('x')!;
    expect(entry.sparkline.length).toBe(5);
    // Should have the last 5 values: 5,6,7,8,9
    expect(entry.sparkline).toEqual([5, 6, 7, 8, 9]);
  });

  it('handles multiple action types independently', () => {
    let history = new Map<string, ActionRateHistory>();
    history = accumulateHistory(history, [
      { type: 'a', perSec: 10 },
      { type: 'b', perSec: 20 },
    ], now);
    history = accumulateHistory(history, [
      { type: 'a', perSec: 15 },
      // b disappears
    ], now + 500);

    expect(history.get('a')!.sparkline).toEqual([10, 15]);
    expect(history.get('b')!.sparkline).toEqual([20, 0]);
    expect(history.get('a')!.peakPerSec).toBe(15);
    expect(history.get('b')!.peakPerSec).toBe(20);
  });

  it('pinned types survive linger pruning', () => {
    const pins = new Set(['sticky']);
    let history = new Map<string, ActionRateHistory>();
    history = accumulateHistory(history, [{ type: 'sticky', perSec: 5 }], now, 30, 1000, pins);
    // 5s later, well past 1000ms linger — but pinned
    history = accumulateHistory(history, [], now + 5000, 30, 1000, pins);

    expect(history.has('sticky')).toBe(true);
    expect(history.get('sticky')!.pinned).toBe(true);
    expect(history.get('sticky')!.perSec).toBe(0);
  });

  it('unpinned types get pruned normally after linger', () => {
    const pins = new Set(['sticky']);
    let history = new Map<string, ActionRateHistory>();
    history = accumulateHistory(history, [
      { type: 'sticky', perSec: 5 },
      { type: 'ephemeral', perSec: 5 },
    ], now, 30, 1000, pins);
    // 5s later
    history = accumulateHistory(history, [], now + 5000, 30, 1000, pins);

    expect(history.has('sticky')).toBe(true);
    expect(history.has('ephemeral')).toBe(false);
  });

  it('newly seen types get pinned flag from pinnedTypes set', () => {
    const pins = new Set(['pre-pinned']);
    let history = new Map<string, ActionRateHistory>();
    history = accumulateHistory(history, [{ type: 'pre-pinned', perSec: 3 }], now, 30, 1000, pins);

    expect(history.get('pre-pinned')!.pinned).toBe(true);
  });

  it('pinned flag updates when pin set changes', () => {
    let pins = new Set(['x']);
    let history = new Map<string, ActionRateHistory>();
    history = accumulateHistory(history, [{ type: 'x', perSec: 10 }], now, 30, 15000, pins);
    expect(history.get('x')!.pinned).toBe(true);

    // Unpin
    pins = new Set<string>();
    history = accumulateHistory(history, [{ type: 'x', perSec: 5 }], now + 500, 30, 15000, pins);
    expect(history.get('x')!.pinned).toBe(false);
  });
});
