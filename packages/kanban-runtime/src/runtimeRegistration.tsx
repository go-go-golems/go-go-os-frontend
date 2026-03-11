import kanbanPackagePrelude from './runtime-packages/kanban.package.vm.js?raw';
import { KANBAN_RUNTIME_DOCS_METADATA } from './docsMetadata';
import {
  type RuntimePackageDefinition,
  type RuntimeSurfaceTypeDefinition,
} from '@hypercard/hypercard-runtime';
import { KanbanV1Renderer, type KanbanV1Node, validateKanbanV1Node } from './runtime-packs/kanbanV1Pack';

export const KANBAN_RUNTIME_PACKAGE: RuntimePackageDefinition = {
  packageId: 'kanban',
  version: '1.0.0',
  summary: 'Kanban widget DSL package providing widgets.kanban.* constructors.',
  docsMetadata: KANBAN_RUNTIME_DOCS_METADATA,
  installPrelude: kanbanPackagePrelude,
  surfaceTypes: ['kanban.v1'],
  dependencies: ['ui'],
};

export const KANBAN_V1_RUNTIME_SURFACE_TYPE: RuntimeSurfaceTypeDefinition<KanbanV1Node> = {
  packId: 'kanban.v1',
  validateTree: validateKanbanV1Node,
  render: ({ tree, onEvent }) => <KanbanV1Renderer tree={tree} onEvent={onEvent} />,
};
