import type { Meta, StoryObj } from '@storybook/react';
import { ChatBrowser } from './ChatBrowser';
import { CONVERSATIONS } from './sampleData';
import { fixedFrameDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof ChatBrowser> = {
  title: 'RichWidgets/ChatBrowser',
  component: ChatBrowser,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof ChatBrowser>;

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
  args: {},
  decorators: [fixedFrameDecorator(900, 600)],
};

export const Compact: Story = {
  args: {},
  decorators: [fixedFrameDecorator(640, 440)],
};

export const FewConversations: Story = {
  args: {
    conversations: CONVERSATIONS.slice(0, 3),
  },
  decorators: [fixedFrameDecorator(900, 600)],
};

export const CodingOnly: Story = {
  args: {
    conversations: codingConversations,
  },
  decorators: [fixedFrameDecorator(900, 600)],
};

export const EmptyState: Story = {
  args: {
    conversations: [],
  },
  decorators: [fixedFrameDecorator(900, 600)],
};

export const DenseInbox: Story = {
  args: {
    conversations: denseConversations,
  },
  decorators: [fixedFrameDecorator(1024, 680)],
};
