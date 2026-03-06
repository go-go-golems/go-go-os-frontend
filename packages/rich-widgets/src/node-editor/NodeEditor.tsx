import { useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Btn } from '@hypercard/engine';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { NodeComponent } from './NodeComponent';
import { NodeConnectionSvg } from './NodeConnectionSvg';
import { getPortPosition } from './nodeEditorGeometry';
import {
  createNodeEditorStateSeed,
  NODE_EDITOR_STATE_KEY,
  nodeEditorActions,
  nodeEditorReducer,
  selectNodeEditorState,
  type NodeEditorAction,
  type NodeEditorState,
} from './nodeEditorState';
import type { Connection, GraphNode, TempConnection } from './types';

export interface NodeEditorProps {
  initialNodes?: GraphNode[];
  initialConnections?: Connection[];
}

function createInitialSeed(props: NodeEditorProps): NodeEditorState {
  return createNodeEditorStateSeed({
    initialNodes: props.initialNodes,
    initialConnections: props.initialConnections,
  });
}

function NodeEditorFrame({
  state,
  dispatch,
}: {
  state: NodeEditorState;
  dispatch: (action: NodeEditorAction) => void;
}) {
  const [dragging, setDragging] = useState<{
    nodeId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [panning, setPanning] = useState<{
    startX: number;
    startY: number;
  } | null>(null);
  const [tempConnection, setTempConnection] = useState<TempConnection | null>(null);
  const [drawingFrom, setDrawingFrom] = useState<{
    portId: string;
    nodeId: string;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleNodeMouseDown = useCallback(
    (event: React.MouseEvent, nodeId: string) => {
      event.stopPropagation();
      dispatch(nodeEditorActions.setSelectedNodeId(nodeId));
      const node = state.nodes.find((item) => item.id === nodeId);
      if (!node) return;
      setDragging({
        nodeId,
        offsetX: event.clientX - node.x - state.pan.x,
        offsetY: event.clientY - node.y - state.pan.y,
      });
    },
    [dispatch, state.nodes, state.pan.x, state.pan.y],
  );

  const handlePortMouseDown = useCallback(
    (
      event: React.MouseEvent,
      portId: string,
      portType: string,
      nodeId: string,
    ) => {
      if (portType !== 'output') return;
      const position = getPortPosition(state.nodes, portId);
      setDrawingFrom({ portId, nodeId });
      setTempConnection({
        from: portId,
        fromPos: position,
        to: null,
        toPos: { x: event.clientX - state.pan.x, y: event.clientY - state.pan.y },
      });
    },
    [state.nodes, state.pan.x, state.pan.y],
  );

  const handlePortMouseUp = useCallback(
    (
      _event: React.MouseEvent,
      portId: string,
      portType: string,
      nodeId: string,
    ) => {
      if (drawingFrom && portType === 'input' && drawingFrom.nodeId !== nodeId) {
        dispatch(
          nodeEditorActions.addConnection({ from: drawingFrom.portId, to: portId }),
        );
      }
      setDrawingFrom(null);
      setTempConnection(null);
    },
    [dispatch, drawingFrom],
  );

  const handleCanvasMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (
        event.target === canvasRef.current ||
        (event.target as HTMLElement).tagName === 'svg'
      ) {
        dispatch(nodeEditorActions.setSelectedNodeId(null));
        setPanning({
          startX: event.clientX - state.pan.x,
          startY: event.clientY - state.pan.y,
        });
      }
    },
    [dispatch, state.pan.x, state.pan.y],
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (dragging) {
        dispatch(
          nodeEditorActions.moveNode({
            nodeId: dragging.nodeId,
            x: event.clientX - dragging.offsetX - state.pan.x,
            y: event.clientY - dragging.offsetY - state.pan.y,
          }),
        );
      }
      if (panning) {
        dispatch(
          nodeEditorActions.setPan({
            x: event.clientX - panning.startX,
            y: event.clientY - panning.startY,
          }),
        );
      }
      if (drawingFrom && tempConnection && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setTempConnection((previous) =>
          previous
            ? {
                ...previous,
                toPos: {
                  x: event.clientX - rect.left - state.pan.x,
                  y: event.clientY - rect.top - state.pan.y,
                },
              }
            : null,
        );
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      setPanning(null);
      setDrawingFrom(null);
      setTempConnection(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dispatch, dragging, drawingFrom, panning, state.pan.x, state.pan.y, tempConnection]);

  const handleAddNode = () => {
    const id = `n${Date.now()}`;
    dispatch(
      nodeEditorActions.addNode({
        id,
        x: 200 - state.pan.x,
        y: 200 - state.pan.y,
        title: 'New Filter',
        icon: '✨',
        inputs: [{ id: `${id}-in-0`, label: 'Input', type: 'image' }],
        outputs: [{ id: `${id}-out-0`, label: 'Output', type: 'image' }],
        fields: [{ label: 'Param', value: '0' }],
      }),
    );
  };

  return (
    <div data-part={P.ne}>
      <WidgetToolbar>
        <Btn onClick={handleAddNode} style={{ fontSize: 10 }}>
          + Add Node
        </Btn>
        <Btn onClick={() => dispatch(nodeEditorActions.deleteSelectedNode())} style={{ fontSize: 10 }}>
          Delete
        </Btn>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, opacity: 0.6 }}>
          Nodes: {state.nodes.length} | Connections: {state.connections.length}
        </span>
      </WidgetToolbar>

      <div
        ref={canvasRef}
        data-part={P.neCanvas}
        onMouseDown={handleCanvasMouseDown}
        style={{ cursor: panning ? 'grabbing' : 'default' }}
      >
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <defs>
            <pattern
              id="grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${state.pan.x % 32} ${state.pan.y % 32})`}
            >
              <circle
                cx="0"
                cy="0"
                r="0.8"
                fill="var(--hc-color-fg, rgba(0,0,0,0.15))"
                opacity="0.15"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div
          style={{
            transform: `translate(${state.pan.x}px, ${state.pan.y}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <NodeConnectionSvg
            nodes={state.nodes}
            connections={state.connections}
            tempConnection={tempConnection}
          />
          {state.nodes.map((node) => (
            <NodeComponent
              key={node.id}
              node={node}
              selected={state.selectedNodeId === node.id}
              onMouseDown={handleNodeMouseDown}
              onPortMouseDown={handlePortMouseDown}
              onPortMouseUp={handlePortMouseUp}
            />
          ))}
        </div>
      </div>

      <WidgetStatusBar>
        <span>
          {state.selectedNodeId
            ? `Selected: ${state.nodes.find((node) => node.id === state.selectedNodeId)?.title || '—'}`
            : 'Ready'}
        </span>
        <span>
          Pan: ({Math.round(state.pan.x)}, {Math.round(state.pan.y)})
        </span>
      </WidgetStatusBar>
    </div>
  );
}

function StandaloneNodeEditor(props: NodeEditorProps) {
  const [state, dispatch] = useReducer(nodeEditorReducer, createInitialSeed(props));
  return <NodeEditorFrame state={state} dispatch={dispatch} />;
}

function ConnectedNodeEditor(props: NodeEditorProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectNodeEditorState);

  useEffect(() => {
    reduxDispatch(nodeEditorActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.initialConnections, props.initialNodes, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return <NodeEditorFrame state={effectiveState} dispatch={(action) => reduxDispatch(action)} />;
}

export function NodeEditor(props: NodeEditorProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    NODE_EDITOR_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedNodeEditor {...props} />;
  }

  return <StandaloneNodeEditor {...props} />;
}
