import type { BlockInstance, Wire } from './types';

export const INITIAL_BLOCKS: BlockInstance[] = [
  { id: 'b1', type: 'source', label: 'Sine Wave', emoji: '\u3030\uFE0F', x: 80, y: 100, w: 120, h: 60, inputs: 0, outputs: 1 },
  { id: 'b2', type: 'gain', label: 'Gain', emoji: '\u2716\uFE0F', x: 280, y: 100, w: 100, h: 60, inputs: 1, outputs: 1 },
  { id: 'b3', type: 'scope', label: 'Scope', emoji: '\uD83D\uDCFA', x: 470, y: 100, w: 110, h: 60, inputs: 1, outputs: 0 },
];

export const INITIAL_WIRES: Wire[] = [
  { id: 'w1', from: 'b1', fromPort: 0, to: 'b2', toPort: 0 },
  { id: 'w2', from: 'b2', fromPort: 0, to: 'b3', toPort: 0 },
];
