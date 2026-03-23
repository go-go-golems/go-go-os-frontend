import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createAppStore } from '../app/createAppStore';
import type { RuntimeSurfaceMeta, RuntimeBundleDefinition } from '@hypercard/engine';
import { openWindow } from '@hypercard/engine/desktop-core';
import CHAT_PLUGIN_BUNDLE from './fixtures/CardSessionHost.chat.vm.js?raw';
import LIST_PLUGIN_BUNDLE from './fixtures/CardSessionHost.list.vm.js?raw';
import NAV_PLUGIN_BUNDLE from './fixtures/CardSessionHost.nav.vm.js?raw';
import { RuntimeSurfaceSessionHost, type RuntimeSurfaceSessionHostProps } from './RuntimeSurfaceSessionHost';
import REPORT_PLUGIN_BUNDLE from './fixtures/CardSessionHost.report.vm.js?raw';

interface PluginCardMeta {
  id: string;
  title: string;
  icon: string;
}

function toPluginCard(card: PluginCardMeta): RuntimeSurfaceMeta {
  return {
    id: card.id,
    type: 'plugin',
    title: card.title,
    icon: card.icon,
    ui: {
      t: 'text',
      value: `Plugin card placeholder: ${card.id}`,
    },
  };
}

function createPluginStack(options: {
  id: string;
  name: string;
  icon: string;
  homeSurface: string;
  packageIds?: string[];
  bundleCode: string;
  surfaces: PluginCardMeta[];
}): RuntimeBundleDefinition {
  return {
    id: options.id,
    name: options.name,
    icon: options.icon,
    homeSurface: options.homeSurface,
    plugin: {
      packageIds: options.packageIds ?? ['ui'],
      bundleCode: options.bundleCode,
      capabilities: {
        system: ['nav.go', 'nav.back', 'notify.show'],
      },
    },
    surfaces: Object.fromEntries(options.surfaces.map((card) => [card.id, toPluginCard(card)])),
  };
}

const NAV_STACK = createPluginStack({
  id: 'nav-demo',
  name: 'Nav Demo',
  icon: '🧭',
  homeSurface: 'list',
  bundleCode: NAV_PLUGIN_BUNDLE,
  surfaces: [
    { id: 'list', title: 'Item List', icon: '📋' },
    { id: 'detail', title: 'Item Detail', icon: '📄' },
  ],
});

const CHAT_STACK = createPluginStack({
  id: 'chat-demo',
  name: 'Chat Demo',
  icon: '💬',
  homeSurface: 'chat',
  bundleCode: CHAT_PLUGIN_BUNDLE,
  surfaces: [{ id: 'chat', title: 'Assistant', icon: '💬' }],
});

const REPORT_STACK = createPluginStack({
  id: 'report-demo',
  name: 'Report Demo',
  icon: '📊',
  homeSurface: 'report',
  bundleCode: REPORT_PLUGIN_BUNDLE,
  surfaces: [{ id: 'report', title: 'Monthly Report', icon: '📊' }],
});

const LIST_STACK = createPluginStack({
  id: 'list-demo',
  name: 'List Demo',
  icon: '📋',
  homeSurface: 'browse',
  bundleCode: LIST_PLUGIN_BUNDLE,
  surfaces: [{ id: 'browse', title: 'Browse Items', icon: '📋' }],
});

const { createStore } = createAppStore({});

function createStoreWithSession(stack: RuntimeBundleDefinition, sessionId: string, surfaceId?: string) {
  const store = createStore();
  const resolvedSurfaceId = surfaceId ?? stack.homeSurface;

  store.dispatch(
    openWindow({
      id: `window:${sessionId}`,
      title: stack.surfaces[resolvedSurfaceId]?.title ?? 'Window',
      bounds: { x: 0, y: 0, w: 400, h: 300 },
      content: {
        kind: 'surface',
        surface: {
          bundleId: stack.id,
          surfaceId: resolvedSurfaceId,
          surfaceSessionId: sessionId,
        },
      },
    })
  );

  return store;
}

function RuntimeSurfaceSessionHostWrapper(props: RuntimeSurfaceSessionHostProps) {
  const store = createStoreWithSession(props.bundle, props.sessionId);
  return (
    <Provider store={store}>
      <div style={{ width: 440, height: 380, border: '2px solid #000', overflow: 'auto', background: '#fff' }}>
        <RuntimeSurfaceSessionHost {...props} />
      </div>
    </Provider>
  );
}

const meta = {
  title: 'HypercardRuntime/RuntimeHost/CardSessionHost',
  component: RuntimeSurfaceSessionHostWrapper,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof RuntimeSurfaceSessionHostWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NavigableMenu: Story = {
  args: {
    windowId: 'window:s1',
    sessionId: 's1',
    bundle: NAV_STACK,
  },
};

export const ChatCard: Story = {
  args: {
    windowId: 'window:s2',
    sessionId: 's2',
    bundle: CHAT_STACK,
  },
};

export const ReportCard: Story = {
  args: {
    windowId: 'window:s3',
    sessionId: 's3',
    bundle: REPORT_STACK,
  },
};

export const ListCard: Story = {
  args: {
    windowId: 'window:s4',
    sessionId: 's4',
    bundle: LIST_STACK,
  },
};

export const PreviewMode: Story = {
  args: {
    windowId: 'window:s5',
    sessionId: 's5',
    bundle: NAV_STACK,
    mode: 'preview',
  },
};

export const TwoSessionsIsolated: Story = {
  args: {
    windowId: 'window:session-a',
    sessionId: 'session-a',
    bundle: NAV_STACK,
  },
  render: () => {
    const storeA = createStoreWithSession(NAV_STACK, 'session-a');
    const storeB = createStoreWithSession(NAV_STACK, 'session-b');
    return (
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4, fontFamily: 'monospace', fontSize: 11 }}>
            Session A (session-a)
          </div>
          <Provider store={storeA}>
            <div style={{ width: 380, height: 340, border: '2px solid #000', overflow: 'auto', background: '#fff' }}>
              <RuntimeSurfaceSessionHost windowId="window:session-a" sessionId="session-a" bundle={NAV_STACK} />
            </div>
          </Provider>
        </div>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4, fontFamily: 'monospace', fontSize: 11 }}>
            Session B (session-b)
          </div>
          <Provider store={storeB}>
            <div style={{ width: 380, height: 340, border: '2px solid #000', overflow: 'auto', background: '#fff' }}>
              <RuntimeSurfaceSessionHost windowId="window:session-b" sessionId="session-b" bundle={NAV_STACK} />
            </div>
          </Provider>
        </div>
      </div>
    );
  },
};
