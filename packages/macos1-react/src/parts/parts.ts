// PARTS constant - source of truth for data-part attributes
// Extracted from os-core/src/parts.ts
// Will be populated in Phase 3

export const PARTS = {
  // Widget root
  root: 'hypercard',
} as const;

export type PartName = (typeof PARTS)[keyof typeof PARTS];
