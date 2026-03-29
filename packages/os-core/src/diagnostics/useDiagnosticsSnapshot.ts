import { useCallback, useEffect, useRef, useState } from 'react';
import {
  computeInstantRates,
  computeSnapshot,
  getDiagnosticsConfig,
  isDiagnosticsPaused,
} from './diagnosticsStore';
import type { ActionRate, ActionRateHistory, ReduxPerfSnapshot } from './types';
import { DEFAULT_DIAGNOSTICS_CONFIG } from './types';

const DEFAULT_POLL_MS = 500;

/** Number of sparkline samples to keep per action type. */
const SPARKLINE_LENGTH = 30;

/** How long (ms) an action type lingers in the table after it stops firing. */
const LINGER_MS = 15_000;

/** Initial empty snapshot used before the first poll. */
function emptySnapshot(): ReduxPerfSnapshot {
  return {
    windowMs: DEFAULT_DIAGNOSTICS_CONFIG.windowMs,
    actionsPerSec: 0,
    stateChangesPerSec: 0,
    avgReducerMs: 0,
    p95ReducerMs: 0,
    fps: 0,
    longFramesPerSec: 0,
    topActionRates: [],
  };
}

/**
 * Accumulate action-rate history across poll ticks.
 *
 * - Each known action type gets its sparkline extended with the current rate
 *   (0 if not present in this snapshot).
 * - New action types are added.
 * - Peak is updated.
 * - Types whose lastSeenTs is older than LINGER_MS are pruned,
 *   unless they are in the `pinnedTypes` set.
 *
 * Pure function — returns a new map.
 */
export function accumulateHistory(
  prev: Map<string, ActionRateHistory>,
  currentRates: ActionRate[],
  now: number,
  sparklineLength = SPARKLINE_LENGTH,
  lingerMs = LINGER_MS,
  pinnedTypes: ReadonlySet<string> = new Set(),
): Map<string, ActionRateHistory> {
  const next = new Map<string, ActionRateHistory>();
  const currentMap = new Map(currentRates.map((r) => [r.type, r.perSec]));

  // Update existing entries
  for (const [type, entry] of prev) {
    const rate = currentMap.get(type) ?? 0;
    const sparkline = [...entry.sparkline, rate].slice(-sparklineLength);
    const lastSeenTs = rate > 0 ? now : entry.lastSeenTs;
    const peakPerSec = Math.max(entry.peakPerSec, rate);
    const pinned = pinnedTypes.has(type);

    // Prune if lingered too long — unless pinned
    if (!pinned && now - lastSeenTs > lingerMs) continue;

    next.set(type, { type, perSec: rate, sparkline, peakPerSec, lastSeenTs, pinned });
  }

  // Add new entries not in prev
  for (const r of currentRates) {
    if (next.has(r.type)) continue;
    next.set(r.type, {
      type: r.type,
      perSec: r.perSec,
      sparkline: [r.perSec],
      peakPerSec: r.perSec,
      lastSeenTs: now,
      pinned: pinnedTypes.has(r.type),
    });
  }

  return next;
}

/**
 * React hook that polls the module-level diagnostics store at a fixed
 * interval and returns the latest `ReduxPerfSnapshot` plus per-action-type
 * history (sparklines, peak rates) with linger behaviour.
 *
 * Completely independent of Redux — no `useSelector`, no store subscription.
 * The only thing that triggers a React render is the `setInterval` tick.
 *
 * @param pollMs  Polling interval in milliseconds. Default: 500.
 */
export function useDiagnosticsSnapshot(pollMs = DEFAULT_POLL_MS): {
  snapshot: ReduxPerfSnapshot;
  paused: boolean;
  windowMs: number;
  /** Action types with sparkline history + peak, sorted by current rate desc. */
  actionHistory: ActionRateHistory[];
  /** Toggle pin state for an action type. Pinned types are immune to linger pruning. */
  togglePin: (type: string) => void;
} {
  const [snapshot, setSnapshot] = useState<ReduxPerfSnapshot>(emptySnapshot);
  const [paused, setPaused] = useState(false);
  const [windowMs, setWindowMs] = useState(DEFAULT_DIAGNOSTICS_CONFIG.windowMs);
  const [actionHistory, setActionHistory] = useState<ActionRateHistory[]>([]);

  const historyRef = useRef<Map<string, ActionRateHistory>>(new Map());
  const pinnedRef = useRef<Set<string>>(new Set());

  const togglePin = useCallback((type: string) => {
    const pins = pinnedRef.current;
    if (pins.has(type)) {
      pins.delete(type);
    } else {
      pins.add(type);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const currentPaused = isDiagnosticsPaused();
      setPaused(currentPaused);
      setWindowMs(getDiagnosticsConfig().windowMs);

      if (!currentPaused) {
        const snap = computeSnapshot();
        setSnapshot(snap);

        // Use instant rates (events in last pollMs only) for sparkline data
        // instead of snap.topActionRates which uses the full rolling window
        // and causes overlap-smoothing between consecutive ticks.
        const instantRates = computeInstantRates(pollMs);

        const now = Date.now();
        historyRef.current = accumulateHistory(
          historyRef.current,
          instantRates,
          now,
          SPARKLINE_LENGTH,
          LINGER_MS,
          pinnedRef.current,
        );

        // Sort: pinned first, then active (rate>0) by rate desc, then lingering by lastSeen desc
        const sorted = Array.from(historyRef.current.values()).sort((a, b) => {
          // Pinned always on top
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          // Then active above lingering
          if (a.perSec > 0 && b.perSec === 0) return -1;
          if (a.perSec === 0 && b.perSec > 0) return 1;
          // Among active: by rate desc
          if (a.perSec > 0 && b.perSec > 0) return b.perSec - a.perSec;
          // Among lingering: most recent first
          return b.lastSeenTs - a.lastSeenTs;
        });

        setActionHistory(sorted);
      }
    }, pollMs);

    return () => clearInterval(id);
  }, [pollMs]);

  return { snapshot, paused, windowMs, actionHistory, togglePin };
}
