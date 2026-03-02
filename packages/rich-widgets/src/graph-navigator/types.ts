export interface GraphNavNode {
  id: string;
  label: string;
  type: string;
  props: Record<string, string | number>;
}

export interface GraphNavEdge {
  source: string;
  target: string;
  label: string;
}

export interface NodeTypeStyle {
  emoji: string;
  fill: string;
  border: string;
}

export const TYPE_STYLES: Record<string, NodeTypeStyle> = {
  Person: { emoji: '\uD83D\uDC64', fill: '#fff', border: '#000' },
  Company: { emoji: '\uD83C\uDFE2', fill: '#ddd', border: '#000' },
  Project: { emoji: '\uD83D\uDCC1', fill: '#eee', border: '#000' },
};
