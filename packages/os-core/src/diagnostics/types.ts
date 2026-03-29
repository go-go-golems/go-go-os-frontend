/** ── Redux Performance Diagnostics Types ── */

/** A single Redux dispatch timing sample. */
export interface ReduxPerfEvent {
  /** Timestamp (ms since epoch) when the action was dispatched. */
  ts: number;
  /** Redux action type string. */
  type: string;
  /** Time (ms) the reducer chain took for this action. */
  durationMs: number;
  /** Whether root state reference changed after this dispatch. */
  changed: boolean;
}

/** Aggregated rolling-window diagnostics snapshot. */
export interface ReduxPerfSnapshot {
  /** Rolling window duration in milliseconds. */
  windowMs: number;
  /** Actions dispatched per second in the window. */
  actionsPerSec: number;
  /** State-changing dispatches per second. */
  stateChangesPerSec: number;
  /** Average reducer duration (ms) across events in the window. */
  avgReducerMs: number;
  /** 95th-percentile reducer duration (ms). */
  p95ReducerMs: number;
  /** Current frames per second (from rAF monitor). */
  fps: number;
  /** Long frames (>33ms) per second. */
  longFramesPerSec: number;
  /** Top action types ranked by dispatch rate. */
  topActionRates: ActionRate[];
}

/** Per-action-type throughput entry (single snapshot). */
export interface ActionRate {
  type: string;
  perSec: number;
}

/** Per-action-type throughput with history, for the UI table. */
export interface ActionRateHistory {
  type: string;
  /** Current rate in the rolling window. */
  perSec: number;
  /** Recent rate samples (oldest first), one per poll tick. */
  sparkline: number[];
  /** All-time peak rate observed. */
  peakPerSec: number;
  /** Timestamp of last non-zero observation. Used for linger logic. */
  lastSeenTs: number;
  /** Whether this action type is pinned (immune to linger pruning). */
  pinned: boolean;
}

/** A single frame timing sample from the rAF monitor. */
export interface FrameEvent {
  /** Timestamp of the frame (ms). */
  ts: number;
  /** Duration since the previous frame (ms). */
  durationMs: number;
}

/** Configuration for the diagnostics system. */
export interface DiagnosticsConfig {
  /** Rolling window duration in milliseconds. Default: 5000. */
  windowMs: number;
  /** Long-frame threshold in milliseconds. Default: 33.34 (~30fps). */
  longFrameThresholdMs: number;
  /** Maximum number of raw events to retain. Default: 2000. */
  maxEvents: number;
  /** Maximum number of frame samples to retain. Default: 600. */
  maxFrames: number;
}

export const DEFAULT_DIAGNOSTICS_CONFIG: DiagnosticsConfig = {
  windowMs: 5000,
  longFrameThresholdMs: 33.34,
  maxEvents: 2000,
  maxFrames: 600,
};
