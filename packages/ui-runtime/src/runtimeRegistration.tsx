import type { RuntimePackageDefinition } from '@hypercard/hypercard-runtime';
import uiPackagePrelude from './runtime-packages/ui.package.vm.js?raw';
import { UI_RUNTIME_DOCS_METADATA } from './docsMetadata';
import { UI_CARD_V1_RUNTIME_SURFACE_TYPE } from './runtime-packs/uiCardV1Pack';

export const UI_RUNTIME_PACKAGE: RuntimePackageDefinition = {
  packageId: 'ui',
  version: '1.0.0',
  summary: 'Base UI DSL package providing ui.* node constructors.',
  docsMetadata: UI_RUNTIME_DOCS_METADATA,
  installPrelude: uiPackagePrelude,
  surfaceTypes: ['ui.card.v1'],
};

export { UI_CARD_V1_RUNTIME_SURFACE_TYPE };
