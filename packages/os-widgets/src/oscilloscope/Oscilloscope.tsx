import { useContext, useEffect, useReducer, useRef } from 'react';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { OscilloscopeCanvas } from './OscilloscopeCanvas';
import { OscilloscopeControls } from './OscilloscopeControls';
import {
  createOscilloscopeStateSeed,
  oscilloscopeActions,
  oscilloscopeReducer,
  OSCILLOSCOPE_STATE_KEY,
  selectOscilloscopeState,
  type OscilloscopeAction,
  type OscilloscopeState,
} from './oscilloscopeState';
import type { WaveformType } from './types';

export interface OscilloscopeProps {
  canvasWidth?: number;
  canvasHeight?: number;
  initialWaveform?: WaveformType;
  autoStart?: boolean;
}

function createInitialSeed(props: OscilloscopeProps): OscilloscopeState {
  return createOscilloscopeStateSeed({
    waveform: props.initialWaveform,
    running: props.autoStart,
  });
}

function OscilloscopeFrame({
  state,
  dispatch,
  canvasWidth,
  canvasHeight,
  initialWaveform,
  autoStart,
}: {
  state: OscilloscopeState;
  dispatch: (action: OscilloscopeAction) => void;
  canvasWidth: number;
  canvasHeight: number;
  initialWaveform?: WaveformType;
  autoStart?: boolean;
}) {
  const resetTimeRef = useRef<(() => void) | null>(null);

  return (
    <div data-part={P.oscilloscope}>
      <div data-part={P.oscMain}>
        <OscilloscopeCanvas
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          waveform={state.waveform}
          frequency={state.frequency}
          amplitude={state.amplitude}
          timebase={state.timebase}
          offsetY={state.offsetY}
          running={state.running}
          showGrid={state.showGrid}
          showCrosshair={state.showCrosshair}
          channel2={state.channel2}
          ch2Freq={state.ch2Freq}
          ch2Amp={state.ch2Amp}
          phosphor={state.phosphor}
          triggerLevel={state.triggerLevel}
          thickness={state.thickness}
          onResetTimeRef={(reset) => {
            resetTimeRef.current = reset;
          }}
        />
        <OscilloscopeControls
          waveform={state.waveform}
          frequency={state.frequency}
          amplitude={state.amplitude}
          timebase={state.timebase}
          offsetY={state.offsetY}
          running={state.running}
          showGrid={state.showGrid}
          showCrosshair={state.showCrosshair}
          channel2={state.channel2}
          ch2Freq={state.ch2Freq}
          ch2Amp={state.ch2Amp}
          phosphor={state.phosphor}
          triggerLevel={state.triggerLevel}
          thickness={state.thickness}
          onWaveformChange={(value) => dispatch(oscilloscopeActions.setWaveform(value))}
          onFrequencyChange={(value) => dispatch(oscilloscopeActions.setFrequency(value))}
          onAmplitudeChange={(value) => dispatch(oscilloscopeActions.setAmplitude(value))}
          onTimebaseChange={(value) => dispatch(oscilloscopeActions.setTimebase(value))}
          onOffsetYChange={(value) => dispatch(oscilloscopeActions.setOffsetY(value))}
          onRunningChange={(value) => dispatch(oscilloscopeActions.setRunning(value))}
          onShowGridChange={(value) => dispatch(oscilloscopeActions.setShowGrid(value))}
          onShowCrosshairChange={(value) => dispatch(oscilloscopeActions.setShowCrosshair(value))}
          onChannel2Change={(value) => dispatch(oscilloscopeActions.setChannel2(value))}
          onCh2FreqChange={(value) => dispatch(oscilloscopeActions.setCh2Freq(value))}
          onCh2AmpChange={(value) => dispatch(oscilloscopeActions.setCh2Amp(value))}
          onPhosphorChange={(value) => dispatch(oscilloscopeActions.setPhosphor(value))}
          onTriggerLevelChange={(value) => dispatch(oscilloscopeActions.setTriggerLevel(value))}
          onThicknessChange={(value) => dispatch(oscilloscopeActions.setThickness(value))}
          onResetTime={() => resetTimeRef.current?.()}
          onResetDefaults={() =>
            dispatch(
              oscilloscopeActions.resetToDefaults({
                waveform: initialWaveform,
                running: autoStart,
              }),
            )}
        />
      </div>
    </div>
  );
}

function StandaloneOscilloscope(props: OscilloscopeProps) {
  const [state, dispatch] = useReducer(oscilloscopeReducer, createInitialSeed(props));
  return (
    <OscilloscopeFrame
      state={state}
      dispatch={dispatch}
      canvasWidth={props.canvasWidth ?? 520}
      canvasHeight={props.canvasHeight ?? 300}
      initialWaveform={props.initialWaveform}
      autoStart={props.autoStart}
    />
  );
}

function ConnectedOscilloscope(props: OscilloscopeProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectOscilloscopeState);

  useEffect(() => {
    reduxDispatch(oscilloscopeActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.autoStart, props.initialWaveform, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return (
    <OscilloscopeFrame
      state={effectiveState}
      dispatch={(action) => reduxDispatch(action)}
      canvasWidth={props.canvasWidth ?? 520}
      canvasHeight={props.canvasHeight ?? 300}
      initialWaveform={props.initialWaveform}
      autoStart={props.autoStart}
    />
  );
}

export function Oscilloscope(props: OscilloscopeProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    OSCILLOSCOPE_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedOscilloscope {...props} />;
  }

  return <StandaloneOscilloscope {...props} />;
}
