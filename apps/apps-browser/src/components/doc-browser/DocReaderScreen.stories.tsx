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
  title: 'Apps/AppsBrowser/DocBrowser/Reader',
  component: DocBrowserWindow,
  decorators: [StoreDecorator],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createDefaultAppsHandlers() },
  },
} satisfies Meta<typeof DocBrowserWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GuideOverview: Story = {
  args: { initialModuleId: 'inventory', initialSlug: 'overview' },
};

export const ApiReference: Story = {
  args: { initialModuleId: 'inventory', initialSlug: 'api-reference' },
};

export const Troubleshooting: Story = {
  args: { initialModuleId: 'inventory', initialSlug: 'troubleshooting' },
};

export const WithSeeAlso: Story = {
  args: { initialModuleId: 'arc-agi', initialSlug: 'runtime-modes' },
};

export const SessionLifecycle: Story = {
  args: { initialModuleId: 'arc-agi', initialSlug: 'session-lifecycle' },
};

export const DocNotFound: Story = {
  args: { initialModuleId: 'inventory', initialSlug: 'nonexistent' },
};

/** Showcases syntax highlighting and copy button across TypeScript, Go, JSON, YAML, and bash code blocks */
export const CodeBlocksAndSyntaxHighlighting: Story = {
  args: { initialModuleId: 'inventory', initialSlug: 'integration-guide' },
};

/** Reader with see-also links that support Ctrl/Cmd-click to open in new window. Check Actions panel. */
export const SeeAlsoWithNewWindow: Story = {
  args: {
    initialModuleId: 'arc-agi',
    initialSlug: 'runtime-modes',
    onOpenDocNewWindow: (...args: unknown[]) => console.log("[story] onOpenDocNewWindow", ...args),
  },
};

/** API reference page with new-window callback. Right-click see-also links for context menu. */
export const ApiReferenceWithNewWindow: Story = {
  args: {
    initialModuleId: 'inventory',
    initialSlug: 'api-reference',
    onOpenDocNewWindow: (...args: unknown[]) => console.log("[story] onOpenDocNewWindow", ...args),
  },
};

/** Prev/next navigation with new-window support. Navigate between pages and test context menus. */
export const NavigationWithNewWindow: Story = {
  args: {
    initialModuleId: 'inventory',
    initialSlug: 'overview',
    onOpenDocNewWindow: (...args: unknown[]) => console.log("[story] onOpenDocNewWindow", ...args),
  },
};
