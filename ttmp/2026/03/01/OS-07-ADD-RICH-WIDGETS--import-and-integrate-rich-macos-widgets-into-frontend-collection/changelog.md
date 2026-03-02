# Changelog

## 2026-03-02

- Completed ChatBrowser widget port: conversation list with quick filter, message viewer, advanced search (text/model/tags/date), 33 CSS rules, 3 stories — new widget from imports/mac-chat-browser.jsx
- Fixed DesktopShell icon double-click: added DesktopCommandHandler contributions so all widgets open on icon double-click
- Fixed ChartView crashing in desktop demo: added default sample data when no `data` prop provided
- Added DesktopShell integration stories (task 24): 4 stories showing all widgets as desktop icons with startup window support, verified SteamLauncher renders fully inside DesktopShell window
- Added LaunchableAppModule definitions for all 17 widgets (task 23): launcher/modules.tsx with RICH_WIDGET_MODULES array, ./launcher export path, @hypercard/desktop-os peer dep
- **ALL 17 WIDGET IMPORTS PORTED** — complete set of rich macOS-style widgets now in packages/rich-widgets
- Completed YouTubeRetro widget port (task 22): CRT video player with scanlines/vignette, home grid, watch view with comments/related videos, subscriptions sidebar, 3 stories
- Completed SteamLauncher widget port (task 22): tabbed Library/Store/Community/Downloads, game detail, friends list, launch animation, 3 stories
- Completed StreamLauncher widget port (task 22): category sidebar, stream list with canvas thumbnails, player view with chat, LIVE/VOD/OFFLINE badges, 3 stories
- Completed RetroMusicPlayer widget port (task 21): now-playing bar, EQ visualizer, marquee ticker, transport controls, playlist sidebar, track list/grid, queue panel, search, 3 stories
- Completed GameFinder widget port (task 20): sidebar nav, game list with canvas pixel art, detail view with achievements, install/launch simulation, search/filter/sort, 3 stories
- Completed DeepResearch widget port (task 19): query sidebar, depth selector, research simulation, source cards, thinking steps, progress bar, report generation, 3 stories
- Completed MacCalc spreadsheet widget port (task 18): formula engine, grid, formatting, find/replace, palette, 3 stories
- Completed GraphNavigator widget port (task 16): force-directed graph, node browser, query console, inspector, 4 stories
- Completed MacCalendar widget port (task 15): month/week views, event modal, command palette, keyboard shortcuts, 5 stories
- Completed LogicAnalyzer widget port (task 11): added parts, CSS with Mac inset shadows + CRT reflection, fixed Checkbox onChange types, registered in index.ts and theme
- Started implementation diary

## 2026-03-01

- Initial workspace created

