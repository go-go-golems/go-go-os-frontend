import { combineReducers } from '@reduxjs/toolkit';
import type { LaunchableAppModule } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import type { ReactNode } from 'react';
import {
  richWidgetsLauncherActions,
  richWidgetsLauncherReducer,
} from './richWidgetsLauncherState';
import {
  LOG_VIEWER_STATE_KEY,
  logViewerReducer,
} from '../log-viewer/logViewerState';

import { LogViewer } from '../log-viewer/LogViewer';
import { ChartView } from '../chart-view/ChartView';
import { MacWrite } from '../mac-write/MacWrite';
import { KanbanBoard } from '../kanban/KanbanBoard';
import { MacRepl } from '../repl/MacRepl';
import { NodeEditor } from '../node-editor/NodeEditor';
import { Oscilloscope } from '../oscilloscope/Oscilloscope';
import { LogicAnalyzer } from '../logic-analyzer/LogicAnalyzer';
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
import { MacCalc } from '../calculator/MacCalc';
import {
  MAC_CALC_STATE_KEY,
  macCalcReducer,
} from '../calculator/macCalcState';
import { DeepResearch } from '../deep-research/DeepResearch';
import { GameFinder } from '../game-finder/GameFinder';
import { RetroMusicPlayer } from '../music-player/RetroMusicPlayer';
import { StreamLauncher } from '../stream-launcher/StreamLauncher';
import { SteamLauncher } from '../steam-launcher/SteamLauncher';
import { YouTubeRetro } from '../youtube-retro/YouTubeRetro';
import { ChatBrowser } from '../chat-browser/ChatBrowser';
import { SystemModeler } from '../system-modeler/SystemModeler';
import { ControlRoom } from '../control-room/ControlRoom';

type LaunchReason = 'icon' | 'menu' | 'command' | 'startup';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildWindow(
  appId: string,
  title: string,
  icon: string,
  w: number,
  h: number,
  reason: LaunchReason,
): OpenWindowPayload {
  return {
    id: `window:${appId}:${Date.now()}`,
    title,
    icon,
    bounds: { x: 100 + Math.floor(Math.random() * 80), y: 60 + Math.floor(Math.random() * 40), w, h },
    content: { kind: 'app' as const, appKey: appId },
    dedupeKey: reason === 'startup' ? `${appId}:startup` : appId,
  };
}

function widget(
  id: string,
  name: string,
  icon: string,
  order: number,
  w: number,
  h: number,
  render: () => ReactNode,
): LaunchableAppModule {
  return {
    manifest: { id, name, icon, launch: { mode: 'window' }, desktop: { order } },
    buildLaunchWindow: (
      ctx: { dispatch: (action: unknown) => unknown },
      reason: LaunchReason,
    ) => {
      ctx.dispatch(richWidgetsLauncherActions.markLaunched({ appId: id, reason }));
      return buildWindow(id, name, icon, w, h, reason);
    },
    renderWindow: () => render(),
  };
}

// ---------------------------------------------------------------------------
// Widget launcher modules
// ---------------------------------------------------------------------------

export const logViewerModule: LaunchableAppModule = {
  ...widget(
    'log-viewer', 'Log Viewer', '\uD83D\uDCCB', 100, 900, 600,
    () => <LogViewer />,
  ),
  state: {
    stateKey: LOG_VIEWER_STATE_KEY,
    reducer: combineReducers({
      launcher: richWidgetsLauncherReducer,
      viewer: logViewerReducer,
    }),
  },
};

export const chartViewModule = widget(
  'chart-view', 'Chart View', '\uD83D\uDCC8', 101, 800, 560,
  () => <ChartView />,
);

export const macWriteModule = widget(
  'mac-write', 'MacWrite', '\u270D\uFE0F', 102, 800, 620,
  () => <MacWrite />,
);

export const kanbanBoardModule = widget(
  'kanban-board', 'Kanban Board', '\uD83D\uDCCB', 103, 960, 640,
  () => <KanbanBoard />,
);

