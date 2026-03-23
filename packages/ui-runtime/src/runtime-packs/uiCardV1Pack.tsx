import type { RuntimeSurfaceTypeDefinition } from '@hypercard/hypercard-runtime';
import { UIRuntimeRenderer } from '../UIRuntimeRenderer';
import type { UINode } from '../uiTypes';
import { validateUINode } from './uiSchema';

export const UI_CARD_V1_RUNTIME_SURFACE_TYPE: RuntimeSurfaceTypeDefinition<UINode> = {
  packId: 'ui.card.v1',
  validateTree: validateUINode,
  render: ({ tree, onEvent }) => <UIRuntimeRenderer tree={tree} onEvent={onEvent} />,
};
