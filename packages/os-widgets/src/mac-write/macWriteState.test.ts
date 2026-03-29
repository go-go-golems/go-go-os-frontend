import { describe, expect, it } from 'vitest';
import {
  createMacWriteStateSeed,
  macWriteActions,
  macWriteReducer,
} from './macWriteState';

describe('macWriteState', () => {
  it('creates seeded state', () => {
    const state = createMacWriteStateSeed({
      content: '# Notes',
      viewMode: 'preview',
      showFind: true,
    });

    expect(state.content).toBe('# Notes');
    expect(state.viewMode).toBe('preview');
    expect(state.showFind).toBe(true);
  });

  it('updates document and find state', () => {
    let state = createMacWriteStateSeed();

    state = macWriteReducer(state, macWriteActions.setContent('## Updated'));
    state = macWriteReducer(state, macWriteActions.setFindQuery('Updated'));
    state = macWriteReducer(state, macWriteActions.setReplaceQuery('Published'));
    state = macWriteReducer(state, macWriteActions.setScrollSync(false));

    expect(state.content).toBe('## Updated');
    expect(state.findQuery).toBe('Updated');
    expect(state.replaceQuery).toBe('Published');
    expect(state.scrollSync).toBe(false);
  });
});
