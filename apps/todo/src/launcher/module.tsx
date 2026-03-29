import { type LaunchableAppModule, type LaunchReason } from '@go-go-golems/os-shell';
import type { OpenWindowPayload } from '@go-go-golems/os-core/desktop-core';
import { RuntimeSurfaceSessionHost } from '@go-go-golems/os-scripting';
import { type DesktopContribution, type WindowContentAdapter } from '@go-go-golems/os-core/desktop-react';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReactNode, useRef } from 'react';
import { Provider } from 'react-redux';
import { createTodoStore } from '../app/store';
import { STACK } from '../domain/stack';
import { TodoRealAppWindow } from './renderTodoApp';

const launcherStateSlice = createSlice({
  name: 'todoLauncher',
  initialState: {
    launchCount: 0,
    lastLaunchReason: null as LaunchReason | null,
  },
  reducers: {
    markLaunched(state, action: PayloadAction<LaunchReason>) {
      state.launchCount += 1;
      state.lastLaunchReason = action.payload;
    },
  },
});

const TODO_WORKSPACE_INSTANCE_PREFIX = 'workspace-';
const TODO_SESSION_PREFIX = 'todo-session:';

function nextInstanceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `todo-${Date.now()}`;
}

function buildWorkspaceWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = `${TODO_WORKSPACE_INSTANCE_PREFIX}${nextInstanceId()}`;
  return {
    id: `window:todo:${instanceId}`,
    title: 'Todo',
    icon: '✅',
    bounds: {
      x: 180,
      y: 56,
      w: 980,
      h: 700,
    },
    content: {
      kind: 'surface',
      surface: {
        bundleId: STACK.id,
        surfaceId: STACK.homeSurface,
        surfaceSessionId: `${TODO_SESSION_PREFIX}${instanceId}`,
      },
    },
    dedupeKey: reason === 'startup' ? 'todo:startup' : undefined,
  };
}

function createTodoCardAdapter(): WindowContentAdapter {
  return {
    id: 'todo.card-window',
    canRender: (window) => window.content.kind === 'surface' && window.content.surface?.bundleId === STACK.id,
    render: (window) => {
      const cardRef = window.content.surface;
      if (window.content.kind !== 'surface' || !cardRef || cardRef.bundleId !== STACK.id) {
        return null;
      }
      return <RuntimeSurfaceSessionHost windowId={window.id} sessionId={cardRef.surfaceSessionId} bundle={STACK} />;
    },
  };
}

function TodoLauncherAppHost() {
  const storeRef = useRef<ReturnType<typeof createTodoStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createTodoStore();
  }
  return (
    <Provider store={storeRef.current}>
      <TodoRealAppWindow />
    </Provider>
  );
}

export const todoLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'todo',
    name: 'Todo',
    icon: '✅',
    launch: { mode: 'window' },
    desktop: {
      order: 20,
    },
  },
  state: {
    stateKey: 'app_todo',
    reducer: launcherStateSlice.reducer,
  },
  buildLaunchWindow: (ctx, reason) => {
    ctx.dispatch(launcherStateSlice.actions.markLaunched(reason));
    return buildWorkspaceWindowPayload(reason);
  },
  createContributions: (): DesktopContribution[] => [
    {
      id: 'todo.window-adapters',
      windowContentAdapters: [createTodoCardAdapter()],
    },
  ],
  renderWindow: ({ windowId }): ReactNode => <TodoLauncherAppHost key={windowId} />,
};
