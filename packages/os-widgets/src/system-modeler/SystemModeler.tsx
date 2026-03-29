import { useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Btn } from '@go-go-golems/os-core';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { ProgressBar } from '../primitives/ProgressBar';
import { Separator } from '../primitives/Separator';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { ParamsDialog, SimParamsDialog } from './SystemModelerDialogs';
import { PaletteSection } from './SystemModelerPalette';
import { SvgBlock, SvgWire } from './SystemModelerSvg';
import { getPortPos } from './systemModelerGeometry';
import {
  createSystemModelerStateSeed,
  selectSystemModelerState,
  systemModelerActions,
  systemModelerReducer,
  SYSTEM_MODELER_STATE_KEY,
  type SystemModelerAction,
  type SystemModelerState,
} from './systemModelerState';
import {
  MATH_BLOCKS,
  ROUTING_BLOCKS,
  SOURCE_BLOCKS,
  type BlockInstance,
  type BlockTypeDef,
  type DragState,
  type Wire,
  type WiringState,
} from './types';

export interface SystemModelerProps {
  initialBlocks?: BlockInstance[];
  initialWires?: Wire[];
}

function createInitialSeed(props: SystemModelerProps): SystemModelerState {
  return createSystemModelerStateSeed({
    initialBlocks: props.initialBlocks,
    initialWires: props.initialWires,
  });
}

