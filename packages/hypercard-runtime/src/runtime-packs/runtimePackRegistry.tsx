import type { ReactNode } from 'react';
import { validateUINode } from '../plugin-runtime/uiSchema';
import { PluginCardRenderer } from '../runtime-host/PluginCardRenderer';
import { KanbanV1Renderer, validateKanbanV1Node, type KanbanV1Node } from './kanbanV1Pack';
import type { UINode } from '../plugin-runtime/uiTypes';

export const DEFAULT_RUNTIME_PACK_ID = 'ui.card.v1' as const;
export const KANBAN_V1_PACK_ID = 'kanban.v1' as const;

export type RuntimePackId = typeof DEFAULT_RUNTIME_PACK_ID | typeof KANBAN_V1_PACK_ID | string;
export type RuntimePackTree = UINode | KanbanV1Node;

export interface RuntimePackRendererProps<TTree> {
  tree: TTree;
  onEvent: (handler: string, args?: unknown) => void;
}

export interface RuntimePackDefinition<TTree> {
  packId: RuntimePackId;
  validateTree: (value: unknown) => TTree;
  render: (props: RuntimePackRendererProps<TTree>) => ReactNode;
}

const runtimePacks = new Map<string, RuntimePackDefinition<unknown>>();

export function registerRuntimePack<TTree>(definition: RuntimePackDefinition<TTree>): void {
  runtimePacks.set(definition.packId, definition as RuntimePackDefinition<unknown>);
}

export function normalizeRuntimePackId(packId?: string | null): string {
  if (typeof packId !== 'string') {
    return DEFAULT_RUNTIME_PACK_ID;
  }

  const trimmed = packId.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_RUNTIME_PACK_ID;
}

export function getRuntimePackOrThrow(packId?: string | null): RuntimePackDefinition<unknown> {
  const normalized = normalizeRuntimePackId(packId);
  const pack = runtimePacks.get(normalized);
  if (!pack) {
    throw new Error(`Unknown runtime pack: ${normalized}`);
  }
  return pack;
}

export function listRuntimePacks(): string[] {
  return Array.from(runtimePacks.keys()).sort();
}

export function validateRuntimeTree<TTree = RuntimePackTree>(packId: string | undefined, value: unknown): TTree {
  return getRuntimePackOrThrow(packId).validateTree(value) as TTree;
}

export function renderRuntimeTree(packId: string | undefined, value: unknown, onEvent: (handler: string, args?: unknown) => void): ReactNode {
  const pack = getRuntimePackOrThrow(packId);
  const tree = pack.validateTree(value);
  return pack.render({ tree, onEvent });
}

registerRuntimePack<UINode>({
  packId: DEFAULT_RUNTIME_PACK_ID,
  validateTree: validateUINode,
  render: ({ tree, onEvent }) => <PluginCardRenderer tree={tree} onEvent={onEvent} />,
});

registerRuntimePack<KanbanV1Node>({
  packId: KANBAN_V1_PACK_ID,
  validateTree: validateKanbanV1Node,
  render: ({ tree, onEvent }) => <KanbanV1Renderer tree={tree} onEvent={onEvent} />,
});
