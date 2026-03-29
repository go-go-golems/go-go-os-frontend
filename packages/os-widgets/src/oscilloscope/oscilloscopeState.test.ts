import { describe, expect, it } from 'vitest';
import {
  createOscilloscopeStateSeed,
  oscilloscopeActions,
  oscilloscopeReducer,
} from './oscilloscopeState';

describe('oscilloscopeState', () => {
  it('creates seeded state', () => {
    const state = createOscilloscopeStateSeed({
      waveform: 'triangle',
      running: false,
      channel2: true,
    });

    expect(state.waveform).toBe('triangle');
    expect(state.running).toBe(false);
    expect(state.channel2).toBe(true);
  });

  it('updates display controls', () => {
    let state = createOscilloscopeStateSeed();

    state = oscilloscopeReducer(state, oscilloscopeActions.setFrequency(8));
    state = oscilloscopeReducer(state, oscilloscopeActions.setChannel2(true));
    state = oscilloscopeReducer(state, oscilloscopeActions.setTriggerLevel(12));

    expect(state.frequency).toBe(8);
    expect(state.channel2).toBe(true);
    expect(state.triggerLevel).toBe(12);
  });
});
