/**
 * Data-part constants for rich widgets.
 * These follow the same convention as the engine's PARTS:
 * camelCase keys → kebab-case values in the DOM.
 */
export const RICH_PARTS = {
  // Sparkline
  sparkline: 'sparkline',

  // LogViewer
  logViewer: 'log-viewer',
  logViewerToolbar: 'log-viewer-toolbar',
  logViewerSearch: 'log-viewer-search',
  logViewerActivity: 'log-viewer-activity',
  logViewerTable: 'log-viewer-table',
  logViewerHeader: 'log-viewer-header',
  logViewerRow: 'log-viewer-row',
  logViewerCell: 'log-viewer-cell',
  logViewerLevelBadge: 'log-viewer-level-badge',
  logViewerDetail: 'log-viewer-detail',
  logViewerDetailHeader: 'log-viewer-detail-header',
  logViewerDetailField: 'log-viewer-detail-field',
  logViewerDetailStack: 'log-viewer-detail-stack',
  logViewerSidebar: 'log-viewer-sidebar',
  logViewerFilterGroup: 'log-viewer-filter-group',
  logViewerFilterItem: 'log-viewer-filter-item',
  logViewerControls: 'log-viewer-controls',
  logViewerStatusBar: 'log-viewer-status-bar',

  // ChartView
  chartView: 'chart-view',
  chartViewCanvas: 'chart-view-canvas',
  chartViewControls: 'chart-view-controls',
  chartViewControlGroup: 'chart-view-control-group',
  chartViewLegend: 'chart-view-legend',
  chartViewInfo: 'chart-view-info',

  // MacWrite
  macWrite: 'mac-write',
  macWriteToolbar: 'mac-write-toolbar',
  macWriteSeparator: 'mac-write-separator',
  macWriteFindBar: 'mac-write-find-bar',
  macWriteBody: 'mac-write-body',
  macWriteEditor: 'mac-write-editor',
  macWriteDivider: 'mac-write-divider',
  macWritePreview: 'mac-write-preview',
  macWriteStatusBar: 'mac-write-status-bar',
} as const;

export type RichPartName = (typeof RICH_PARTS)[keyof typeof RICH_PARTS];
