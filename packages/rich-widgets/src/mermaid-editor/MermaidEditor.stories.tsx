import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import { MermaidEditor } from './MermaidEditor';
import { MERMAID_PRESETS } from './sampleData';
import {
  createMermaidEditorStateSeed,
  mermaidEditorActions,
  mermaidEditorReducer,
  MERMAID_EDITOR_STATE_KEY,
} from './mermaidEditorState';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof MermaidEditor> = {
  title: 'RichWidgets/MermaidEditor',
  component: MermaidEditor,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof MermaidEditor>;

function createMermaidEditorStoryStore() {
  return configureStore({
    reducer: {
      [MERMAID_EDITOR_STATE_KEY]: mermaidEditorReducer,
    },
  });
}

type MermaidEditorStoryStore = ReturnType<typeof createMermaidEditorStoryStore>;
type MermaidEditorSeedStore = SeedStore<MermaidEditorStoryStore>;

function renderSeededStory(
  seed: Parameters<typeof createMermaidEditorStateSeed>[0],
) {
  const seedStore: MermaidEditorSeedStore = (store) => {
    store.dispatch(
      mermaidEditorActions.replaceState(createMermaidEditorStateSeed(seed)),
    );
  };
  return () => (
    <SeededStoreProvider
      createStore={createMermaidEditorStoryStore}
      seedStore={seedStore}
    >
      <MermaidEditor />
    </SeededStoreProvider>
  );
}

export const Default: Story = { render: renderSeededStory({}) };
export const Sequence: Story = {
  render: renderSeededStory({
    presetId: 'sequence',
    code: MERMAID_PRESETS.find((preset) => preset.id === 'sequence')?.code,
  }),
};
export const SyntaxError: Story = {
  render: renderSeededStory({
    code: 'graph TD\nA -->',
  }),
};
export const Zoomed: Story = {
  render: renderSeededStory({
    zoom: 1.6,
    splitPos: 0.35,
  }),
};
export const AboutOpen: Story = {
  render: renderSeededStory({
    showAbout: true,
  }),
};
