// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { CardStackDefinition } from '../../../cards/types';
import { MessageRenderer } from '../../../chat/renderers/builtin/MessageRenderer';
import { debugReducer } from '../../../debug/debugSlice';
import { focusWindow, openWindow } from '../../../desktop/core/state/windowingSlice';
import { windowingReducer } from '../../../desktop/core/state/windowingSlice';
import { notificationsReducer } from '../../../features/notifications/notificationsSlice';
import { DesktopShell } from './DesktopShell';
import { useRegisterWindowContextActions, useRegisterWindowMenuSections } from './desktopMenuRuntime';
import type {
  DesktopActionEntry,
  DesktopActionSection,
  DesktopVisibilityContextResolver,
} from './types';

const roots: Root[] = [];
const containers: HTMLElement[] = [];

const TEST_STACK: CardStackDefinition = {
  id: 'context-menu-runtime-stack',
  name: 'Context Menu Runtime',
  icon: '🧪',
  homeCard: 'missing-home-card',
  plugin: {
    bundleCode: '',
  },
  cards: {},
};

const APP_CONTEXT_ACTIONS: DesktopActionEntry[] = [
  {
    id: 'inspect-widget',
    label: 'Inspect Widget',
    commandId: 'runtime.widget.inspect',
    payload: { target: 'widget:timeline' },
  },
];

const APP_MENU_SECTIONS: DesktopActionSection[] = [
  {
    id: 'chat',
    label: 'Chat',
    merge: 'replace',
    items: [{ id: 'runtime-chat-new', label: 'New Chat', commandId: 'runtime.chat.new' }],
  },
  {
    id: 'profile',
    label: 'Profile',
    merge: 'replace',
    items: [{ id: 'runtime-profile-default', label: 'Default Agent', commandId: 'runtime.profile.default' }],
  },
];

const POLICY_CONTEXT_ACTIONS: DesktopActionEntry[] = [
  {
    id: 'admin-export',
    label: 'Admin Export',
    commandId: 'runtime.admin.export',
    visibility: {
      allowedRoles: ['admin'],
      unauthorized: 'hide',
    },
  },
];

function createTestStore() {
  return configureStore({
    reducer: {
      windowing: windowingReducer,
      notifications: notificationsReducer,
      debug: debugReducer,
    },
  });
}

function RuntimeWindow() {
  useRegisterWindowContextActions(APP_CONTEXT_ACTIONS);
  return (
    <section style={{ padding: 8 }}>
      <strong>Runtime Window</strong>
    </section>
  );
}

function RuntimeMenuWindow() {
  useRegisterWindowMenuSections(APP_MENU_SECTIONS);
  return (
    <section style={{ padding: 8 }}>
      <strong>Runtime Menu Window</strong>
    </section>
  );
}

function RuntimePolicyWindow() {
  useRegisterWindowContextActions(POLICY_CONTEXT_ACTIONS);
  return (
    <section style={{ padding: 8 }}>
      <strong>Runtime Policy Window</strong>
    </section>
  );
}

function RuntimeMessageWindow() {
  return (
    <section style={{ padding: 8 }}>
      <MessageRenderer
        e={{
          id: 'msg-runtime-1',
          kind: 'message',
          createdAt: Date.now(),
          props: {
            role: 'assistant',
            content: 'Runtime message payload',
            streaming: false,
          },
        }}
        ctx={{ mode: 'normal', convId: 'conv-runtime' }}
      />
    </section>
  );
}

function menuLabels(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-part="windowing-menu-button"]'))
    .map((node) => node.textContent?.trim() ?? '')
    .filter((label): label is string => label.length > 0);
}

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  if (typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.scrollIntoView !== 'function') {
    HTMLElement.prototype.scrollIntoView = () => undefined;
  }
});

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of containers.splice(0)) {
    container.remove();
  }
});

function fireContextMenu(target: Element): void {
  act(() => {
    target.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: 320,
        clientY: 180,
      }),
    );
  });
}

