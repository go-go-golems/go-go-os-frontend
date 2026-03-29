import { describe, expect, it } from 'vitest';
import {
  createSystemModelerStateSeed,
  systemModelerActions,
  systemModelerReducer,
} from './systemModelerState';

describe('systemModelerState', () => {
  it('creates a normalized seed', () => {
    const state = createSystemModelerStateSeed({
      selectedBlockId: 'b2',
      simRunning: true,
      simProgress: 140,
      showPalette: false,
    });

    expect(state).toMatchObject({
      initialized: true,
      selectedBlockId: 'b2',
      simRunning: true,
      simProgress: 100,
      showPalette: false,
    });
  });

  it('moves blocks and adds wires', () => {
    const seeded = createSystemModelerStateSeed();
    const moved = systemModelerReducer(
      seeded,
      systemModelerActions.moveBlock({ blockId: 'b1', x: 140, y: 160 }),
    );
    const expanded = systemModelerReducer(
      moved,
      systemModelerActions.addBlock({
        id: 'b4',
        type: 'scope',
        label: 'Scope B',
        emoji: '📺',
        x: 640,
        y: 220,
        w: 110,
        h: 60,
        inputs: 1,
        outputs: 0,
      }),
    );
    const connected = systemModelerReducer(
      expanded,
      systemModelerActions.addWire({
        id: 'w_extra',
        from: 'b1',
        fromPort: 0,
        to: 'b4',
        toPort: 0,
      }),
    );

    expect(connected.blocks.find((block) => block.id === 'b1')).toMatchObject({
      x: 140,
      y: 160,
    });
    expect(connected.wires.some((wire) => wire.id === 'w_extra')).toBe(true);
  });
});
