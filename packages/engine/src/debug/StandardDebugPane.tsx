import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RuntimeDebugPane } from '../components/shell/RuntimeDebugPane';
import {
  clearEvents,
  type DebugStateSlice,
  selectDebugKinds,
  selectDebugState,
  selectEvent,
  selectFilteredDebugEvents,
  selectSelectedDebugEvent,
  setKindFilter,
  setTextFilter,
  toggleCollapsed,
} from './debugSlice';

export interface StandardDebugPaneProps {
  /** Title shown in the debug pane header */
  title?: string;
  /** Selector that extracts domain state slices to show in the state inspector */
  snapshotSelector?: (state: any) => Record<string, unknown>;
}

/**
 * A ready-to-use debug pane that wires the standard debug slice to the
 * RuntimeDebugPane component. Apps only need to provide a snapshotSelector
 * to include app-specific state in the inspector.
 */
export function StandardDebugPane({ title = 'Debug Pane', snapshotSelector }: StandardDebugPaneProps) {
  const dispatch = useDispatch();
  const debug = useSelector(selectDebugState);
  const kinds = useSelector(selectDebugKinds);
  const filteredEvents = useSelector(selectFilteredDebugEvents);
  const selected = useSelector(selectSelectedDebugEvent);
  const defaultRuntimeState = useSelector((state: DebugStateSlice & Record<string, unknown>) => {
    if ('runtimeSessions' in state) {
      return state.runtimeSessions;
    }
    if ('pluginCardRuntime' in state) {
      return state.pluginCardRuntime;
    }
    return undefined;
  });
  const selectedSnapshot = useSelector(
    snapshotSelector ?? (() => undefined as Record<string, unknown> | undefined),
  );

  const snapshot = useMemo(() => {
    if (selectedSnapshot) {
      return selectedSnapshot;
    }
    if (defaultRuntimeState !== undefined) {
      return { runtime: defaultRuntimeState };
    }
    return {};
  }, [defaultRuntimeState, selectedSnapshot]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of debug.events) {
      counts[event.kind] = (counts[event.kind] ?? 0) + 1;
    }
    return counts;
  }, [debug.events]);

  return (
    <RuntimeDebugPane
      title={title}
      collapsed={debug.collapsed}
      events={debug.events}
      filteredEvents={filteredEvents}
      selectedEvent={selected}
      kinds={kinds}
      kindFilter={debug.filters.kind}
      textFilter={debug.filters.text}
      snapshot={snapshot}
      stats={stats}
      onToggleCollapsed={() => dispatch(toggleCollapsed())}
      onClear={() => dispatch(clearEvents())}
      onSelectEvent={(id) => dispatch(selectEvent(id))}
      onKindFilterChange={(kind) => dispatch(setKindFilter(kind))}
      onTextFilterChange={(text) => dispatch(setTextFilter(text))}
    />
  );
}
