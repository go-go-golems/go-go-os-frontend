import { describe, expect, it } from 'vitest';
import { generateSampleLogs } from './sampleData';
import {
  createLogViewerStateSeed,
  logViewerActions,
  logViewerReducer,
  serializeLogEntry,
} from './logViewerState';

describe('logViewerState', () => {
  it('initializes from seeded logs and updates toggles', () => {
    const seededLogs = generateSampleLogs(4);

    let state = logViewerReducer(undefined, { type: 'unknown' });
    expect(state.initialized).toBe(false);

    state = logViewerReducer(
      state,
      logViewerActions.initializeIfNeeded({
        logs: seededLogs,
        streaming: true,
        search: 'worker',
      }),
    );

    expect(state.initialized).toBe(true);
    expect(state.entries).toHaveLength(4);
    expect(state.streaming).toBe(true);
    expect(state.search).toBe('worker');

    state = logViewerReducer(state, logViewerActions.toggleLevel('INFO'));
    expect(state.levels).not.toContain('INFO');

    state = logViewerReducer(state, logViewerActions.setServiceFilter('api-gateway'));
    expect(state.serviceFilter).toBe('api-gateway');
  });

  it('resets appended entries back to the seeded baseline', () => {
    const seededLogs = generateSampleLogs(3);
    const extraEntry = generateSampleLogs(1)[0];

    let state = logViewerReducer(
      undefined,
      logViewerActions.replaceState(
        createLogViewerStateSeed({
          logs: seededLogs,
          selectedId: seededLogs[1]?.id ?? null,
        }),
      ),
    );

    state = logViewerReducer(
      state,
      logViewerActions.appendEntry(serializeLogEntry(extraEntry)),
    );
    expect(state.entries).toHaveLength(4);

    state = logViewerReducer(state, logViewerActions.resetToBaseline());
    expect(state.entries).toHaveLength(3);
    expect(state.selectedId).toBeNull();
  });
});
