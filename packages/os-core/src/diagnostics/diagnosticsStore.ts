/**
 * Module-level mutable storage for diagnostics telemetry.
 *
 * No Redux — just plain ring buffers mutated directly by the middleware
 * and frame monitor. The UI reads via polling (useDiagnosticsSnapshot).
 */
import { createRingBuffer, ringClear, ringPush, ringWindowSince, type RingBufferState } from './ringBuffer';
import type { DiagnosticsConfig, FrameEvent, ReduxPerfEvent, ReduxPerfSnapshot, ActionRate } from './types';
import { DEFAULT_DIAGNOSTICS_CONFIG } from './types';

// ── Module-level state ──

let config: DiagnosticsConfig = { ...DEFAULT_DIAGNOSTICS_CONFIG };
let events: RingBufferState<ReduxPerfEvent> = createRingBuffer(config.maxEvents);
let frames: RingBufferState<FrameEvent> = createRingBuffer(config.maxFrames);
let paused = false;

// ── Write API (called by middleware / frame monitor) ──

export function pushPerfEvent(event: ReduxPerfEvent): void {
  ringPush(events, event);
}

export function pushFrameEvent(event: FrameEvent): void {
  ringPush(frames, event);
}

// ── Control API (called by UI) ──

export function resetDiagnostics(): void {
  ringClear(events);
  ringClear(frames);
}

export function toggleDiagnosticsPause(): void {
  paused = !paused;
}

export function isDiagnosticsPaused(): boolean {
  return paused;
}

export function setDiagnosticsWindowMs(ms: number): void {
  config = { ...config, windowMs: ms };
}

export function getDiagnosticsConfig(): DiagnosticsConfig {
  return config;
}

/** Re-initialise with custom config (e.g. at store creation). */
export function initDiagnostics(overrides?: Partial<DiagnosticsConfig>): void {
  config = { ...DEFAULT_DIAGNOSTICS_CONFIG, ...overrides };
  events = createRingBuffer(config.maxEvents);
  frames = createRingBuffer(config.maxFrames);
  paused = false;
}

// ── Snapshot computation (called by polling hook) ──

export function computeSnapshot(): ReduxPerfSnapshot {
  const now = Date.now();
  const windowMs = config.windowMs;
  const sinceTs = now - windowMs;
  const windowSec = windowMs / 1000;

  const windowEvents = ringWindowSince<ReduxPerfEvent>(events, sinceTs);
  const windowFrames = ringWindowSince<FrameEvent>(frames, sinceTs);

  // ── Action throughput ──
  const actionsPerSec = windowEvents.length / windowSec;
  const stateChanges = windowEvents.filter((e) => e.changed).length;
  const stateChangesPerSec = stateChanges / windowSec;

  // ── Reducer latency ──
  const durations = windowEvents.map((e) => e.durationMs);
  const avgReducerMs =
    durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;
  const p95ReducerMs = computeP95(durations);

  // ── FPS ──
  const fps = computeFps(windowFrames);
  const longFrames = windowFrames.filter(
    (f) => f.durationMs > config.longFrameThresholdMs,
  ).length;
  const longFramesPerSec = longFrames / windowSec;

  // ── Top action rates (exclude diagnostics-internal types) ──
  const topActionRates = computeTopActionRates(windowEvents, windowSec, 10);

  return {
    windowMs,
    actionsPerSec,
    stateChangesPerSec,
    avgReducerMs,
    p95ReducerMs,
    fps,
    longFramesPerSec,
    topActionRates,
  };
}

// ── Pure math helpers (exported for unit testing) ──

export function computeP95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, idx)];
}

function computeFps(windowFrames: FrameEvent[]): number {
  if (windowFrames.length < 2) return 0;
  const totalDuration = windowFrames.reduce((sum, f) => sum + f.durationMs, 0);
  if (totalDuration === 0) return 0;
  return (windowFrames.length / totalDuration) * 1000;
}

/** Prefix used for internal diagnostics actions (filtered out of top rates). */
const DIAGNOSTICS_PREFIX = 'reduxPerf/';

function computeTopActionRates(
  windowEvents: ReduxPerfEvent[],
  windowSec: number,
  topN: number,
): ActionRate[] {
  const counts = new Map<string, number>();
  for (const e of windowEvents) {
    if (e.type.startsWith(DIAGNOSTICS_PREFIX)) continue;
    counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, perSec: count / windowSec }))
    .sort((a, b) => b.perSec - a.perSec)
    .slice(0, topN);
}

/**
 * Compute per-action-type rates over a short interval (for sparkline samples).
 *
 * Unlike `computeSnapshot().topActionRates` which uses the full rolling window,
 * this counts only events in the last `intervalMs` to produce instantaneous rates
 * without overlap-smoothing between consecutive poll ticks.
 */
export function computeInstantRates(intervalMs: number): ActionRate[] {
  const now = Date.now();
  const sinceTs = now - intervalMs;
  const intervalSec = intervalMs / 1000;
  const windowEvents = ringWindowSince<ReduxPerfEvent>(events, sinceTs);

  const counts = new Map<string, number>();
  for (const e of windowEvents) {
    if (e.type.startsWith(DIAGNOSTICS_PREFIX)) continue;
    counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, perSec: count / intervalSec }))
    .sort((a, b) => b.perSec - a.perSec);
}
