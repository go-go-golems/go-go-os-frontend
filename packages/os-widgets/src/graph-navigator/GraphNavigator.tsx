import { useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { Btn } from '@go-go-golems/os-core';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { GraphCanvas } from './GraphCanvas';
import {
  NODE_FILTER_TYPES,
  SAMPLE_EDGES,
  SAMPLE_NODES,
} from './sampleData';
import {
  createGraphNavigatorStateSeed,
  GRAPH_NAVIGATOR_STATE_KEY,
  graphNavigatorActions,
  graphNavigatorReducer,
  selectGraphNavigatorState,
  type GraphNavigatorAction,
  type GraphNavigatorState,
} from './graphNavigatorState';
import { TYPE_STYLES, type GraphNavEdge, type GraphNavNode } from './types';

export interface GraphNavigatorProps {
  initialNodes?: GraphNavNode[];
  initialEdges?: GraphNavEdge[];
}

function createInitialSeed(props: GraphNavigatorProps): GraphNavigatorState {
  return createGraphNavigatorStateSeed({
    initialNodes: props.initialNodes ?? SAMPLE_NODES,
    initialEdges: props.initialEdges ?? SAMPLE_EDGES,
  });
}

function GraphNavigatorFrame({
  state,
  dispatch,
}: {
  state: GraphNavigatorState;
  dispatch: (action: GraphNavigatorAction) => void;
}) {
  const graphRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useReducer(
    (_prev: { w: number; h: number }, next: { w: number; h: number }) => next,
    { w: 600, h: 400 },
  );

  useEffect(() => {
    const measure = () => {
      if (graphRef.current) {
        const rect = graphRef.current.getBoundingClientRect();
        setDims({ w: rect.width, h: rect.height });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const filteredNodes = useMemo(
    () =>
      state.filterType === 'All'
        ? state.nodes
        : state.nodes.filter((node) => node.type === state.filterType),
    [state.filterType, state.nodes],
  );

  const filteredEdges = useMemo(() => {
    const ids = new Set(filteredNodes.map((node) => node.id));
    return state.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
  }, [filteredNodes, state.edges]);

  const selectedNode = useMemo(
    () => state.nodes.find((node) => node.id === state.selectedNodeId),
    [state.nodes, state.selectedNodeId],
  );

  const connectedEdges = useMemo(() => {
    if (!state.selectedNodeId) return [];
    return state.edges.filter(
      (edge) => edge.source === state.selectedNodeId || edge.target === state.selectedNodeId,
    );
  }, [state.edges, state.selectedNodeId]);

  const highlighted = useMemo(() => {
    const set = new Set<string>();
    if (state.selectedNodeId) {
      set.add(state.selectedNodeId);
      connectedEdges.forEach((edge) => {
        set.add(edge.source);
        set.add(edge.target);
      });
    }
    return set;
  }, [connectedEdges, state.selectedNodeId]);

  const nodeMap = useMemo(() => {
    const map: Record<string, GraphNavNode> = {};
    state.nodes.forEach((node) => {
      map[node.id] = node;
    });
    return map;
  }, [state.nodes]);

  const runQuery = () => {
    if (!state.query.trim()) return;
    const q = state.query.trim();
    dispatch(graphNavigatorActions.appendQueryLog(`> ${q}`));
    const matchType = q.match(/type\\s*=\\s*['\"](\\w+)['\"]/i);
    const matchLabel = q.match(/label\\s*=\\s*['\"]([\\w\\s-]+)['\"]/i);
    if (matchType) {
      dispatch(graphNavigatorActions.setFilterType(matchType[1]));
      dispatch(graphNavigatorActions.appendQueryLog(`// Filtered to type: ${matchType[1]}`));
    } else if (matchLabel) {
      const node = state.nodes.find(
        (item) => item.label.toLowerCase() === matchLabel[1].toLowerCase(),
      );
      if (node) {
        dispatch(graphNavigatorActions.setSelectedNodeId(node.id));
        dispatch(graphNavigatorActions.appendQueryLog(`// Selected: ${node.label}`));
      } else {
        dispatch(
          graphNavigatorActions.appendQueryLog(
            `// No node found with label: ${matchLabel[1]}`,
          ),
        );
      }
    } else if (q.toLowerCase().includes('match') && q.toLowerCase().includes('return')) {
      dispatch(graphNavigatorActions.setFilterType('All'));
      dispatch(graphNavigatorActions.setSelectedNodeId(null));
      dispatch(
        graphNavigatorActions.appendQueryLog(
          `// Showing all ${state.nodes.length} nodes`,
        ),
      );
    } else {
      dispatch(graphNavigatorActions.appendQueryLog('// Unknown query. Try: MATCH (n) RETURN n'));
    }
    dispatch(graphNavigatorActions.clearQuery());
  };

  const stats = {
    nodes: filteredNodes.length,
    edges: filteredEdges.length,
    types: [...new Set(filteredNodes.map((node) => node.type))].length,
  };

  const edgeTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    state.edges.forEach((edge) => {
      counts[edge.label] = (counts[edge.label] || 0) + 1;
    });
    return Object.entries(counts).sort(([left], [right]) => left.localeCompare(right));
  }, [state.edges]);

  return (
    <div data-part={P.graphNav}>
      <div data-part={P.gnSidebar}>
        <div data-part={P.gnPanel} style={{ flex: 1, minHeight: 0 }}>
          <div data-part={P.gnPanelHeader}>Node Browser</div>
          <div data-part={P.gnFilterBar}>
            {NODE_FILTER_TYPES.map((type) => (
              <Btn
                key={type}
                onClick={() => dispatch(graphNavigatorActions.setFilterType(type))}
                data-state={state.filterType === type ? 'active' : undefined}
                style={{ fontSize: 10, padding: '2px 8px' }}
              >
                {type === 'All' ? '🌐' : TYPE_STYLES[type]?.emoji} {type}
              </Btn>
            ))}
          </div>
          <div data-part={P.gnNodeList}>
            {filteredNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => dispatch(graphNavigatorActions.setSelectedNodeId(node.id))}
                data-part={P.gnNodeItem}
                data-state={state.selectedNodeId === node.id ? 'selected' : undefined}
              >
                <span style={{ fontSize: 12 }}>{TYPE_STYLES[node.type]?.emoji}</span>
                <span style={{ flex: 1, fontSize: 11 }}>{node.label}</span>
                <span style={{ fontSize: 9, opacity: 0.6 }}>{node.type}</span>
              </div>
            ))}
          </div>
        </div>

        <div data-part={P.gnPanel} style={{ flexShrink: 0 }}>
          <div data-part={P.gnPanelHeader}>Statistics</div>
          <div data-part={P.gnStats}>
            <div>Nodes: <b>{stats.nodes}</b></div>
            <div>Edges: <b>{stats.edges}</b></div>
            <div>Types: <b>{stats.types}</b></div>
          </div>
        </div>
      </div>

      <div data-part={P.gnCenter}>
        <div data-part={P.gnPanel} style={{ flex: 1, minHeight: 0 }}>
          <div data-part={P.gnPanelHeader}>Graph View</div>
          <div ref={graphRef} data-part={P.gnGraphArea}>
            <GraphCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              selected={state.selectedNodeId}
              onSelect={(id) => dispatch(graphNavigatorActions.setSelectedNodeId(id))}
              highlighted={highlighted}
              width={dims.w}
              height={dims.h}
            />
            <div data-part={P.gnLegend}>
              {Object.entries(TYPE_STYLES).map(([type, style]) => (
                <span key={type}>
                  {style.emoji} {type}
                </span>
              ))}
              <span style={{ opacity: 0.5 }}>| drag nodes · pan bg</span>
            </div>
          </div>
        </div>

        <div data-part={P.gnPanel} style={{ height: 140, flexShrink: 0 }}>
          <div data-part={P.gnPanelHeader}>Query Console</div>
          <div data-part={P.gnConsole}>
            <div data-part={P.gnConsoleLog}>
              {state.queryLog.map((line, index) => (
                <div
                  key={index}
                  style={{ color: line.startsWith('//') ? 'var(--hc-color-muted, #666)' : 'inherit' }}
                >
                  {line}
                </div>
              ))}
              <span data-part={P.gnCursor}>▌</span>
            </div>
            <div data-part={P.gnConsoleInput}>
              <span data-part={P.gnPrompt}>&gt;</span>
              <input
                value={state.query}
                onChange={(event) => dispatch(graphNavigatorActions.setQuery(event.target.value))}
                onKeyDown={(event) => event.key === 'Enter' && runQuery()}
                placeholder="MATCH (n:Person) RETURN n"
                data-part={P.gnQueryInput}
              />
              <Btn onClick={runQuery} style={{ borderRadius: 0, fontSize: 11 }}>
                Run
              </Btn>
            </div>
          </div>
        </div>
      </div>

      <div data-part={P.gnInspector}>
        <div data-part={P.gnPanel} style={{ flex: 1, minHeight: 0 }}>
          <div data-part={P.gnPanelHeader}>Node Inspector</div>
          {selectedNode ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div data-part={P.gnInspectorHeader}>
                <span style={{ fontSize: 22 }}>{TYPE_STYLES[selectedNode.type]?.emoji}</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 13 }}>{selectedNode.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>
                    {selectedNode.type} · {selectedNode.id}
                  </div>
                </div>
              </div>
              <div data-part={P.gnPropsSection}>
                <div data-part={P.gnSectionTitle}>Properties</div>
                {Object.entries(selectedNode.props).map(([key, value]) => (
                  <div key={key} data-part={P.gnPropRow}>
                    <span style={{ fontWeight: 'bold' }}>{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
              <div data-part={P.gnPropsSection}>
                <div data-part={P.gnSectionTitle}>Relationships ({connectedEdges.length})</div>
                {connectedEdges.map((edge, index) => {
                  const isOutgoing = edge.source === state.selectedNodeId;
                  const otherId = isOutgoing ? edge.target : edge.source;
                  const other = nodeMap[otherId];
                  return (
                    <div
                      key={index}
                      onClick={() => dispatch(graphNavigatorActions.setSelectedNodeId(otherId))}
                      data-part={P.gnRelItem}
                    >
                      <span>{isOutgoing ? '→' : '←'}</span>
                      <span data-part={P.gnRelLabel}>{edge.label}</span>
                      <span>{TYPE_STYLES[other?.type]?.emoji} {other?.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div data-part={P.gnEmptyInspector}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔎</div>
              Click a node in the graph
              <br />
              to inspect its properties
              <br />
              and relationships.
            </div>
          )}
        </div>

        <div data-part={P.gnPanel} style={{ height: 140, flexShrink: 0 }}>
          <div data-part={P.gnPanelHeader}>Edge Types</div>
          <div style={{ overflowY: 'auto', padding: 6 }}>
            {edgeTypes.map(([label, count]) => (
              <div key={label} data-part={P.gnEdgeTypeRow}>
                <span style={{ fontWeight: 'bold' }}>{label}</span>
                <span data-part={P.gnEdgeCount}>×{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StandaloneGraphNavigator(props: GraphNavigatorProps) {
  const [state, dispatch] = useReducer(graphNavigatorReducer, createInitialSeed(props));
  return <GraphNavigatorFrame state={state} dispatch={dispatch} />;
}

function ConnectedGraphNavigator(props: GraphNavigatorProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectGraphNavigatorState);

  useEffect(() => {
    reduxDispatch(graphNavigatorActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.initialEdges, props.initialNodes, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return <GraphNavigatorFrame state={effectiveState} dispatch={(action) => reduxDispatch(action)} />;
}

export function GraphNavigator(props: GraphNavigatorProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    GRAPH_NAVIGATOR_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedGraphNavigator {...props} />;
  }

  return <StandaloneGraphNavigator {...props} />;
}
