import { pushFrameEvent } from './diagnosticsStore';
import type { FrameEvent } from './types';

/**
 * Starts a `requestAnimationFrame` loop that measures inter-frame timing
 * and writes samples into the module-level diagnostics store.
 *
 * **Does not dispatch any Redux actions** — frame data lives entirely
 * outside the Redux store to avoid polluting what it measures.
 *
 * Returns a cleanup function that cancels the loop.
 */
export function startFrameMonitor(): () => void {
  let rafId: number | null = null;
  let lastTimestamp: number | null = null;
  let active = true;

  function tick(timestamp: number) {
    if (!active) return;

    if (lastTimestamp !== null) {
      const durationMs = timestamp - lastTimestamp;
      const event: FrameEvent = {
        ts: Date.now(),
        durationMs,
      };
      pushFrameEvent(event);
    }

    lastTimestamp = timestamp;
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    active = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}
