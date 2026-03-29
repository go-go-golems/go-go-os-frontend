/** Block type definition from the palette. */
export interface BlockTypeDef {
  type: string;
  label: string;
  emoji: string;
  inputs: number;
  outputs: number;
  width: number;
  height: number;
  category: 'source' | 'math' | 'routing';
}

/** An instance of a block placed on the canvas. */
export interface BlockInstance {
  id: string;
  type: string;
  label: string;
  emoji: string;
  x: number;
  y: number;
  w: number;
  h: number;
  inputs: number;
  outputs: number;
}

/** A wire connecting an output port to an input port. */
export interface Wire {
  id: string;
  from: string;
  fromPort: number;
  to: string;
  toPort: number;
}

/** State while dragging a block. */
export interface DragState {
  blockId: string;
  offX: number;
  offY: number;
}

/** State while drawing a new wire from an output port. */
export interface WiringState {
  fromBlock: string;
  fromPort: number;
  mx: number;
  my: number;
}

/** Position on the canvas. */
export interface Point {
  x: number;
  y: number;
}

export const BLOCK_TYPES: BlockTypeDef[] = [
  { type: 'source', label: 'Sine Wave', emoji: '\u3030\uFE0F', inputs: 0, outputs: 1, width: 120, height: 60, category: 'source' },
  { type: 'step', label: 'Step Input', emoji: '\uD83D\uDCF6', inputs: 0, outputs: 1, width: 120, height: 60, category: 'source' },
  { type: 'constant', label: 'Constant', emoji: '\uD83D\uDD22', inputs: 0, outputs: 1, width: 110, height: 60, category: 'source' },
  { type: 'gain', label: 'Gain', emoji: '\u2716\uFE0F', inputs: 1, outputs: 1, width: 100, height: 60, category: 'math' },
  { type: 'sum', label: 'Sum', emoji: '\u2795', inputs: 2, outputs: 1, width: 80, height: 70, category: 'math' },
  { type: 'integrator', label: '1/s', emoji: '\u222B', inputs: 1, outputs: 1, width: 90, height: 60, category: 'math' },
  { type: 'derivative', label: 'd/dt', emoji: '\uD835\uDEFF', inputs: 1, outputs: 1, width: 90, height: 60, category: 'math' },
  { type: 'transfer', label: 'Transfer Fcn', emoji: '\uD83D\uDCC8', inputs: 1, outputs: 1, width: 130, height: 60, category: 'routing' },
  { type: 'scope', label: 'Scope', emoji: '\uD83D\uDCFA', inputs: 1, outputs: 0, width: 110, height: 60, category: 'routing' },
  { type: 'mux', label: 'Mux', emoji: '\uD83D\uDD00', inputs: 2, outputs: 1, width: 80, height: 70, category: 'routing' },
  { type: 'demux', label: 'Demux', emoji: '\uD83D\uDD02', inputs: 1, outputs: 2, width: 80, height: 70, category: 'routing' },
  { type: 'saturation', label: 'Saturation', emoji: '\uD83D\uDCCF', inputs: 1, outputs: 1, width: 120, height: 60, category: 'routing' },
  { type: 'delay', label: 'Delay', emoji: '\u23F1\uFE0F', inputs: 1, outputs: 1, width: 100, height: 60, category: 'routing' },
  { type: 'switch', label: 'Switch', emoji: '\uD83D\uDD00', inputs: 3, outputs: 1, width: 90, height: 80, category: 'routing' },
];

export const SOURCE_BLOCKS = BLOCK_TYPES.filter((b) => b.category === 'source');
export const MATH_BLOCKS = BLOCK_TYPES.filter((b) => b.category === 'math');
export const ROUTING_BLOCKS = BLOCK_TYPES.filter((b) => b.category === 'routing');
