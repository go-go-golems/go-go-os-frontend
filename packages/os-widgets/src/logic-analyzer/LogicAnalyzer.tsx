import { useContext, useEffect, useReducer, useRef } from 'react';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { LogicAnalyzerCanvas } from './LogicAnalyzerCanvas';
import { LogicAnalyzerControls } from './LogicAnalyzerControls';
import {
  createLogicAnalyzerStateSeed,
  LOGIC_ANALYZER_STATE_KEY,
  logicAnalyzerActions,
  logicAnalyzerReducer,
  selectLogicAnalyzerState,
  type LogicAnalyzerAction,
  type LogicAnalyzerState,
} from './logicAnalyzerState';

// ── Props ────────────────────────────────────────────────────────────
export interface LogicAnalyzerProps {
  canvasWidth?: number;
  canvasHeight?: number;
  autoStart?: boolean;
  initialChannelCount?: number;
}

function createInitialSeed(props: LogicAnalyzerProps): LogicAnalyzerState {
  return createLogicAnalyzerStateSeed({
    autoStart: props.autoStart,
    initialChannelCount: props.initialChannelCount,
  });
}

function LogicAnalyzerFrame({
  state,
  dispatch,
  canvasWidth,
  canvasHeight,
  initialChannelCount = 6,
}: {
  state: LogicAnalyzerState;
  dispatch: (action: LogicAnalyzerAction) => void;
  canvasWidth: number;
  canvasHeight: number;
  initialChannelCount?: number;
}) {
  const resetTimeRef = useRef<(() => void) | null>(null);

  return (
    <div data-part={P.logicAnalyzer}>
      <div data-part={P.laMain}>
        <LogicAnalyzerCanvas
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          channels={state.channels}
          running={state.running}
          speed={state.speed}
          zoom={state.zoom}
          showGrid={state.showGrid}
          showEdges={state.showEdges}
          protocol={state.protocol}
          triggerCh={state.triggerCh}
          triggerEdge={state.triggerEdge}
          busView={state.busView}
          onResetTimeRef={(reset) => {
            resetTimeRef.current = reset;
          }}
        />
        <LogicAnalyzerControls
          channels={state.channels}
          speed={state.speed}
          zoom={state.zoom}
          showGrid={state.showGrid}
          showEdges={state.showEdges}
          protocol={state.protocol}
          triggerCh={state.triggerCh}
          triggerEdge={state.triggerEdge}
          busView={state.busView}
          running={state.running}
          onToggleChannel={(index) => dispatch(logicAnalyzerActions.toggleChannel(index))}
          onSpeedChange={(value) => dispatch(logicAnalyzerActions.setSpeed(value))}
          onZoomChange={(value) => dispatch(logicAnalyzerActions.setZoom(value))}
          onShowGridChange={(value) => dispatch(logicAnalyzerActions.setShowGrid(value))}
          onShowEdgesChange={(value) => dispatch(logicAnalyzerActions.setShowEdges(value))}
          onProtocolChange={(value) => dispatch(logicAnalyzerActions.setProtocol(value))}
          onTriggerChChange={(value) => dispatch(logicAnalyzerActions.setTriggerCh(value))}
          onTriggerEdgeChange={(value) => dispatch(logicAnalyzerActions.setTriggerEdge(value))}
          onBusViewChange={(value) => dispatch(logicAnalyzerActions.setBusView(value))}
          onToggleRunning={() => dispatch(logicAnalyzerActions.toggleRunning())}
          onResetTime={() => resetTimeRef.current?.()}
          onResetDefaults={() =>
            dispatch(
              logicAnalyzerActions.resetToDefaults({
                autoStart: state.running,
                initialChannelCount,
              }),
            )}
        />
      </div>
    </div>
  );
}

function StandaloneLogicAnalyzer(props: LogicAnalyzerProps) {
  const [state, dispatch] = useReducer(logicAnalyzerReducer, createInitialSeed(props));
  return (
    <LogicAnalyzerFrame
      state={state}
      dispatch={dispatch}
      canvasWidth={props.canvasWidth ?? 560}
      canvasHeight={props.canvasHeight ?? 340}
      initialChannelCount={props.initialChannelCount}
    />
  );
}

function ConnectedLogicAnalyzer(props: LogicAnalyzerProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectLogicAnalyzerState);

  useEffect(() => {
    reduxDispatch(logicAnalyzerActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.autoStart, props.initialChannelCount, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return (
    <LogicAnalyzerFrame
      state={effectiveState}
      dispatch={(action) => reduxDispatch(action)}
      canvasWidth={props.canvasWidth ?? 560}
      canvasHeight={props.canvasHeight ?? 340}
      initialChannelCount={props.initialChannelCount}
    />
  );
}

export function LogicAnalyzer(props: LogicAnalyzerProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    LOGIC_ANALYZER_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedLogicAnalyzer {...props} />;
  }

  return <StandaloneLogicAnalyzer {...props} />;
}
