import { type LaunchableAppModule, type LauncherHostContext, type LaunchReason } from '@hypercard/desktop-os';
import { CodeEditorWindow, decodeRuntimeSurfaceEditorInstanceId, getEditorInitialCode, getEditorInitialPackId, RuntimeSurfaceSessionHost } from '@hypercard/hypercard-runtime';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import type { DesktopCommandHandler, DesktopContribution, WindowContentAdapter } from '@hypercard/engine/desktop-react';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import { STACK } from '../domain/stack';

const APP_ID = 'hypercard-tools';
const OPEN_HOME_COMMAND = 'hypercard-tools.open-home';
const WORKSPACE_INSTANCE_PREFIX = 'workspace-';
const SESSION_PREFIX = 'hypercard-tools-session:';

interface DemoEventEntry {
  label: string;
  ts: string;
}

const hypercardToolsStateSlice = createSlice({
  name: 'app_hypercard_tools',
  initialState: {
    launchCount: 0,
    lastLaunchReason: null as LaunchReason | null,
    selectedTheme: 'Geneva',
    selectedRows: [] as string[],
    searchText: '',
    selectedCellIndex: null as number | null,
    lastMergedPayload: null as Record<string, unknown> | null,
    demoEvents: [] as DemoEventEntry[],
  },
  reducers: {
    markLaunched(state, action: PayloadAction<LaunchReason>) {
      state.launchCount += 1;
      state.lastLaunchReason = action.payload;
    },
    setTheme(state, action: PayloadAction<{ theme: string }>) {
      state.selectedTheme = String(action.payload.theme ?? 'Geneva');
    },
    setSelectedRows(state, action: PayloadAction<{ selectedRowKeys: string[] }>) {
      state.selectedRows = Array.isArray(action.payload.selectedRowKeys)
        ? action.payload.selectedRowKeys.map((key) => String(key))
        : [];
    },
    setSearchText(state, action: PayloadAction<{ value: string }>) {
      state.searchText = String(action.payload.value ?? '');
    },
    setSelectedCellIndex(state, action: PayloadAction<{ selectedIndex: number | null }>) {
      const selectedIndex = action.payload.selectedIndex;
      state.selectedCellIndex = selectedIndex === null ? null : Number(selectedIndex);
    },
    setMergedPayload(state, action: PayloadAction<Record<string, unknown>>) {
      state.lastMergedPayload = action.payload;
    },
    logDemoEvent(state, action: PayloadAction<{ label: string; ts?: string }>) {
      state.demoEvents.unshift({
        label: String(action.payload.label ?? 'event'),
        ts: String(action.payload.ts ?? new Date().toISOString()),
      });
      state.demoEvents = state.demoEvents.slice(0, 12);
    },
  },
});

function nextInstanceId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `hypercard-tools-${Date.now()}`;
}

function buildWorkspaceWindowPayload(reason: LaunchReason): OpenWindowPayload {
  const instanceId = `${WORKSPACE_INSTANCE_PREFIX}${nextInstanceId()}`;
  return {
    id: `window:${APP_ID}:${instanceId}`,
    title: 'HyperCard Tools',
    icon: '🛠️',
    bounds: { x: 210, y: 72, w: 980, h: 700 },
    content: {
      kind: 'surface',
      surface: {
        bundleId: STACK.id,
        surfaceId: STACK.homeSurface,
        surfaceSessionId: `${SESSION_PREFIX}${instanceId}`,
      },
    },
    dedupeKey: reason === 'startup' ? `${APP_ID}:startup` : undefined,
  };
}

function createHypercardToolsCardAdapter(): WindowContentAdapter {
  return {
    id: 'hypercard-tools.card-window',
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

function renderUnknownInstance(instanceId: string): ReactNode {
  return (
    <section style={{ padding: 12, display: 'grid', gap: 8 }}>
      <strong>HyperCard Tools</strong>
      <span>Unknown hypercard-tools window instance: {instanceId}</span>
    </section>
  );
}

function createHypercardToolsCommandHandler(hostContext: LauncherHostContext): DesktopCommandHandler {
  return {
    id: 'hypercard-tools.commands',
    priority: 120,
    matches: (commandId) => commandId === OPEN_HOME_COMMAND,
    run: () => {
      hostContext.openWindow(buildWorkspaceWindowPayload('command'));
      return 'handled';
    },
  };
}

export const hypercardToolsLauncherModule: LaunchableAppModule = {
  manifest: {
    id: APP_ID,
    name: 'HyperCard Tools',
    icon: '🛠️',
    launch: { mode: 'window' },
    desktop: { order: 85 },
  },
  state: {
    stateKey: 'app_hypercard_tools',
    reducer: hypercardToolsStateSlice.reducer,
  },
  buildLaunchWindow: (ctx, reason) => {
    ctx.dispatch(hypercardToolsStateSlice.actions.markLaunched(reason));
    return buildWorkspaceWindowPayload(reason);
  },
  createContributions: (hostContext): DesktopContribution[] => [
    {
      id: 'hypercard-tools.contributions',
      commands: [createHypercardToolsCommandHandler(hostContext)],
      windowContentAdapters: [createHypercardToolsCardAdapter()],
    },
  ],
  renderWindow: ({ instanceId }): ReactNode => {
    const ref = decodeRuntimeSurfaceEditorInstanceId(instanceId);
    if (!ref) {
      return renderUnknownInstance(instanceId);
    }

    return <CodeEditorWindow surfaceId={ref.surfaceId} initialCode={getEditorInitialCode(ref)} packId={getEditorInitialPackId(ref)} />;
  },
};
