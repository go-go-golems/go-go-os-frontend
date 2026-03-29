import { describe, expect, it } from 'vitest';
import {
  createGraphNavigatorStateSeed,
  graphNavigatorActions,
  graphNavigatorReducer,
} from './graphNavigatorState';

describe('graphNavigatorState', () => {
  it('creates a normalized seed', () => {
    const state = createGraphNavigatorStateSeed({
      selectedNodeId: 'n3',
      filterType: 'Company',
      query: 'MATCH (n:Company) RETURN n',
    });

    expect(state).toMatchObject({
      initialized: true,
      selectedNodeId: 'n3',
      filterType: 'Company',
      query: 'MATCH (n:Company) RETURN n',
    });
  });

  it('updates selection and logs queries', () => {
    const seeded = createGraphNavigatorStateSeed();
    const updated = graphNavigatorReducer(
      graphNavigatorReducer(seeded, graphNavigatorActions.setSelectedNodeId('n4')),
      graphNavigatorActions.appendQueryLog('// Selected: GraphDB'),
    );

    expect(updated.selectedNodeId).toBe('n4');
    expect(updated.queryLog.at(-1)).toBe('// Selected: GraphDB');
  });
});
