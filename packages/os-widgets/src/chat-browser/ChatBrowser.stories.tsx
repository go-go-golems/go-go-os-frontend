import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { ChatBrowser } from './ChatBrowser';
import { CONVERSATIONS } from './sampleData';
import { fixedFrameDecorator } from '../storybook/frameDecorators';
import { SeededStoreProvider, type SeedStore } from '../storybook/seededStore';
import {
  CHAT_BROWSER_STATE_KEY,
  chatBrowserActions,
  chatBrowserReducer,
  createChatBrowserStateSeed,
} from './chatBrowserState';
import '@go-go-golems/os-widgets/theme';

const meta: Meta<typeof ChatBrowser> = {
  title: 'RichWidgets/ChatBrowser',
  component: ChatBrowser,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof ChatBrowser>;

function createChatBrowserStoryStore() {
  return configureStore({
    reducer: {
      [CHAT_BROWSER_STATE_KEY]: chatBrowserReducer,
    },
  });
}

type ChatBrowserStoryStore = ReturnType<typeof createChatBrowserStoryStore>;
type ChatBrowserSeedStore = SeedStore<ChatBrowserStoryStore>;

function renderWithStore(
  seedStore: ChatBrowserSeedStore,
  options: { height?: string | number } = {},
) {
  return () => (
    <SeededStoreProvider
      createStore={createChatBrowserStoryStore}
      seedStore={seedStore}
    >
      <div style={{ height: options.height ?? 600 }}>
        <ChatBrowser />
      </div>
    </SeededStoreProvider>
  );
}

function renderSeededStory(
  seed: Parameters<typeof createChatBrowserStateSeed>[0],
  options: { height?: string | number } = {},
) {
  return renderWithStore((store) => {
    store.dispatch(chatBrowserActions.replaceState(createChatBrowserStateSeed(seed)));
  }, options);
}

const codingConversations = CONVERSATIONS.filter((conversation) =>
  conversation.tags.includes('coding'),
);

const denseConversations = [
  ...CONVERSATIONS,
  ...CONVERSATIONS.slice(0, 4).map((conversation, index) => ({
    ...conversation,
    id: conversation.id + 100,
    title: `${conversation.title} (${index + 1})`,
    date: `1994-04-${String(index + 10).padStart(2, '0')}`,
  })),
];

export const Default: Story = {
  render: renderSeededStory({}),
  decorators: [fixedFrameDecorator(900, 600)],
};

export const Compact: Story = {
  render: renderSeededStory({}),
  decorators: [fixedFrameDecorator(640, 440)],
};

export const FewConversations: Story = {
  render: renderSeededStory({
    conversations: CONVERSATIONS.slice(0, 3),
  }),
  decorators: [fixedFrameDecorator(900, 600)],
};

export const CodingOnly: Story = {
  render: renderSeededStory({
    conversations: codingConversations,
  }),
  decorators: [fixedFrameDecorator(900, 600)],
};

export const EmptyState: Story = {
  render: renderSeededStory({
    conversations: [],
  }),
  decorators: [fixedFrameDecorator(900, 600)],
};

export const DenseInbox: Story = {
  render: renderSeededStory({
    conversations: denseConversations,
  }),
  decorators: [fixedFrameDecorator(1024, 680)],
};

export const ReduxSearchPanel: Story = {
  render: renderSeededStory({
    showSearch: true,
    searchParams: {
      text: 'sql',
      model: 'Claude',
      tags: ['coding'],
      dateFrom: '1994-04-01',
      dateTo: '1994-04-06',
      inMessages: true,
      inTitles: true,
    },
  }),
  decorators: [fixedFrameDecorator(900, 600)],
};

export const ReduxFilteredResults: Story = {
  render: renderSeededStory({
    selectedConversationId: 10,
    searchResultIds: [10, 4],
    quickFilter: 'code',
  }),
  decorators: [fixedFrameDecorator(900, 600)],
};

export const ReduxSelectedConversation: Story = {
  render: renderSeededStory({
    selectedConversationId: 2,
  }),
  decorators: [fixedFrameDecorator(900, 600)],
};
