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
} as const;

export type RichPartName = (typeof RICH_PARTS)[keyof typeof RICH_PARTS];
