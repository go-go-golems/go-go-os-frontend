import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { MacSlides } from './MacSlides';
import {
  createDenseDeckMarkdown,
  createEmptyDeckMarkdown,
  DEFAULT_MARKDOWN,
} from './sampleData';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import {
  createMacSlidesStateSeed,
  MAC_SLIDES_STATE_KEY,
  macSlidesActions,
  macSlidesReducer,
} from './macSlidesState';
import '@go-go-golems/os-widgets/theme';

const alignmentDeck = [
  '<!-- align: center -->\n# Centered Title\n\nThis deck starts centered.',
  '<!-- align: left -->\n# Left Notes\n\n- Keep content left\n- Keep bullets aligned\n- Review parser output',
  '# Auto Layout\n\nAuto keeps headings centered while paragraphs remain left-aligned.',
].join('\n---\n');

const meta: Meta<typeof MacSlides> = {
  title: 'RichWidgets/MacSlides',
  component: MacSlides,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MacSlides>;

function createMacSlidesStoryStore() {
  return configureStore({
    reducer: {
      [MAC_SLIDES_STATE_KEY]: macSlidesReducer,
    },
  });
}

type MacSlidesStoryStore = ReturnType<typeof createMacSlidesStoryStore>;
type MacSlidesSeedStore = SeedStore<MacSlidesStoryStore>;

function renderWithStore(
  seedStore: MacSlidesSeedStore,
  options: {
    fileName?: string;
    height?: string | number;
  } = {},
) {
  return () => (
    <SeededStoreProvider
      createStore={createMacSlidesStoryStore}
      seedStore={seedStore}
    >
      <div style={{ height: options.height ?? '100vh' }}>
        <MacSlides fileName={options.fileName} />
      </div>
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createMacSlidesStateSeed>[0],
  options: {
    fileName?: string;
    height?: string | number;
  } = {},
) {
  return renderWithStore((store) => {
    store.dispatch(macSlidesActions.replaceState(createMacSlidesStateSeed(seed)));
  }, options);
}

export const Default: Story = {
  render: renderSeededStory(
    {
      initialMarkdown: DEFAULT_MARKDOWN,
    },
    {
      fileName: 'Quarterly Deck',
    },
  ),
  decorators: [fullscreenDecorator],
};

export const EmptyDeck: Story = {
  render: renderSeededStory(
    {
      initialMarkdown: createEmptyDeckMarkdown(),
    },
    {
      fileName: 'Blank Deck',
    },
  ),
  decorators: [fullscreenDecorator],
};

export const DenseDeck: Story = {
  render: renderSeededStory(
    {
      initialMarkdown: createDenseDeckMarkdown(),
    },
    {
      fileName: 'Roadmap Review',
    },
  ),
  decorators: [fullscreenDecorator],
};

export const AlignmentStates: Story = {
  render: renderSeededStory(
    {
      initialMarkdown: alignmentDeck,
      initialSlide: 1,
    },
    {
      fileName: 'Alignment Demo',
    },
  ),
  decorators: [fullscreenDecorator],
};

export const PresentationOpen: Story = {
  render: renderSeededStory({
    initialMarkdown: DEFAULT_MARKDOWN,
    initialSlide: 2,
    presentationOpen: true,
  }),
  decorators: [fullscreenDecorator],
};

export const PaletteOpen: Story = {
  render: renderSeededStory(
    {
      initialMarkdown: DEFAULT_MARKDOWN,
      paletteOpen: true,
    },
    {
      height: 620,
    },
  ),
  decorators: [fixedFrameDecorator(960, 620)],
};

export const StandaloneEmbed: Story = {
  render: () => (
    <div style={{ height: 620 }}>
      <MacSlides
        fileName="Standalone Deck"
        initialMarkdown={DEFAULT_MARKDOWN}
        initialSlide={1}
      />
    </div>
  ),
  decorators: [fixedFrameDecorator(960, 620)],
};
