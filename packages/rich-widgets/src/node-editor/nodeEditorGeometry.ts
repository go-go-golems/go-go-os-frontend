import { NODE_WIDTH, type GraphNode } from './types';

export function getPortPosition(
  nodes: GraphNode[],
  portId: string,
): { x: number; y: number } {
  for (const node of nodes) {
    for (let index = 0; index < node.inputs.length; index += 1) {
      if (node.inputs[index].id === portId) {
        const headerHeight = 22;
        const fieldsHeight = node.fields.length * 24;
        const inputY = headerHeight + fieldsHeight + 12 + index * 22 + 8;
        return { x: node.x + 2, y: node.y + inputY };
      }
    }

    for (let index = 0; index < node.outputs.length; index += 1) {
      if (node.outputs[index].id === portId) {
        const headerHeight = 22;
        const fieldsHeight = node.fields.length * 24;
        const outputY = headerHeight + fieldsHeight + 12 + index * 22 + 8;
        return { x: node.x + NODE_WIDTH - 2, y: node.y + outputY };
      }
    }
  }

  return { x: 0, y: 0 };
}