export const macReplModule = widget(
  'mac-repl', 'MacRepl', '\uD83D\uDCBB', 104, 720, 480,
  () => <MacRepl />,
);

export const nodeEditorModule = widget(
  'node-editor', 'Node Editor', '\uD83D\uDD17', 105, 900, 600,
  () => <NodeEditor />,
);

export const oscilloscopeModule = widget(
  'oscilloscope', 'Oscilloscope', '\uD83D\uDCDF', 106, 800, 560,
  () => <Oscilloscope />,
);

export const logicAnalyzerModule = widget(
  'logic-analyzer', 'Logic Analyzer', '\uD83D\uDD0C', 107, 900, 560,
  () => <LogicAnalyzer />,
);

export const macCalendarModule: LaunchableAppModule = {
  ...widget(
    'mac-calendar', 'Calendar', '\uD83D\uDCC5', 108, 840, 600,
    () => <MacCalendar />,
  ),
  state: {
    stateKey: MAC_CALENDAR_STATE_KEY,
    reducer: macCalendarReducer,
  },
};

export const macSlidesModule: LaunchableAppModule = {
  ...widget(
    'mac-slides', 'MacSlides', '\uD83D\uDDBC\uFE0F', 120, 980, 680,
    () => <MacSlides fileName="Launcher Deck" />,
  ),
  state: {
    stateKey: MAC_SLIDES_STATE_KEY,
    reducer: macSlidesReducer,
  },
};

export const graphNavigatorModule = widget(
  'graph-navigator', 'Graph Navigator', '\uD83C\uDF10', 109, 900, 640,
  () => <GraphNavigator />,
);

export const macCalcModule: LaunchableAppModule = {
  ...widget(
    'mac-calc', 'MacCalc', '\uD83E\uDDEE', 110, 880, 600,
    () => <MacCalc />,
  ),
  state: {
    stateKey: MAC_CALC_STATE_KEY,
    reducer: macCalcReducer,
  },
};

export const deepResearchModule = widget(
  'deep-research', 'Deep Research', '\uD83D\uDD0D', 111, 860, 620,
  () => <DeepResearch />,
);

export const gameFinderModule = widget(
  'game-finder', 'Game Finder', '\uD83C\uDFAE', 112, 900, 640,
  () => <GameFinder />,
);

export const retroMusicPlayerModule = widget(
  'retro-music-player', 'Music Player', '\uD83C\uDFB5', 113, 880, 600,
  () => <RetroMusicPlayer />,
);

export const streamLauncherModule = widget(
  'stream-launcher', 'Streams', '\uD83D\uDCFA', 114, 900, 640,
  () => <StreamLauncher />,
);

export const steamLauncherModule = widget(
  'steam-launcher', 'Game Library', '\uD83D\uDD79\uFE0F', 115, 960, 680,
  () => <SteamLauncher />,
);

export const youtubeRetroModule = widget(
  'youtube-retro', 'RetroTube', '\uD83C\uDFAC', 116, 960, 680,
  () => <YouTubeRetro />,
);

export const chatBrowserModule = widget(
  'chat-browser', 'Chat Browser', '\uD83D\uDDC4\uFE0F', 117, 900, 600,
  () => <ChatBrowser />,
);

export const systemModelerModule = widget(
  'system-modeler', 'SystemModeler', '\uD83D\uDDA5\uFE0F', 118, 960, 640,
  () => <SystemModeler />,
);

export const controlRoomModule = widget(
  'control-room', 'Control Room', '\uD83C\uDFDB\uFE0F', 119, 960, 700,
  () => <ControlRoom />,
);

// ---------------------------------------------------------------------------
// All modules as a single array for convenience
// ---------------------------------------------------------------------------

export const RICH_WIDGET_MODULES: readonly LaunchableAppModule[] = [
  logViewerModule,
  chartViewModule,
  macWriteModule,
  kanbanBoardModule,
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
];
