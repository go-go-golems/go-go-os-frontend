// RICH_PARTS constant - rich widget part names
// Extracted from os-widgets/src/parts.ts
// Will be populated in Phase 4

export const RICH_PARTS = {
  // Shared Primitives
  widgetToolbar: 'widget-toolbar',
  widgetStatusBar: 'widget-status-bar',
  modalOverlay: 'modal-overlay',
  sparkline: 'sparkline',
} as const;

export type RichPartName = (typeof RICH_PARTS)[keyof typeof RICH_PARTS];
