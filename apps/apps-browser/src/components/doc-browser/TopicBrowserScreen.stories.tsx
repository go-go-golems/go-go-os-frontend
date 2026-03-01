import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createAppsBrowserStore } from '../../app/store';
import { createDefaultAppsHandlers } from '../../mocks/msw/defaultHandlers';
import { DocBrowserWindow } from './DocBrowserWindow';

function StoreDecorator(Story: React.ComponentType) {
  const store = createAppsBrowserStore();
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
}

const meta = {
  title: 'Apps/AppsBrowser/DocBrowser/TopicBrowser',
  component: DocBrowserWindow,
  decorators: [StoreDecorator],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createDefaultAppsHandlers() },
  },
} satisfies Meta<typeof DocBrowserWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoTopicSelected: Story = {
  args: { initialScreen: 'topic-browser' },
};

export const PreSelectedTopic: Story = {
  args: { initialScreen: 'topic-browser', initialTopic: 'backend' },
};

/** Topic browser with new-window callback. Ctrl/Cmd-click or right-click doc rows in topic detail. */
export const TopicWithNewWindow: Story = {
  args: {
    initialScreen: 'topic-browser',
    initialTopic: 'backend',
    onOpenDocNewWindow: (...args: unknown[]) => console.log("[story] onOpenDocNewWindow", ...args),
  },
};

/** No topic selected with new-window callback wired for subsequent topic browsing. */
export const NoTopicWithNewWindow: Story = {
  args: {
    initialScreen: 'topic-browser',
    onOpenDocNewWindow: (...args: unknown[]) => console.log("[story] onOpenDocNewWindow", ...args),
  },
};
