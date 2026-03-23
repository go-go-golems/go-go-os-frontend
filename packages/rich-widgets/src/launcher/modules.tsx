import { combineReducers } from '@reduxjs/toolkit';
import {
  formatAppKey,
  type LaunchableAppModule,
  type LaunchableAppRenderParams,
} from '@hypercard/desktop-os';
import { openWindow, type OpenWindowPayload } from '@hypercard/engine/desktop-core';
import { DesktopIconLayer, type DesktopIconDef } from '@hypercard/engine/desktop-react';
import { useMemo, useState, type ReactNode } from 'react';
import { RICH_PARTS } from '../parts';
import {
  richWidgetsLauncherActions,
  richWidgetsLauncherReducer,
} from './richWidgetsLauncherState';

import { LogViewer } from '../log-viewer/LogViewer';
import {
  LOG_VIEWER_STATE_KEY,
  logViewerReducer,
} from '../log-viewer/logViewerState';
import { ChartView } from '../chart-view/ChartView';
import {
  CHART_VIEW_STATE_KEY,
  chartViewReducer,
} from '../chart-view/chartViewState';
import { MacWrite } from '../mac-write/MacWrite';
import {
  MAC_WRITE_STATE_KEY,
  macWriteReducer,
} from '../mac-write/macWriteState';
import { MacRepl } from '@hypercard/repl';
import {
  MAC_REPL_STATE_KEY,
  macReplReducer,
} from '@hypercard/repl';
import { NodeEditor } from '../node-editor/NodeEditor';
import {
  NODE_EDITOR_STATE_KEY,
  nodeEditorReducer,
} from '../node-editor/nodeEditorState';
import { Oscilloscope } from '../oscilloscope/Oscilloscope';
import {
  OSCILLOSCOPE_STATE_KEY,
  oscilloscopeReducer,
} from '../oscilloscope/oscilloscopeState';
import { LogicAnalyzer } from '../logic-analyzer/LogicAnalyzer';
import {
  LOGIC_ANALYZER_STATE_KEY,
  logicAnalyzerReducer,
} from '../logic-analyzer/logicAnalyzerState';
import { MacCalendar } from '../calendar/MacCalendar';
import {
  MAC_CALENDAR_STATE_KEY,
  macCalendarReducer,
} from '../calendar/macCalendarState';
import { MacSlides } from '../mac-slides/MacSlides';
import {
  MAC_SLIDES_STATE_KEY,
  macSlidesReducer,
} from '../mac-slides/macSlidesState';
import { GraphNavigator } from '../graph-navigator/GraphNavigator';
import {
  GRAPH_NAVIGATOR_STATE_KEY,
  graphNavigatorReducer,
} from '../graph-navigator/graphNavigatorState';
import { MacCalc } from '../calculator/MacCalc';
import {
  MAC_CALC_STATE_KEY,
  macCalcReducer,
} from '../calculator/macCalcState';
import { DeepResearch } from '../deep-research/DeepResearch';
import {
  DEEP_RESEARCH_STATE_KEY,
  deepResearchReducer,
} from '../deep-research/deepResearchState';
import { GameFinder } from '../game-finder/GameFinder';
import {
  GAME_FINDER_STATE_KEY,
  gameFinderReducer,
} from '../game-finder/gameFinderState';
import { RetroMusicPlayer } from '../music-player/RetroMusicPlayer';
import {
  MUSIC_PLAYER_STATE_KEY,
  musicPlayerReducer,
} from '../music-player/musicPlayerState';
import { StreamLauncher } from '../stream-launcher/StreamLauncher';
import {
  STREAM_LAUNCHER_STATE_KEY,
  streamLauncherReducer,
} from '../stream-launcher/streamLauncherState';
import { SteamLauncher } from '../steam-launcher/SteamLauncher';
import {
  STEAM_LAUNCHER_STATE_KEY,
  steamLauncherReducer,
} from '../steam-launcher/steamLauncherState';
import { YouTubeRetro } from '../youtube-retro/YouTubeRetro';
import {
  YOUTUBE_RETRO_STATE_KEY,
  youTubeRetroReducer,
} from '../youtube-retro/youTubeRetroState';
import { ChatBrowser } from '../chat-browser/ChatBrowser';
import {
  CHAT_BROWSER_STATE_KEY,
  chatBrowserReducer,
} from '../chat-browser/chatBrowserState';
import { SystemModeler } from '../system-modeler/SystemModeler';
import {
  SYSTEM_MODELER_STATE_KEY,
  systemModelerReducer,
} from '../system-modeler/systemModelerState';
import { ControlRoom } from '../control-room/ControlRoom';
import {
  CONTROL_ROOM_STATE_KEY,
  controlRoomReducer,
} from '../control-room/controlRoomState';
import { MermaidEditor } from '../mermaid-editor/MermaidEditor';
import {
  MERMAID_EDITOR_STATE_KEY,
  mermaidEditorReducer,
} from '../mermaid-editor/mermaidEditorState';
import { MacBrowser } from '../mac-browser/MacBrowser';
import {
  MAC_BROWSER_STATE_KEY,
  macBrowserReducer,
} from '../mac-browser/macBrowserState';

