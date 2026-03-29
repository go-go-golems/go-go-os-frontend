import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import { INITIAL_CONNECTIONS, INITIAL_NODES } from './sampleData';
import { NodeEditor } from './NodeEditor';
import {
  createNodeEditorStateSeed,
  NODE_EDITOR_STATE_KEY,
  nodeEditorActions,
  nodeEditorReducer,
} from './nodeEditorState';
import '@go-go-golems/os-widgets/theme';

const meta: Meta<typeof NodeEditor> = {
  title: 'RichWidgets/NodeEditor',
  component: NodeEditor,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof NodeEditor>;

function createNodeEditorStoryStore() {
  return configureStore({
    reducer: {
      [NODE_EDITOR_STATE_KEY]: nodeEditorReducer,
    },
  });
}

type NodeEditorStoryStore = ReturnType<typeof createNodeEditorStoryStore>;
type NodeEditorSeedStore = SeedStore<NodeEditorStoryStore>;

function renderWithStore(seedStore: NodeEditorSeedStore) {
  return () => (
    <SeededStoreProvider createStore={createNodeEditorStoryStore} seedStore={seedStore}>
      <NodeEditor />
    </SeededStoreProvider>
  );
}

function renderSeededStory(seed: Parameters<typeof createNodeEditorStateSeed>[0]) {
  return renderWithStore((store) => {
    store.dispatch(nodeEditorActions.replaceState(createNodeEditorStateSeed(seed)));
  });
}

const denseNodes = [
  ...INITIAL_NODES,
  {
    id: 'n6',
    x: 1280,
    y: 120,
    title: 'Sharpen',
    icon: '✨',
    inputs: [{ id: 'n6-in-0', label: 'Input', type: 'image' }],
    outputs: [{ id: 'n6-out-0', label: 'Output', type: 'image' }],
    fields: [{ label: 'Strength', value: '0.7' }],
  },
  {
    id: 'n7',
    x: 1560,
    y: 120,
    title: 'Export',
    icon: '📦',
    inputs: [{ id: 'n7-in-0', label: 'Input', type: 'image' }],
    outputs: [],
    fields: [{ label: 'Format', value: 'PNG' }],
  },
];

const denseConnections = [
  ...INITIAL_CONNECTIONS,
  { from: 'n4-out-0', to: 'n6-in-0' },
  { from: 'n6-out-0', to: 'n7-in-0' },
];

const branchingNodes = [
  {
    id: 'src',
    x: 80,
    y: 120,
    title: 'Camera',
    icon: '📷',
    inputs: [],
    outputs: [{ id: 'src-out-0', label: 'Frame', type: 'image' }],
    fields: [{ label: 'FPS', value: '24' }],
  },
  {
    id: 'color',
    x: 360,
    y: 60,
    title: 'Color Correct',
    icon: '🎨',
    inputs: [{ id: 'color-in-0', label: 'Input', type: 'image' }],
    outputs: [{ id: 'color-out-0', label: 'Output', type: 'image' }],
    fields: [{ label: 'Gamma', value: '1.1' }],
  },
  {
    id: 'detect',
    x: 360,
    y: 220,
    title: 'Detect',
    icon: '🔎',
    inputs: [{ id: 'detect-in-0', label: 'Input', type: 'image' }],
    outputs: [{ id: 'detect-out-0', label: 'Boxes', type: 'data' }],
    fields: [{ label: 'Model', value: 'faces-v2' }],
  },
  {
    id: 'overlay',
    x: 680,
    y: 120,
    title: 'Overlay',
    icon: '🧩',
    inputs: [
      { id: 'overlay-in-0', label: 'Image', type: 'image' },
      { id: 'overlay-in-1', label: 'Boxes', type: 'data' },
    ],
    outputs: [{ id: 'overlay-out-0', label: 'Output', type: 'image' }],
    fields: [{ label: 'Style', value: 'wireframe' }],
  },
];

const branchingConnections = [
  { from: 'src-out-0', to: 'color-in-0' },
  { from: 'src-out-0', to: 'detect-in-0' },
  { from: 'color-out-0', to: 'overlay-in-0' },
  { from: 'detect-out-0', to: 'overlay-in-1' },
];

export const Default: Story = {
  render: renderSeededStory({}),
  decorators: [fullscreenDecorator],
};

export const Empty: Story = {
  render: renderSeededStory({
    initialNodes: [],
    initialConnections: [],
  }),
  decorators: [fullscreenDecorator],
};

export const SingleChain: Story = {
  render: renderSeededStory({
    initialNodes: [
      {
        id: 'a',
        x: 80,
        y: 120,
        title: 'Source',
        icon: '📁',
        inputs: [],
        outputs: [{ id: 'a-out-0', label: 'Data', type: 'data' }],
        fields: [{ label: 'File', value: 'input.csv' }],
      },
      {
        id: 'b',
        x: 380,
        y: 120,
        title: 'Transform',
        icon: '⚙️',
        inputs: [{ id: 'b-in-0', label: 'Input', type: 'data' }],
        outputs: [{ id: 'b-out-0', label: 'Output', type: 'data' }],
        fields: [{ label: 'Op', value: 'normalize' }],
      },
      {
        id: 'c',
        x: 680,
        y: 120,
        title: 'Output',
        icon: '💾',
        inputs: [{ id: 'c-in-0', label: 'Input', type: 'data' }],
        outputs: [],
        fields: [{ label: 'File', value: 'output.csv' }],
      },
    ],
    initialConnections: [
      { from: 'a-out-0', to: 'b-in-0' },
      { from: 'b-out-0', to: 'c-in-0' },
    ],
  }),
  decorators: [fullscreenDecorator],
};

export const DenseGraph: Story = {
  render: renderSeededStory({
    initialNodes: denseNodes,
    initialConnections: denseConnections,
    pan: { x: -120, y: 0 },
  }),
  decorators: [fullscreenDecorator],
};

export const BranchingGraph: Story = {
  render: renderSeededStory({
    initialNodes: branchingNodes,
    initialConnections: branchingConnections,
    selectedNodeId: 'overlay',
  }),
  decorators: [fullscreenDecorator],
};
