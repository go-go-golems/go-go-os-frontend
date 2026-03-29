import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { type ReactNode, useMemo } from 'react';
import { windowingReducer, openWindow, type OpenWindowPayload } from '@go-go-golems/os-core/desktop-core';
import { notificationsReducer, type RuntimeBundleDefinition } from '@go-go-golems/os-core';
import { DesktopShell, type DesktopIconDef, type DesktopContribution, type DesktopCommandHandler } from '@go-go-golems/os-core/desktop-react';

import { LogViewer } from '../log-viewer/LogViewer';
import { ChartView } from '../chart-view/ChartView';
import { MacWrite } from '../mac-write/MacWrite';
import { MacRepl } from '@go-go-golems/os-repl';
import { NodeEditor } from '../node-editor/NodeEditor';
import { Oscilloscope } from '../oscilloscope/Oscilloscope';
import { LogicAnalyzer } from '../logic-analyzer/LogicAnalyzer';
import { MacCalendar } from '../calendar/MacCalendar';
import { GraphNavigator } from '../graph-navigator/GraphNavigator';
import { MacCalc } from '../calculator/MacCalc';
import { DeepResearch } from '../deep-research/DeepResearch';
import { GameFinder } from '../game-finder/GameFinder';
import { RetroMusicPlayer } from '../music-player/RetroMusicPlayer';
import { StreamLauncher } from '../stream-launcher/StreamLauncher';
import { SteamLauncher } from '../steam-launcher/SteamLauncher';
import { YouTubeRetro } from '../youtube-retro/YouTubeRetro';
import { ChatBrowser } from '../chat-browser/ChatBrowser';
import { SystemModeler } from '../system-modeler/SystemModeler';
import { ControlRoom } from '../control-room/ControlRoom';
import {
  SeededStoreProvider,
  composeSeedStores,
  type SeedStore,
} from '../storybook/seededStore';

// ---------------------------------------------------------------------------
// Widget registry for the story
// ---------------------------------------------------------------------------

interface WidgetDef {
  id: string;
  name: string;
  icon: string;
  w: number;
  h: number;
  render: () => ReactNode;
}

const WIDGETS: WidgetDef[] = [
  { id: 'log-viewer', name: 'Log Viewer', icon: '\uD83D\uDCCB', w: 900, h: 600, render: () => <LogViewer /> },
  { id: 'chart-view', name: 'Chart View', icon: '\uD83D\uDCC8', w: 800, h: 560, render: () => <ChartView /> },
  { id: 'mac-write', name: 'MacWrite', icon: '\u270D\uFE0F', w: 800, h: 620, render: () => <MacWrite /> },
  { id: 'mac-repl', name: 'MacRepl', icon: '\uD83D\uDCBB', w: 720, h: 480, render: () => <MacRepl /> },
  { id: 'node-editor', name: 'Node Editor', icon: '\uD83D\uDD17', w: 900, h: 600, render: () => <NodeEditor /> },
  { id: 'oscilloscope', name: 'Oscilloscope', icon: '\uD83D\uDCDF', w: 800, h: 560, render: () => <Oscilloscope /> },
  { id: 'logic-analyzer', name: 'Logic Analyzer', icon: '\uD83D\uDD0C', w: 900, h: 560, render: () => <LogicAnalyzer /> },
  { id: 'mac-calendar', name: 'Calendar', icon: '\uD83D\uDCC5', w: 840, h: 600, render: () => <MacCalendar /> },
  { id: 'graph-navigator', name: 'Graph Navigator', icon: '\uD83C\uDF10', w: 900, h: 640, render: () => <GraphNavigator /> },
  { id: 'mac-calc', name: 'MacCalc', icon: '\uD83E\uDDEE', w: 880, h: 600, render: () => <MacCalc /> },
  { id: 'deep-research', name: 'Deep Research', icon: '\uD83D\uDD0D', w: 860, h: 620, render: () => <DeepResearch /> },
  { id: 'game-finder', name: 'Game Finder', icon: '\uD83C\uDFAE', w: 900, h: 640, render: () => <GameFinder /> },
  { id: 'retro-music-player', name: 'Music Player', icon: '\uD83C\uDFB5', w: 880, h: 600, render: () => <RetroMusicPlayer /> },
  { id: 'stream-launcher', name: 'Streams', icon: '\uD83D\uDCFA', w: 900, h: 640, render: () => <StreamLauncher /> },
  { id: 'steam-launcher', name: 'Game Library', icon: '\uD83D\uDD79\uFE0F', w: 960, h: 680, render: () => <SteamLauncher /> },
  { id: 'youtube-retro', name: 'RetroTube', icon: '\uD83C\uDFAC', w: 960, h: 680, render: () => <YouTubeRetro /> },
  { id: 'chat-browser', name: 'Chat Browser', icon: '\uD83D\uDDC4\uFE0F', w: 900, h: 600, render: () => <ChatBrowser /> },
  { id: 'system-modeler', name: 'SystemModeler', icon: '\uD83D\uDDA5\uFE0F', w: 960, h: 640, render: () => <SystemModeler /> },
  { id: 'control-room', name: 'Control Room', icon: '\uD83C\uDFDB\uFE0F', w: 960, h: 700, render: () => <ControlRoom /> },
];

const WIDGET_MAP = new Map(WIDGETS.map((w) => [w.id, w]));

// ---------------------------------------------------------------------------
// Desktop icons (all widgets as app icons + a folder)
// ---------------------------------------------------------------------------

const DESKTOP_ICONS: DesktopIconDef[] = [
  ...WIDGETS.map((w): DesktopIconDef => ({
    id: w.id,
    label: w.name,
    icon: w.icon,
    kind: 'app',
  })),
  {
    id: 'folder.rich-widgets',
    label: 'Rich Widgets',
    icon: '\uD83D\uDDC2\uFE0F',
    kind: 'folder',
    folder: { memberIconIds: WIDGETS.map((w) => w.id) },
  },
];

