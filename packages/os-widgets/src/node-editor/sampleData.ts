import type { GraphNode, Connection } from './types';

export const INITIAL_NODES: GraphNode[] = [
  {
    id: 'n1',
    x: 80,
    y: 100,
    title: 'Image Input',
    icon: '🖼️',
    inputs: [],
    outputs: [{ id: 'n1-out-0', label: 'Image', type: 'image' }],
    fields: [{ label: 'File', value: 'photo.pict' }],
  },
  {
    id: 'n2',
    x: 380,
    y: 80,
    title: 'Brightness',
    icon: '☀️',
    inputs: [{ id: 'n2-in-0', label: 'Input', type: 'image' }],
    outputs: [{ id: 'n2-out-0', label: 'Output', type: 'image' }],
    fields: [{ label: 'Amount', value: '64' }],
  },
  {
    id: 'n3',
    x: 380,
    y: 280,
    title: 'Blur',
    icon: '💫',
    inputs: [{ id: 'n3-in-0', label: 'Input', type: 'image' }],
    outputs: [{ id: 'n3-out-0', label: 'Output', type: 'image' }],
    fields: [{ label: 'Radius', value: '3.0' }],
  },
  {
    id: 'n4',
    x: 680,
    y: 160,
    title: 'Composite',
    icon: '🔀',
    inputs: [
      { id: 'n4-in-0', label: 'Layer A', type: 'image' },
      { id: 'n4-in-1', label: 'Layer B', type: 'image' },
    ],
    outputs: [{ id: 'n4-out-0', label: 'Result', type: 'image' }],
    fields: [{ label: 'Mode', value: 'Multiply' }],
  },
  {
    id: 'n5',
    x: 960,
    y: 180,
    title: 'File Output',
    icon: '💾',
    inputs: [{ id: 'n5-in-0', label: 'Input', type: 'image' }],
    outputs: [],
    fields: [{ label: 'Save As', value: 'result.pict' }],
  },
];

export const INITIAL_CONNECTIONS: Connection[] = [
  { from: 'n1-out-0', to: 'n2-in-0' },
  { from: 'n1-out-0', to: 'n3-in-0' },
  { from: 'n2-out-0', to: 'n4-in-0' },
  { from: 'n3-out-0', to: 'n4-in-1' },
  { from: 'n4-out-0', to: 'n5-in-0' },
];
