import { describe, expect, it } from 'vitest';
import {
  createNodeEditorStateSeed,
  nodeEditorActions,
  nodeEditorReducer,
} from './nodeEditorState';

describe('nodeEditorState', () => {
  it('creates a normalized seed', () => {
    const state = createNodeEditorStateSeed({
      selectedNodeId: 'n2',
      pan: { x: 120, y: -40 },
    });

    expect(state).toMatchObject({
      initialized: true,
      selectedNodeId: 'n2',
      pan: { x: 120, y: -40 },
    });
  });

  it('moves nodes and adds connections', () => {
    const seeded = createNodeEditorStateSeed();
    const moved = nodeEditorReducer(
      seeded,
      nodeEditorActions.moveNode({ nodeId: 'n1', x: 200, y: 220 }),
    );
    const connected = nodeEditorReducer(
      moved,
      nodeEditorActions.addConnection({ from: 'n2-out-0', to: 'n5-in-0' }),
    );

    expect(connected.nodes.find((node) => node.id === 'n1')).toMatchObject({
      x: 200,
      y: 220,
    });
    expect(
      connected.connections.some(
        (connection) => connection.from === 'n2-out-0' && connection.to === 'n5-in-0',
      ),
    ).toBe(true);
  });
});
