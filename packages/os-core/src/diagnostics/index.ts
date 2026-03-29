// ── Diagnostics: Redux throughput & FPS monitoring ──

export type {
  ActionRate,
  ActionRateHistory,
  DiagnosticsConfig,
  FrameEvent,
  ReduxPerfEvent,
  ReduxPerfSnapshot,
} from './types';
export { DEFAULT_DIAGNOSTICS_CONFIG } from './types';

export {
  createRingBuffer,
  ringClear,
  ringPush,
  ringToArray,
  ringWindowSince,
  type RingBufferState,
} from './ringBuffer';

export {
  computeInstantRates,
  computeP95,
  computeSnapshot,
  getDiagnosticsConfig,
  initDiagnostics,
  isDiagnosticsPaused,
  pushFrameEvent,
  pushPerfEvent,
  resetDiagnostics,
  setDiagnosticsWindowMs,
  toggleDiagnosticsPause,
} from './diagnosticsStore';

export {
  createReduxPerfMiddleware,
  type ReduxPerfMiddlewareOptions,
} from './reduxPerfMiddleware';

export { startFrameMonitor } from './frameMonitor';

export { accumulateHistory, useDiagnosticsSnapshot } from './useDiagnosticsSnapshot';
