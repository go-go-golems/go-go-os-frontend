import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import { MacBrowser } from './MacBrowser';
import {
  createMacBrowserStateSeed,
  macBrowserActions,
  macBrowserReducer,
  MAC_BROWSER_STATE_KEY,
} from './macBrowserState';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof MacBrowser> = {
  title: 'RichWidgets/MacBrowser',
  component: MacBrowser,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof MacBrowser>;

function createMacBrowserStoryStore() {
  return configureStore({
    reducer: {
      [MAC_BROWSER_STATE_KEY]: macBrowserReducer,
    },
  });
}

type MacBrowserStoryStore = ReturnType<typeof createMacBrowserStoryStore>;
type MacBrowserSeedStore = SeedStore<MacBrowserStoryStore>;

function renderSeededStory(seed: Parameters<typeof createMacBrowserStateSeed>[0]) {
  const seedStore: MacBrowserSeedStore = (store) => {
    store.dispatch(macBrowserActions.replaceState(createMacBrowserStateSeed(seed)));
  };
  return () => (
    <SeededStoreProvider createStore={createMacBrowserStoryStore} seedStore={seedStore}>
      <MacBrowser />
    </SeededStoreProvider>
  );
}

export const Welcome: Story = { render: renderSeededStory({}) };
export const MissingPage: Story = {
  render: renderSeededStory({
    url: 'mac://missing',
    inputUrl: 'mac://missing',
    history: ['mac://welcome', 'mac://missing'],
    histIdx: 1,
  }),
};
export const Editing: Story = {
  render: renderSeededStory({
    editing: true,
    editContent: '# Draft Page\n\nThis is a draft.',
  }),
};
export const CustomPage: Story = {
  render: renderSeededStory({
    url: 'mac://custom-demo',
    inputUrl: 'mac://custom-demo',
    history: ['mac://welcome', 'mac://custom-demo'],
    histIdx: 1,
    customPages: {
      'mac://custom-demo': '# Custom Demo\n\n[About](mac://about)',
    },
  }),
};