type LaunchReason = 'icon' | 'menu' | 'command' | 'startup';
type RichWidgetsInstanceId = 'folder' | `widget~${string}`;
interface RichWidgetDef {
  id: string;
  name: string;
  icon: string;
  order: number;
  w: number;
  h: number;
  render: () => ReactNode;
}

export const RICH_WIDGETS: readonly RichWidgetDef[] = [
  { id: 'log-viewer', name: 'Log Viewer', icon: '\uD83D\uDCCB', order: 100, w: 900, h: 600, render: () => <LogViewer /> },
  { id: 'chart-view', name: 'Chart View', icon: '\uD83D\uDCC8', order: 101, w: 800, h: 560, render: () => <ChartView /> },
  { id: 'mac-write', name: 'MacWrite', icon: '\u270D\uFE0F', order: 102, w: 800, h: 620, render: () => <MacWrite /> },
  { id: 'mac-repl', name: 'MacRepl', icon: '\uD83D\uDCBB', order: 104, w: 720, h: 480, render: () => <MacRepl /> },
  { id: 'node-editor', name: 'Node Editor', icon: '\uD83D\uDD17', order: 105, w: 900, h: 600, render: () => <NodeEditor /> },
  { id: 'oscilloscope', name: 'Oscilloscope', icon: '\uD83D\uDCDF', order: 106, w: 800, h: 560, render: () => <Oscilloscope /> },
  { id: 'logic-analyzer', name: 'Logic Analyzer', icon: '\uD83D\uDD0C', order: 107, w: 900, h: 560, render: () => <LogicAnalyzer /> },
  { id: 'mac-calendar', name: 'Calendar', icon: '\uD83D\uDCC5', order: 108, w: 840, h: 600, render: () => <MacCalendar /> },
  { id: 'graph-navigator', name: 'Graph Navigator', icon: '\uD83C\uDF10', order: 109, w: 900, h: 640, render: () => <GraphNavigator /> },
  { id: 'mac-calc', name: 'MacCalc', icon: '\uD83E\uDDEE', order: 110, w: 880, h: 600, render: () => <MacCalc /> },
  { id: 'deep-research', name: 'Deep Research', icon: '\uD83D\uDD0D', order: 111, w: 860, h: 620, render: () => <DeepResearch /> },
  { id: 'game-finder', name: 'Game Finder', icon: '\uD83C\uDFAE', order: 112, w: 900, h: 640, render: () => <GameFinder /> },
  { id: 'retro-music-player', name: 'Music Player', icon: '\uD83C\uDFB5', order: 113, w: 880, h: 600, render: () => <RetroMusicPlayer /> },
  { id: 'stream-launcher', name: 'Streams', icon: '\uD83D\uDCFA', order: 114, w: 900, h: 640, render: () => <StreamLauncher /> },
  { id: 'steam-launcher', name: 'Game Library', icon: '\uD83D\uDD79\uFE0F', order: 115, w: 960, h: 680, render: () => <SteamLauncher /> },
  { id: 'youtube-retro', name: 'RetroTube', icon: '\uD83C\uDFAC', order: 116, w: 960, h: 680, render: () => <YouTubeRetro /> },
  { id: 'chat-browser', name: 'Chat Browser', icon: '\uD83D\uDDC4\uFE0F', order: 117, w: 900, h: 600, render: () => <ChatBrowser /> },
  { id: 'system-modeler', name: 'SystemModeler', icon: '\uD83D\uDDA5\uFE0F', order: 118, w: 960, h: 640, render: () => <SystemModeler /> },
  { id: 'control-room', name: 'Control Room', icon: '\uD83C\uDFDB\uFE0F', order: 119, w: 960, h: 700, render: () => <ControlRoom /> },
  { id: 'mac-slides', name: 'MacSlides', icon: '\uD83D\uDDBC\uFE0F', order: 120, w: 980, h: 680, render: () => <MacSlides fileName="Launcher Deck" /> },
  { id: 'mermaid-editor', name: 'MermaidEditor', icon: '\uD83E\uDDED', order: 121, w: 980, h: 680, render: () => <MermaidEditor /> },
  { id: 'mac-browser', name: 'MacBrowser', icon: '\uD83C\uDF10', order: 122, w: 920, h: 680, render: () => <MacBrowser /> },
];

const RICH_WIDGETS_BY_ID = new Map(RICH_WIDGETS.map((widget) => [widget.id, widget]));

