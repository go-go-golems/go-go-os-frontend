import { describe, expect, it } from 'vitest';
import {
  createMermaidEditorStateSeed,
  mermaidEditorActions,
  mermaidEditorReducer,
} from './mermaidEditorState';

describe('mermaidEditorState', () => {
  it('creates seeded state', () => {
    const state = createMermaidEditorStateSeed({
      presetId: 'sequence',
      zoom: 1.4,
      splitPos: 0.55,
      showAbout: true,
    });

    expect(state.presetId).toBe('sequence');
    expect(state.zoom).toBe(1.4);
    expect(state.splitPos).toBe(0.55);
    expect(state.showAbout).toBe(true);
  });

  it('clamps zoom and split position', () => {
    let state = createMermaidEditorStateSeed();
    state = mermaidEditorReducer(state, mermaidEditorActions.setZoom(8));
    state = mermaidEditorReducer(state, mermaidEditorActions.setSplitPos(0.95));
    expect(state.zoom).toBe(3);
    expect(state.splitPos).toBe(0.8);
  });
});