function SystemModelerFrame({
  state,
  dispatch,
}: {
  state: SystemModelerState;
  dispatch: (action: SystemModelerAction) => void;
}) {
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [wiring, setWiring] = useState<WiringState | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(1);
  const uid = useCallback(() => `blk_${idCounterRef.current++}`, []);

  useEffect(() => {
    if (!state.simRunning) return;
    const intervalId = setInterval(() => {
      dispatch(systemModelerActions.setSimProgress(state.simProgress + 5));
    }, 80);
    return () => clearInterval(intervalId);
  }, [dispatch, state.simProgress, state.simRunning]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (
          (event.target as HTMLElement).tagName === 'INPUT' ||
          (event.target as HTMLElement).tagName === 'SELECT'
        ) {
          return;
        }
        dispatch(systemModelerActions.deleteSelectedBlock());
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch]);

  const addBlock = (blockType: BlockTypeDef) => {
    const id = uid();
    dispatch(
      systemModelerActions.addBlock({
        id,
        type: blockType.type,
        label: blockType.label,
        emoji: blockType.emoji,
        x: 100 + Math.random() * 200,
        y: 60 + Math.random() * 200,
        w: blockType.width,
        h: blockType.height,
        inputs: blockType.inputs,
        outputs: blockType.outputs,
      }),
    );
  };

  const onBlockMouseDown = (event: React.MouseEvent, blockId: string) => {
    event.stopPropagation();
    dispatch(systemModelerActions.setSelectedBlockId(blockId));
    const block = state.blocks.find((item) => item.id === blockId);
    if (!block) return;
    const rect = canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    setDragging({
      blockId,
      offX: event.clientX - rect.left - block.x,
      offY: event.clientY - rect.top - block.y,
    });
  };

  const onCanvasMouseMove = (event: React.MouseEvent) => {
    if (dragging) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      dispatch(
        systemModelerActions.moveBlock({
          blockId: dragging.blockId,
          x: event.clientX - rect.left - dragging.offX,
          y: event.clientY - rect.top - dragging.offY,
        }),
      );
    }
    if (wiring) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setWiring((previous) =>
        previous
          ? { ...previous, mx: event.clientX - rect.left, my: event.clientY - rect.top }
          : null,
      );
    }
  };

  const onCanvasMouseUp = () => {
    setDragging(null);
    if (wiring) setWiring(null);
  };

  const onPortMouseDown = (
    event: React.MouseEvent,
    blockId: string,
    isInput: boolean,
    portIdx: number,
  ) => {
    event.stopPropagation();
    if (isInput) return;
    const block = state.blocks.find((item) => item.id === blockId);
    if (!block) return;
    const position = getPortPos(block, false, portIdx);
    setWiring({ fromBlock: blockId, fromPort: portIdx, mx: position.x, my: position.y });
  };

  const onPortMouseUp = (
    event: React.MouseEvent,
    blockId: string,
    isInput: boolean,
    portIdx: number,
  ) => {
    event.stopPropagation();
    if (wiring && isInput && wiring.fromBlock !== blockId) {
      dispatch(
        systemModelerActions.addWire({
          id: `w_${Date.now()}`,
          from: wiring.fromBlock,
          fromPort: wiring.fromPort,
          to: blockId,
          toPort: portIdx,
        }),
      );
    }
    setWiring(null);
  };

  const paramBlock =
    state.showParams && state.showParams !== 'sim'
      ? state.blocks.find((block) => block.id === state.showParams) ?? null
      : null;

  return (
    <div data-part={P.systemModeler}>
      <WidgetToolbar>
        <Btn onClick={() => dispatch(systemModelerActions.startSimulation())} active={state.simRunning}>
          ▶ Run
        </Btn>
        <Btn onClick={() => dispatch(systemModelerActions.stopSimulation())}>⏹</Btn>
        <Separator />
        <Btn onClick={() => dispatch(systemModelerActions.deleteSelectedBlock())}>🗑️ Delete</Btn>
        <Btn onClick={() => dispatch(systemModelerActions.clearModel())}>New</Btn>
        <Btn onClick={() => dispatch(systemModelerActions.setShowParams('sim'))}>⚙️ Params</Btn>
        <div style={{ flex: 1 }} />
        <Btn onClick={() => dispatch(systemModelerActions.setShowPalette(!state.showPalette))}>
          {state.showPalette ? 'Hide Palette' : 'Show Palette'}
        </Btn>
        <span data-part={P.smTimeLabel}>
          {state.simRunning ? `⏳ ${state.simProgress}%` : `t = ${state.simTime}s`}
        </span>
      </WidgetToolbar>

      <div data-part={P.smBody}>
        <div data-part={P.smCanvas} ref={canvasRef}>
          <svg
            width="100%"
            height="100%"
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
            onClick={() => dispatch(systemModelerActions.setSelectedBlockId(null))}
            data-part={P.smSvg}
          >
            {state.wires.map((wire) => (
              <SvgWire
                key={wire.id}
                wire={wire}
                blocks={state.blocks}
                onDelete={(wireId) => dispatch(systemModelerActions.deleteWire(wireId))}
              />
            ))}
            {wiring && (() => {
              const fromBlock = state.blocks.find((block) => block.id === wiring.fromBlock);
              if (!fromBlock) return null;
              const start = getPortPos(fromBlock, false, wiring.fromPort);
              return (
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={wiring.mx}
                  y2={wiring.my}
                  stroke="#000"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              );
            })()}
            {state.blocks.map((block) => (
              <SvgBlock
                key={block.id}
                block={block}
                isSelected={state.selectedBlockId === block.id}
                onBlockMouseDown={onBlockMouseDown}
                onBlockDoubleClick={(blockId) => dispatch(systemModelerActions.setShowParams(blockId))}
                onPortMouseDown={onPortMouseDown}
                onPortMouseUp={onPortMouseUp}
              />
            ))}
          </svg>
        </div>

        {state.showPalette && (
          <div data-part={P.smPalette}>
            <div data-part={P.smPaletteHeader}>Block Palette</div>
            <div data-part={P.smPaletteList}>
              <PaletteSection title="◆ Sources" blocks={SOURCE_BLOCKS} onAdd={addBlock} />
              <PaletteSection title="◆ Math Operations" blocks={MATH_BLOCKS} onAdd={addBlock} />
              <PaletteSection title="◆ Routing & Sinks" blocks={ROUTING_BLOCKS} onAdd={addBlock} />
            </div>
          </div>
        )}
      </div>

      {state.simRunning && (
        <div data-part={P.smProgressOverlay}>
          <div data-part={P.smProgressLabel}>⏳ Simulating model… {state.simProgress}%</div>
          <ProgressBar value={state.simProgress} max={100} />
        </div>
      )}

      <WidgetStatusBar>
        <span>{state.blocks.length} blocks</span>
        <span>{state.wires.length} wires</span>
        <span>{state.simRunning ? '⏳ Simulating' : '✅ Ready'}</span>
      </WidgetStatusBar>

      {state.showParams === 'sim' && (
        <SimParamsDialog
          simTime={state.simTime}
          onSimTimeChange={(value) => dispatch(systemModelerActions.setSimTime(value))}
          onClose={() => dispatch(systemModelerActions.setShowParams(null))}
        />
      )}
      {paramBlock && (
        <ParamsDialog
          block={paramBlock}
          onClose={() => dispatch(systemModelerActions.setShowParams(null))}
        />
      )}
    </div>
  );
}

function StandaloneSystemModeler(props: SystemModelerProps) {
  const [state, dispatch] = useReducer(systemModelerReducer, createInitialSeed(props));
  return <SystemModelerFrame state={state} dispatch={dispatch} />;
}

function ConnectedSystemModeler(props: SystemModelerProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectSystemModelerState);

  useEffect(() => {
    reduxDispatch(systemModelerActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.initialBlocks, props.initialWires, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return <SystemModelerFrame state={effectiveState} dispatch={(action) => reduxDispatch(action)} />;
}

export function SystemModeler(props: SystemModelerProps = {}) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    SYSTEM_MODELER_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedSystemModeler {...props} />;
  }

  return <StandaloneSystemModeler {...props} />;
}
