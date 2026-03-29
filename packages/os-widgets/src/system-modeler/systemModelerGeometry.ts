import type { BlockInstance, Point } from './types';

export function getPortPos(
  block: BlockInstance,
  isInput: boolean,
  portIdx: number,
): Point {
  const portCount = isInput ? block.inputs : block.outputs;
  const spacing = block.h / (portCount + 1);
  return {
    x: block.x + (isInput ? 0 : block.w),
    y: block.y + spacing * (portIdx + 1),
  };
}