function buildWidgetWindow(widget: RichWidgetDef, reason: LaunchReason): OpenWindowPayload {
  return {
    id: `window:rich-widgets:${widget.id}`,
    title: widget.name,
    icon: widget.icon,
    bounds: {
      x: 100 + Math.floor(Math.random() * 80),
      y: 60 + Math.floor(Math.random() * 40),
      w: widget.w,
      h: widget.h,
    },
    content: {
      kind: 'app',
      appKey: formatAppKey('rich-widgets', `widget~${widget.id}`),
    },
    dedupeKey: reason === 'startup' ? `rich-widgets:${widget.id}:startup` : `rich-widgets:${widget.id}`,
  };
}

function buildFolderWindow(reason: LaunchReason): OpenWindowPayload {
  return {
    id: 'window:rich-widgets:folder',
    title: 'Rich Widgets',
    icon: '\uD83D\uDDC2\uFE0F',
    bounds: { x: 150, y: 48, w: 980, h: 640 },
    content: {
      kind: 'app',
      appKey: formatAppKey('rich-widgets', 'folder'),
    },
    dedupeKey: reason === 'startup' ? 'rich-widgets:folder:startup' : 'rich-widgets:folder',
  };
}

function widget(widgetDef: RichWidgetDef): LaunchableAppModule {
  const { id, name, icon, order, render } = widgetDef;
  return {
    manifest: { id, name, icon, launch: { mode: 'window' }, desktop: { order } },
    buildLaunchWindow: (
      ctx: { dispatch: (action: unknown) => unknown },
      reason: LaunchReason,
    ) => {
      ctx.dispatch(richWidgetsLauncherActions.markLaunched({ appId: id, reason }));
      return buildWidgetWindow(widgetDef, reason);
    },
    renderWindow: () => render(),
  };
}

function RichWidgetsFolderWindow({
  dispatchWindowAction,
}: {
  dispatchWindowAction: (action: unknown) => unknown;
}) {
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const icons = useMemo<DesktopIconDef[]>(
    () =>
      RICH_WIDGETS.map((widgetDef) => ({
        id: widgetDef.id,
        label: widgetDef.name,
        icon: widgetDef.icon,
        kind: 'app',
        appId: 'rich-widgets',
      })),
    [],
  );

  return (
    <section data-part={RICH_PARTS.rwLauncher}>
      <header data-part={RICH_PARTS.rwLauncherHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong>Rich Widgets</strong>
        </div>
        <span data-part={RICH_PARTS.rwLauncherHint}>
          Double-click an icon to open the widget in its own launcher window.
        </span>
      </header>
      <DesktopIconLayer
        icons={icons}
        selectedIconId={selectedIconId}
        onSelectIcon={setSelectedIconId}
        onOpenIcon={(iconId: string) => {
          const widgetDef = RICH_WIDGETS_BY_ID.get(iconId);
          if (!widgetDef) {
            return;
          }
          setSelectedIconId(iconId);
          dispatchWindowAction(openWindow(buildWidgetWindow(widgetDef, 'icon')));
        }}
      />
    </section>
  );
}

function renderRichWidgetsWindow(
  instanceId: RichWidgetsInstanceId,
  dispatchWindowAction: (action: unknown) => unknown,
): ReactNode {
  if (instanceId === 'folder') {
    return <RichWidgetsFolderWindow dispatchWindowAction={dispatchWindowAction} />;
  }

  const widgetId = instanceId.replace(/^widget~/, '').trim();
  const widgetDef = RICH_WIDGETS_BY_ID.get(widgetId);
  if (!widgetDef) {
    return (
      <section style={{ padding: 12, display: 'grid', gap: 8 }}>
        <strong>Unknown rich widget window</strong>
        <span>Unable to resolve widget instance: {instanceId}</span>
      </section>
    );
  }

  return <>{widgetDef.render()}</>;
}

export const richWidgetsLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'rich-widgets',
    name: 'Rich Widgets',
    icon: '\uD83D\uDDC2\uFE0F',
    launch: { mode: 'window' },
    desktop: {
      order: 999,
    },
  },
  buildLaunchWindow: (
    _ctx: { dispatch: (action: unknown) => unknown },
    reason: LaunchReason,
  ) => buildFolderWindow(reason),
  renderWindow: ({ instanceId, ctx }: LaunchableAppRenderParams) =>
    renderRichWidgetsWindow(instanceId as RichWidgetsInstanceId, ctx.dispatch),
};

function widgetModule(widgetDef: RichWidgetDef): LaunchableAppModule {
  return widget(widgetDef);
}

export const logViewerModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('log-viewer')!),
  state: {
    stateKey: LOG_VIEWER_STATE_KEY,
    reducer: combineReducers({
      launcher: richWidgetsLauncherReducer,
      viewer: logViewerReducer,
    }),
  },
};

