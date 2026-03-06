import { describe, expect, it } from 'vitest';
import {
  createControlRoomStateSeed,
  controlRoomActions,
  controlRoomReducer,
} from './controlRoomState';

describe('controlRoomState', () => {
  it('creates seeded state', () => {
    const state = createControlRoomStateSeed({
      tick: 12,
      switches: { alarm: true },
      knobVal: 80,
      logs: [{ time: '09:41:00', msg: 'SYS: Boot complete', type: 'ok' }],
    });

    expect(state.tick).toBe(12);
    expect(state.switches.alarm).toBe(true);
    expect(state.knobVal).toBe(80);
    expect(state.logs).toHaveLength(1);
  });

  it('updates controls and telemetry buffers', () => {
    let state = createControlRoomStateSeed();

    state = controlRoomReducer(state, controlRoomActions.toggleSwitch('aux'));
    state = controlRoomReducer(state, controlRoomActions.setKnob2(72));
    state = controlRoomReducer(state, controlRoomActions.appendScopeSample(0.42));
    state = controlRoomReducer(
      state,
      controlRoomActions.appendLog({ time: '09:41:05', msg: 'WARN: Pressure rising', type: 'warn' }),
    );

    expect(state.switches.aux).toBe(true);
    expect(state.knob2).toBe(72);
    expect(state.scopeData.at(-1)).toBe(0.42);
    expect(state.logs.at(-1)?.type).toBe('warn');
  });
});