describe('desktop shell context-menu invocation metadata', () => {
  it('passes source/menu/window/widget/payload metadata to onCommand from title-bar actions', async () => {
    const store = createTestStore();
    const onCommand = vi.fn();

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(
        <Provider store={store}>
          <DesktopShell
            stack={TEST_STACK}
            renderAppWindow={(appKey) => (appKey === 'runtime-tools:one' ? <RuntimeWindow /> : null)}
            onCommand={onCommand}
          />
        </Provider>,
      );
    });

    const runtimeWindowId = 'window:runtime:one';
    await act(async () => {
      store.dispatch(
        openWindow({
          id: runtimeWindowId,
          title: 'Runtime Tools',
          icon: '🧪',
          bounds: { x: 220, y: 72, w: 440, h: 320 },
          content: {
            kind: 'app',
            appKey: 'runtime-tools:one',
          },
        }),
      );
    });

    const titleBar = container.querySelector('[data-part="windowing-window-title-bar"]');
    expect(titleBar).not.toBeNull();
    fireContextMenu(titleBar as Element);

    const contextMenu = container.querySelector('[data-part="context-menu"]');
    expect(contextMenu).not.toBeNull();
    const inspectAction = Array.from(contextMenu?.querySelectorAll('button') ?? []).find((button) =>
      button.textContent?.includes('Inspect Widget'),
    );
    expect(inspectAction).not.toBeUndefined();

    act(() => {
      inspectAction?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    expect(onCommand).toHaveBeenCalledWith(
      'runtime.widget.inspect',
      expect.objectContaining({
        source: 'context-menu',
        menuId: 'window-context',
        windowId: runtimeWindowId,
        widgetId: 'title-bar',
        contextTarget: expect.objectContaining({
          kind: 'window',
          windowId: runtimeWindowId,
          widgetId: 'title-bar',
          appId: 'runtime-tools',
        }),
        payload: { target: 'widget:timeline' },
      }),
    );
  });

  it('recomposes focused menubar sections when switching between runtime and neutral windows', async () => {
    const store = createTestStore();

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(
        <Provider store={store}>
          <DesktopShell
            stack={TEST_STACK}
            renderAppWindow={(appKey) => {
              if (appKey === 'runtime-tools:menu') {
                return <RuntimeMenuWindow />;
              }
              if (appKey === 'runtime-tools:neutral') {
                return <section style={{ padding: 8 }}>Neutral Window</section>;
              }
              return null;
            }}
          />
        </Provider>,
      );
    });

    const runtimeWindowId = 'window:runtime:menu';
    const neutralWindowId = 'window:runtime:neutral';
    await act(async () => {
      store.dispatch(
        openWindow({
          id: runtimeWindowId,
          title: 'Runtime Menu',
          icon: '🧪',
          bounds: { x: 180, y: 68, w: 420, h: 300 },
          content: { kind: 'app', appKey: 'runtime-tools:menu' },
        }),
      );
      store.dispatch(
        openWindow({
          id: neutralWindowId,
          title: 'Neutral Window',
          icon: '📄',
          bounds: { x: 640, y: 96, w: 420, h: 300 },
          content: { kind: 'app', appKey: 'runtime-tools:neutral' },
        }),
      );
    });

    expect(menuLabels(container)).not.toContain('Chat');
    expect(menuLabels(container)).not.toContain('Profile');

    await act(async () => {
      store.dispatch(focusWindow(runtimeWindowId));
    });
    expect(menuLabels(container)).toContain('Chat');
    expect(menuLabels(container)).toContain('Profile');

    await act(async () => {
      store.dispatch(focusWindow(neutralWindowId));
    });
    expect(menuLabels(container)).not.toContain('Chat');
    expect(menuLabels(container)).not.toContain('Profile');
  });

  it('opens message-target context menu and forwards conversation/message payload metadata', async () => {
    const store = createTestStore();
    const onCommand = vi.fn();

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(
        <Provider store={store}>
          <DesktopShell
            stack={TEST_STACK}
            renderAppWindow={(appKey) => (appKey === 'runtime-tools:message' ? <RuntimeMessageWindow /> : null)}
            onCommand={onCommand}
          />
        </Provider>,
      );
    });

    const runtimeWindowId = 'window:runtime:message';
    await act(async () => {
      store.dispatch(
        openWindow({
          id: runtimeWindowId,
          title: 'Runtime Message Window',
          icon: '💬',
          bounds: { x: 200, y: 72, w: 460, h: 320 },
          content: {
            kind: 'app',
            appKey: 'runtime-tools:message',
          },
        }),
      );
    });

    const message = container.querySelector('[data-part="chat-message"]');
    expect(message).not.toBeNull();
    fireContextMenu(message as Element);

    const contextMenu = container.querySelector('[data-part="context-menu"]');
    expect(contextMenu).not.toBeNull();
    expect(contextMenu?.textContent).toContain('Reply');
    expect(contextMenu?.textContent).toContain('Copy');
    expect(contextMenu?.textContent).toContain('Create Task');
    expect(contextMenu?.textContent).toContain('Debug Event');

    const debugEventAction = Array.from(contextMenu?.querySelectorAll('button') ?? []).find(
      (button) => button.textContent?.trim() === 'Debug Event',
    );
    expect(debugEventAction).not.toBeUndefined();

    act(() => {
      debugEventAction?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    expect(onCommand).toHaveBeenCalledWith(
      'chat.message.debug-event',
      expect.objectContaining({
        source: 'context-menu',
        menuId: 'message-context',
        windowId: runtimeWindowId,
        contextTarget: expect.objectContaining({
          kind: 'message',
          windowId: runtimeWindowId,
          conversationId: 'conv-runtime',
          messageId: 'msg-runtime-1',
        }),
        payload: expect.objectContaining({
          conversationId: 'conv-runtime',
          messageId: 'msg-runtime-1',
          content: 'Runtime message payload',
        }),
      }),
    );
  });

  it('applies externally injected visibility resolver context for context actions', async () => {
    const store = createTestStore();
    const onCommand = vi.fn();
    const visibilityContextResolver: DesktopVisibilityContextResolver = ({ target }) => ({
      target,
      roles: ['admin'],
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(
        <Provider store={store}>
          <DesktopShell
            stack={TEST_STACK}
            renderAppWindow={(appKey) => (appKey === 'runtime-tools:policy' ? <RuntimePolicyWindow /> : null)}
            visibilityContextResolver={visibilityContextResolver}
            onCommand={onCommand}
          />
        </Provider>,
      );
    });

    const runtimeWindowId = 'window:runtime:policy';
    await act(async () => {
      store.dispatch(
        openWindow({
          id: runtimeWindowId,
          title: 'Runtime Policy',
          icon: '🛡️',
          bounds: { x: 220, y: 72, w: 440, h: 320 },
          content: {
            kind: 'app',
            appKey: 'runtime-tools:policy',
          },
        }),
      );
    });

    const titleBar = container.querySelector('[data-part="windowing-window-title-bar"]');
    expect(titleBar).not.toBeNull();
    fireContextMenu(titleBar as Element);

    const contextMenu = container.querySelector('[data-part="context-menu"]');
    expect(contextMenu).not.toBeNull();
    const adminExportAction = Array.from(contextMenu?.querySelectorAll('button') ?? []).find((button) =>
      button.textContent?.includes('Admin Export'),
    );
    expect(adminExportAction).not.toBeUndefined();

    act(() => {
      adminExportAction?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    expect(onCommand).toHaveBeenCalledWith(
      'runtime.admin.export',
      expect.objectContaining({
        source: 'context-menu',
        menuId: 'window-context',
        windowId: runtimeWindowId,
      }),
    );
  });
});