export const chartViewModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('chart-view')!),
  state: {
    stateKey: CHART_VIEW_STATE_KEY,
    reducer: chartViewReducer,
  },
};

export const macWriteModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('mac-write')!),
  state: {
    stateKey: MAC_WRITE_STATE_KEY,
    reducer: macWriteReducer,
  },
};

export const macReplModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('mac-repl')!),
  state: {
    stateKey: MAC_REPL_STATE_KEY,
    reducer: macReplReducer,
  },
};

export const nodeEditorModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('node-editor')!),
  state: {
    stateKey: NODE_EDITOR_STATE_KEY,
    reducer: nodeEditorReducer,
  },
};

export const oscilloscopeModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('oscilloscope')!),
  state: {
    stateKey: OSCILLOSCOPE_STATE_KEY,
    reducer: oscilloscopeReducer,
  },
};

export const logicAnalyzerModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('logic-analyzer')!),
  state: {
    stateKey: LOGIC_ANALYZER_STATE_KEY,
    reducer: logicAnalyzerReducer,
  },
};

export const macCalendarModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('mac-calendar')!),
  state: {
    stateKey: MAC_CALENDAR_STATE_KEY,
    reducer: macCalendarReducer,
  },
};

export const macSlidesModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('mac-slides')!),
  state: {
    stateKey: MAC_SLIDES_STATE_KEY,
    reducer: macSlidesReducer,
  },
};

export const graphNavigatorModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('graph-navigator')!),
  state: {
    stateKey: GRAPH_NAVIGATOR_STATE_KEY,
    reducer: graphNavigatorReducer,
  },
};

export const macCalcModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('mac-calc')!),
  state: {
    stateKey: MAC_CALC_STATE_KEY,
    reducer: macCalcReducer,
  },
};

export const deepResearchModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('deep-research')!),
  state: {
    stateKey: DEEP_RESEARCH_STATE_KEY,
    reducer: deepResearchReducer,
  },
};

export const gameFinderModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('game-finder')!),
  state: {
    stateKey: GAME_FINDER_STATE_KEY,
    reducer: gameFinderReducer,
  },
};

export const retroMusicPlayerModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('retro-music-player')!),
  state: {
    stateKey: MUSIC_PLAYER_STATE_KEY,
    reducer: musicPlayerReducer,
  },
};

export const streamLauncherModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('stream-launcher')!),
  state: {
    stateKey: STREAM_LAUNCHER_STATE_KEY,
    reducer: streamLauncherReducer,
  },
};

export const steamLauncherModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('steam-launcher')!),
  state: {
    stateKey: STEAM_LAUNCHER_STATE_KEY,
    reducer: steamLauncherReducer,
  },
};

export const youtubeRetroModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('youtube-retro')!),
  state: {
    stateKey: YOUTUBE_RETRO_STATE_KEY,
    reducer: youTubeRetroReducer,
  },
};

export const chatBrowserModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('chat-browser')!),
  state: {
    stateKey: CHAT_BROWSER_STATE_KEY,
    reducer: chatBrowserReducer,
  },
};

export const systemModelerModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('system-modeler')!),
  state: {
    stateKey: SYSTEM_MODELER_STATE_KEY,
    reducer: systemModelerReducer,
  },
};

export const controlRoomModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('control-room')!),
  state: {
    stateKey: CONTROL_ROOM_STATE_KEY,
    reducer: controlRoomReducer,
  },
};

export const mermaidEditorModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('mermaid-editor')!),
  state: {
    stateKey: MERMAID_EDITOR_STATE_KEY,
    reducer: mermaidEditorReducer,
  },
};

export const macBrowserModule: LaunchableAppModule = {
  ...widgetModule(RICH_WIDGETS_BY_ID.get('mac-browser')!),
  state: {
    stateKey: MAC_BROWSER_STATE_KEY,
    reducer: macBrowserReducer,
  },
};

export const RICH_WIDGET_MODULES: readonly LaunchableAppModule[] = [
  richWidgetsLauncherModule,
  logViewerModule,
  chartViewModule,
  macWriteModule,
  macReplModule,
  nodeEditorModule,
  oscilloscopeModule,
  logicAnalyzerModule,
  macCalendarModule,
  macSlidesModule,
  graphNavigatorModule,
  macCalcModule,
  deepResearchModule,
  gameFinderModule,
  retroMusicPlayerModule,
  streamLauncherModule,
  steamLauncherModule,
  youtubeRetroModule,
  chatBrowserModule,
  systemModelerModule,
  controlRoomModule,
  mermaidEditorModule,
  macBrowserModule,
];
