import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { INITIAL_CONNECTIONS, INITIAL_NODES } from './sampleData';
import type { Connection, GraphNode } from './types';

export const NODE_EDITOR_STATE_KEY = 'app_rw_node_editor' as const;

export interface NodeEditorStateSeed {
  initialNodes?: readonly GraphNode[];
  initialConnections?: readonly Connection[];
  selectedNodeId?: string | null;
  pan?: { x: number; y: number };
}

export interface NodeEditorState {
  initialized: boolean;
  nodes: GraphNode[];
  connections: Connection[];
  selectedNodeId: string | null;
  pan: { x: number; y: number };
}

type NodeEditorModuleState = NodeEditorState | undefined;
type NodeEditorStateInput = NodeEditorStateSeed | NodeEditorState | undefined;

function cloneNode(node: GraphNode): GraphNode {
  return {
    ...node,
    inputs: node.inputs.map((port) => ({ ...port })),
    outputs: node.outputs.map((port) => ({ ...port })),
    fields: node.fields.map((field) => ({ ...field })),
  };
}

function cloneConnection(connection: Connection): Connection {
  return { ...connection };
}

export function createNodeEditorStateSeed(
  seed: NodeEditorStateSeed = {},
): NodeEditorState {
  return {
    initialized: true,
    nodes: (seed.initialNodes ?? INITIAL_NODES).map(cloneNode),
    connections: (seed.initialConnections ?? INITIAL_CONNECTIONS).map(cloneConnection),
    selectedNodeId: seed.selectedNodeId ?? null,
    pan: seed.pan ?? { x: 0, y: 0 },
  };
}

function materializeNodeEditorState(seed: NodeEditorStateInput): NodeEditorState {
  if (seed && typeof seed === 'object' && 'nodes' in seed && 'connections' in seed) {
    return {
      ...seed,
      nodes: seed.nodes.map(cloneNode),
      connections: seed.connections.map(cloneConnection),
      pan: { ...seed.pan },
    };
  }
  return createNodeEditorStateSeed(seed);
}

const initialState: NodeEditorState = {
  ...createNodeEditorStateSeed(),
  initialized: false,
};

export const nodeEditorSlice = createSlice({
  name: 'nodeEditor',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<NodeEditorStateInput>) {
      if (state.initialized) return;
      return materializeNodeEditorState(action.payload);
    },
    replaceState(_state, action: PayloadAction<NodeEditorStateInput>) {
      return materializeNodeEditorState(action.payload);
    },
    setSelectedNodeId(state, action: PayloadAction<string | null>) {
      state.selectedNodeId = action.payload;
    },
    moveNode(
      state,
      action: PayloadAction<{ nodeId: string; x: number; y: number }>,
    ) {
      const node = state.nodes.find((item) => item.id === action.payload.nodeId);
      if (node) {
        node.x = action.payload.x;
        node.y = action.payload.y;
      }
    },
    setPan(state, action: PayloadAction<{ x: number; y: number }>) {
      state.pan = action.payload;
    },
    addConnection(state, action: PayloadAction<Connection>) {
      const exists = state.connections.some(
        (connection) =>
          connection.from === action.payload.from &&
          connection.to === action.payload.to,
      );
      if (!exists) {
        state.connections.push(cloneConnection(action.payload));
      }
    },
    deleteSelectedNode(state) {
      if (!state.selectedNodeId) return;
      state.nodes = state.nodes.filter((node) => node.id !== state.selectedNodeId);
      state.connections = state.connections.filter(
        (connection) =>
          !connection.from.startsWith(state.selectedNodeId!) &&
          !connection.to.startsWith(state.selectedNodeId!),
      );
      state.selectedNodeId = null;
    },
    addNode(state, action: PayloadAction<GraphNode>) {
      state.nodes.push(cloneNode(action.payload));
    },
  },
});

export const nodeEditorReducer = nodeEditorSlice.reducer;
export const nodeEditorActions = nodeEditorSlice.actions;
export type NodeEditorAction = ReturnType<
  (typeof nodeEditorActions)[keyof typeof nodeEditorActions]
>;

const selectRawNodeEditorState = (rootState: unknown): NodeEditorState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, NodeEditorModuleState>)[NODE_EDITOR_STATE_KEY]
    : undefined;

export const selectNodeEditorState = (rootState: unknown): NodeEditorState =>
  selectRawNodeEditorState(rootState) ?? initialState;
