import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { SAMPLE_EDGES, SAMPLE_NODES } from './sampleData';
import type { GraphNavEdge, GraphNavNode } from './types';

export const GRAPH_NAVIGATOR_STATE_KEY = 'app_rw_graph_navigator' as const;

export interface GraphNavigatorStateSeed {
  initialNodes?: readonly GraphNavNode[];
  initialEdges?: readonly GraphNavEdge[];
  selectedNodeId?: string | null;
  query?: string;
  filterType?: string;
  queryLog?: readonly string[];
}

export interface GraphNavigatorState {
  initialized: boolean;
  nodes: GraphNavNode[];
  edges: GraphNavEdge[];
  selectedNodeId: string | null;
  query: string;
  filterType: string;
  queryLog: string[];
}

type GraphNavigatorModuleState = GraphNavigatorState | undefined;
type GraphNavigatorStateInput = GraphNavigatorStateSeed | GraphNavigatorState | undefined;

function cloneNode(node: GraphNavNode): GraphNavNode {
  return { ...node, props: { ...node.props } };
}

function cloneEdge(edge: GraphNavEdge): GraphNavEdge {
  return { ...edge };
}

export function createGraphNavigatorStateSeed(
  seed: GraphNavigatorStateSeed = {},
): GraphNavigatorState {
  return {
    initialized: true,
    nodes: (seed.initialNodes ?? SAMPLE_NODES).map(cloneNode),
    edges: (seed.initialEdges ?? SAMPLE_EDGES).map(cloneEdge),
    selectedNodeId: seed.selectedNodeId ?? null,
    query: seed.query ?? '',
    filterType: seed.filterType ?? 'All',
    queryLog: [...(seed.queryLog ?? ['MATCH (n) RETURN n LIMIT 12', '// 12 nodes, 19 relationships loaded'])],
  };
}

function materializeGraphNavigatorState(seed: GraphNavigatorStateInput): GraphNavigatorState {
  if (seed && typeof seed === 'object' && 'nodes' in seed && 'edges' in seed) {
    return {
      ...seed,
      nodes: seed.nodes.map(cloneNode),
      edges: seed.edges.map(cloneEdge),
      queryLog: [...seed.queryLog],
    };
  }
  return createGraphNavigatorStateSeed(seed);
}

const initialState: GraphNavigatorState = {
  ...createGraphNavigatorStateSeed(),
  initialized: false,
};

export const graphNavigatorSlice = createSlice({
  name: 'graphNavigator',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<GraphNavigatorStateInput>) {
      if (state.initialized) return;
      return materializeGraphNavigatorState(action.payload);
    },
    replaceState(_state, action: PayloadAction<GraphNavigatorStateInput>) {
      return materializeGraphNavigatorState(action.payload);
    },
    setSelectedNodeId(state, action: PayloadAction<string | null>) {
      state.selectedNodeId = action.payload;
    },
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setFilterType(state, action: PayloadAction<string>) {
      state.filterType = action.payload;
    },
    appendQueryLog(state, action: PayloadAction<string>) {
      state.queryLog.push(action.payload);
    },
    clearQuery(state) {
      state.query = '';
    },
  },
});

export const graphNavigatorReducer = graphNavigatorSlice.reducer;
export const graphNavigatorActions = graphNavigatorSlice.actions;
export type GraphNavigatorAction = ReturnType<
  (typeof graphNavigatorActions)[keyof typeof graphNavigatorActions]
>;

const selectRawGraphNavigatorState = (rootState: unknown): GraphNavigatorState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, GraphNavigatorModuleState>)[GRAPH_NAVIGATOR_STATE_KEY]
    : undefined;

export const selectGraphNavigatorState = (rootState: unknown): GraphNavigatorState =>
  selectRawGraphNavigatorState(rootState) ?? initialState;
