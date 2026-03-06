import { useContext, useEffect, useReducer } from 'react';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { ControlRoomPanel } from './ControlRoomPanel';
import {
  CONTROL_ROOM_STATE_KEY,
  controlRoomActions,
  controlRoomReducer,
  createControlRoomStateSeed,
  selectControlRoomState,
  type ControlRoomAction,
  type ControlRoomState,
} from './controlRoomState';
import { createScopeSample, createTickLog, deriveTelemetry } from './controlRoomTelemetry';
import type { SwitchKey } from './types';
import {
  AnalogGauge,
  BarMeter,
  HorizontalBar,
  LED,
  ToggleSwitch,
  SevenSeg,
  Knob,
  ScrollLog,
  Scope,
} from './instruments';

// ── Props ────────────────────────────────────────────────────────────
export interface ControlRoomProps {
  /** Tick interval in ms (default 400). */
  tickInterval?: number;
}

function createInitialSeed(): ControlRoomState {
  return createControlRoomStateSeed();
}

function ControlRoomFrame({
  state,
  dispatch,
  tickInterval,
}: {
  state: ControlRoomState;
  dispatch: (action: ControlRoomAction) => void;
  tickInterval: number;
}) {
  useEffect(() => {
    if (!state.running) return;
    const intervalId = setInterval(() => {
      dispatch(controlRoomActions.tick());
    }, tickInterval);
    return () => clearInterval(intervalId);
  }, [dispatch, state.running, tickInterval]);

  useEffect(() => {
    dispatch(controlRoomActions.appendScopeSample(createScopeSample(state.tick)));
    const logEntry = createTickLog(state.tick);
    if (logEntry) {
      dispatch(controlRoomActions.appendLog(logEntry));
    }
  }, [dispatch, state.tick]);

  const telemetry = deriveTelemetry(state.tick, state.knobVal, state.knob2);
  const tog = (key: SwitchKey) => dispatch(controlRoomActions.toggleSwitch(key));

  return (
    <div data-part={P.controlRoom}>
      <div data-part={P.crTitleBar}>
        <span>{'\uD83D\uDDA5\uFE0F'}</span>
        <span data-part={P.crTitleText}>SYSTEM CONTROL \u2014 STATION 7</span>
        <span>{'\u2699\uFE0F'}</span>
      </div>

      <div data-part={P.crDashboard}>
        <ControlRoomPanel title="Primary Gauges">
          <div data-part={P.crGaugeRow}>
            <AnalogGauge value={telemetry.temp} min={0} max={100} label="TEMP" unit={'\u00B0C'} danger={75} size={150} />
            <AnalogGauge value={telemetry.pressure} min={0} max={100} label="PSI" danger={85} size={150} />
          </div>
        </ControlRoomPanel>

        <ControlRoomPanel title="Engine">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <AnalogGauge value={telemetry.rpm} min={0} max={4000} label="RPM" danger={3200} size={170} />
          </div>
        </ControlRoomPanel>

        <ControlRoomPanel title="Levels">
          <div data-part={P.crBarRow}>
            <BarMeter value={telemetry.flow} max={100} label="FLOW" danger={90} />
            <BarMeter value={telemetry.load} max={100} label="LOAD" danger={80} />
            <BarMeter value={telemetry.cpu} max={100} label="CPU" danger={85} />
            <BarMeter value={telemetry.mem} max={100} label="MEM" danger={90} />
          </div>
        </ControlRoomPanel>

        <ControlRoomPanel title="Digital Readout">
          <div data-part={P.crDigitalCol}>
            <SevenSeg value={String(Math.round(telemetry.rpm)).padStart(4, '0')} label="RPM" digits={4} />
            <SevenSeg value={String(telemetry.temp.toFixed(1)).replace('.', '').padStart(4, '0')} label="TEMP x10" digits={4} />
            <SevenSeg value={String(Math.round(telemetry.pressure)).padStart(4, '0')} label="PRESSURE" digits={4} />
          </div>
        </ControlRoomPanel>

        <ControlRoomPanel title="Controls">
          <div data-part={P.crControlsLayout}>
            <div data-part={P.crKnobRow}>
              <Knob value={state.knobVal} onChange={(value) => dispatch(controlRoomActions.setKnobVal(value))} label="FLOW" size={52} />
              <Knob value={state.knob2} onChange={(value) => dispatch(controlRoomActions.setKnob2(value))} label="LOAD" size={52} />
            </div>
            <div data-part={P.crToggleCol}>
              <ToggleSwitch on={state.switches.main} onToggle={() => tog('main')} label="MAIN PWR" />
              <ToggleSwitch on={state.switches.aux} onToggle={() => tog('aux')} label="AUX SYS" />
              <ToggleSwitch on={state.switches.pump} onToggle={() => tog('pump')} label="PUMP" />
              <ToggleSwitch on={state.switches.alarm} onToggle={() => tog('alarm')} label="ALARM" />
            </div>
          </div>
        </ControlRoomPanel>

        <ControlRoomPanel title="Status">
          <div data-part={P.crLedCol}>
            <LED on={state.switches.main} color="#00AA00" label="MAIN POWER" />
            <LED on={state.switches.aux} color="#3388FF" label="AUX SYSTEMS" />
            <LED on={state.switches.pump} color="#00AA00" label="PUMP ACTIVE" />
            <LED on={state.switches.alarm} color="#FF0000" label="ALARM ARMED" />
            <LED on={telemetry.temp > 75} color="#FF0000" label="OVER TEMP" />
            <LED on={telemetry.pressure > 85} color="#CCAA00" label="HIGH PSI" />
            <LED on={state.tick % 4 < 2} color="#00AA00" label="HEARTBEAT" />
          </div>
        </ControlRoomPanel>

        <ControlRoomPanel title="System Resources">
          <div data-part={P.crResourceCol}>
            <HorizontalBar value={telemetry.cpu} max={100} label="CPU USAGE" />
            <HorizontalBar value={telemetry.mem} max={100} label="MEMORY" />
            <HorizontalBar value={telemetry.net} max={100} label="NETWORK I/O" />
            <HorizontalBar value={telemetry.disk} max={100} label="DISK I/O" />
          </div>
        </ControlRoomPanel>

        <ControlRoomPanel title="Oscilloscope">
          <Scope data={state.scopeData} width={246} height={90} label="CH1 \u2014 SIGNAL" />
          <div data-part={P.crScopeMeta}>
            <span>1ms/div</span>
            <span>500mV/div</span>
          </div>
        </ControlRoomPanel>

        <ControlRoomPanel title="Event Log">
          <ScrollLog lines={state.logs} />
        </ControlRoomPanel>
      </div>

      <div data-part={P.crFooter}>
        <span>{'\u23F1\uFE0F'} UPTIME: {Math.floor((state.tick * 0.4) / 60)}m {Math.floor(state.tick * 0.4) % 60}s</span>
        <span>{'\uD83C\uDF21\uFE0F'} {telemetry.temp.toFixed(1)}{'\u00B0C'}</span>
        <span>{'\uD83D\uDCCA'} {Math.round(telemetry.cpu)}% CPU</span>
        <span>{state.switches.alarm ? '\uD83D\uDD34 ALARM ARMED' : '\uD83D\uDFE2 NOMINAL'}</span>
      </div>
    </div>
  );
}

function StandaloneControlRoom(props: ControlRoomProps) {
  const [state, dispatch] = useReducer(controlRoomReducer, createInitialSeed());
  return <ControlRoomFrame state={state} dispatch={dispatch} tickInterval={props.tickInterval ?? 400} />;
}

function ConnectedControlRoom(props: ControlRoomProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectControlRoomState);

  useEffect(() => {
    reduxDispatch(controlRoomActions.initializeIfNeeded(createInitialSeed()));
  }, [reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed();
  return <ControlRoomFrame state={effectiveState} dispatch={(action) => reduxDispatch(action)} tickInterval={props.tickInterval ?? 400} />;
}

export function ControlRoom(props: ControlRoomProps = {}) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    CONTROL_ROOM_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedControlRoom {...props} />;
  }

  return <StandaloneControlRoom {...props} />;
}
