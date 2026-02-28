import { formatAppKey, type LaunchableAppModule, type LauncherHostContext, type LaunchReason } from '@hypercard/desktop-os';
import { CodeEditorWindow, decodeRuntimeCardEditorInstanceId, getEditorInitialCode } from '@hypercard/engine';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import type { DesktopCommandHandler, DesktopContribution } from '@hypercard/engine/desktop-react';
import type { ReactNode } from 'react';

const APP_ID = 'hypercard-tools';
const HOME_INSTANCE = 'home';
const OPEN_HOME_COMMAND = 'hypercard-tools.open-home';

function buildHomeWindowPayload(reason: LaunchReason): OpenWindowPayload {
  return {
    id: `window:${APP_ID}:${HOME_INSTANCE}`,
    title: 'HyperCard Tools',
    icon: '🛠️',
    bounds: { x: 210, y: 72, w: 760, h: 540 },
    content: { kind: 'app', appKey: formatAppKey(APP_ID, HOME_INSTANCE) },
    dedupeKey: reason === 'startup' ? `${APP_ID}:home:startup` : `${APP_ID}:home`,
  };
}

function renderHomeWindow(): ReactNode {
  return (
    <section style={{ padding: 14, display: 'grid', gap: 10, fontSize: 12 }}>
      <strong>HyperCard Tools</strong>
      <span>Runtime-card tooling windows are opened by command or by runtime debug UI actions.</span>
      <span>Use Runtime Card Registry and click Edit to open the code editor for a runtime card.</span>
    </section>
  );
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
      hostContext.openWindow(buildHomeWindowPayload('command'));
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
  buildLaunchWindow: (_ctx, reason) => buildHomeWindowPayload(reason),
  createContributions: (hostContext): DesktopContribution[] => [
    {
      id: 'hypercard-tools.contributions',
      commands: [createHypercardToolsCommandHandler(hostContext)],
    },
  ],
  renderWindow: ({ instanceId }): ReactNode => {
    if (instanceId === HOME_INSTANCE) {
      return renderHomeWindow();
    }

    const ref = decodeRuntimeCardEditorInstanceId(instanceId);
    if (!ref) {
      return renderUnknownInstance(instanceId);
    }

    return <CodeEditorWindow cardId={ref.cardId} initialCode={getEditorInitialCode(ref)} />;
  },
};