// ---------------------------------------------------------------------------
// Contributions: command handlers + startup windows
// ---------------------------------------------------------------------------

let windowCounter = 0;

function buildWindowPayload(wDef: WidgetDef, dedupeKey?: string): OpenWindowPayload {
  windowCounter++;
  return {
    id: `window:${wDef.id}:${windowCounter}`,
    title: wDef.name,
    icon: wDef.icon,
    bounds: {
      x: 100 + Math.floor(Math.random() * 80),
      y: 60 + Math.floor(Math.random() * 40),
      w: wDef.w,
      h: wDef.h,
    },
    content: { kind: 'app', appKey: wDef.id },
    dedupeKey,
  };
}

/** Command handlers that open a window when an icon is double-clicked. */
const ICON_OPEN_COMMANDS: DesktopCommandHandler[] = WIDGETS.map((wDef): DesktopCommandHandler => ({
  id: `rich-widgets.open.${wDef.id}`,
  priority: 200,
  matches: (commandId: string) => commandId === `icon.open.${wDef.id}`,
  run: (_commandId, ctx) => {
    ctx.dispatch(openWindow(buildWindowPayload(wDef, wDef.id)));
    return 'handled';
  },
}));

// ---------------------------------------------------------------------------
// Minimal bundle (the shell requires one, even if we don't use cards)
// ---------------------------------------------------------------------------

const SHELL_BUNDLE: RuntimeBundleDefinition = {
  id: 'rich-widgets-desktop',
  name: 'Rich Widgets Desktop',
  icon: '\uD83D\uDDA5\uFE0F',
  homeSurface: 'empty',
  surfaces: {
    empty: {
      id: 'empty',
      type: 'report',
      title: 'Rich Widgets',
      icon: '\uD83D\uDDA5\uFE0F',
      ui: { t: 'text', value: 'Double-click an icon on the desktop or open the Rich Widgets folder.' },
    },
  },
};

// ---------------------------------------------------------------------------
// Story frame
// ---------------------------------------------------------------------------

function createStore() {
  return configureStore({
    reducer: {
      windowing: windowingReducer,
      notifications: notificationsReducer,
    },
  });
}

type RichWidgetsDesktopStore = ReturnType<typeof createStore>;
type DesktopSeedStore = SeedStore<RichWidgetsDesktopStore>;

function renderAppWindow(appKey: string): ReactNode {
  const w = WIDGET_MAP.get(appKey);
  if (!w) return null;
  return <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>{w.render()}</div>;
}

function seedWindows(widgetIds: readonly string[]): DesktopSeedStore {
  return (store) => {
    for (const widgetId of widgetIds) {
      const widget = WIDGET_MAP.get(widgetId);
      if (!widget) {
        continue;
      }
      store.dispatch(
        openWindow(buildWindowPayload(widget, `${widget.id}:seeded`)),
      );
    }
  };
}

const SEED_LOG_AND_MUSIC = seedWindows([
  'log-viewer',
  'retro-music-player',
]);
const SEED_INSTRUMENTS = seedWindows([
  'oscilloscope',
  'logic-analyzer',
  'system-modeler',
]);
const SEED_ANALYSIS_SUITE = composeSeedStores<RichWidgetsDesktopStore>(
  seedWindows(['log-viewer', 'chart-view']),
  seedWindows(['graph-navigator', 'deep-research']),
);

function RichWidgetsDesktopFrame({
  startupWidget,
  seedStore,
}: {
  startupWidget?: string;
  seedStore?: DesktopSeedStore;
}) {
  const contributions = useMemo<DesktopContribution[]>(() => {
    const result: DesktopContribution[] = [
      { id: 'rich-widgets-launchers', commands: ICON_OPEN_COMMANDS },
    ];
    if (startupWidget) {
      const wDef = WIDGET_MAP.get(startupWidget);
      if (wDef) {
        result.push({
          id: 'rich-widgets-startup',
          startupWindows: [{ id: `startup:${wDef.id}`, create: () => buildWindowPayload(wDef, `${wDef.id}:startup`) }],
        });
      }
    }
    return result;
  }, [startupWidget]);

  return (
    <SeededStoreProvider createStore={createStore} seedStore={seedStore}>
      <div style={{ width: 1200, height: 800 }}>
        <DesktopShell
          bundle={SHELL_BUNDLE}
          icons={DESKTOP_ICONS}
          renderAppWindow={renderAppWindow}
          contributions={contributions}
        />
      </div>
    </SeededStoreProvider>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'RichWidgets/Desktop Integration',
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj;

export const AllWidgets: Story = {
  render: () => <RichWidgetsDesktopFrame />,
};

export const StartWithLogViewer: Story = {
  render: () => <RichWidgetsDesktopFrame startupWidget="log-viewer" />,
};

export const StartWithMusicPlayer: Story = {
  render: () => <RichWidgetsDesktopFrame startupWidget="retro-music-player" />,
};

export const StartWithSteamLauncher: Story = {
  render: () => <RichWidgetsDesktopFrame startupWidget="steam-launcher" />,
};

export const SeedLogAndMusicWindows: Story = {
  render: () => <RichWidgetsDesktopFrame seedStore={SEED_LOG_AND_MUSIC} />,
};

export const SeedInstrumentCluster: Story = {
  render: () => <RichWidgetsDesktopFrame seedStore={SEED_INSTRUMENTS} />,
};

export const SeedAnalysisSuite: Story = {
  render: () => <RichWidgetsDesktopFrame seedStore={SEED_ANALYSIS_SUITE} />,
};
