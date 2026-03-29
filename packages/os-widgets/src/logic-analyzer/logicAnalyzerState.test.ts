import { describe, expect, it } from 'vitest';
import {
  createLogicAnalyzerStateSeed,
  logicAnalyzerActions,
  logicAnalyzerReducer,
} from './logicAnalyzerState';

describe('logicAnalyzerState', () => {
  it('creates seeded defaults', () => {
    const state = createLogicAnalyzerStateSeed({
      autoStart: false,
      initialChannelCount: 2,
      zoom: 1.5,
      busView: true,
    });

    expect(state.running).toBe(false);
    expect(state.channels.filter((channel) => channel.enabled)).toHaveLength(2);
    expect(state.zoom).toBe(1.5);
    expect(state.busView).toBe(true);
  });

  it('toggles channels and display flags', () => {
    let state = createLogicAnalyzerStateSeed();

    state = logicAnalyzerReducer(state, logicAnalyzerActions.toggleChannel(3));
    state = logicAnalyzerReducer(state, logicAnalyzerActions.setShowGrid(false));
    state = logicAnalyzerReducer(state, logicAnalyzerActions.setShowEdges(false));

    expect(state.channels[3]?.enabled).toBe(false);
    expect(state.showGrid).toBe(false);
    expect(state.showEdges).toBe(false);
  });

  it('resets back to provided defaults', () => {
    let state = createLogicAnalyzerStateSeed({ speed: 3, protocol: 'SPI' });

    state = logicAnalyzerReducer(state, logicAnalyzerActions.setBusView(true));
    state = logicAnalyzerReducer(
      state,
      logicAnalyzerActions.resetToDefaults({
        autoStart: false,
        initialChannelCount: 4,
        protocol: 'UART',
      }),
    );

    expect(state.running).toBe(false);
    expect(state.protocol).toBe('UART');
    expect(state.channels.filter((channel) => channel.enabled)).toHaveLength(4);
    expect(state.busView).toBe(false);
  });
});
