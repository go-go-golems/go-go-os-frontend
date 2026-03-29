export interface Port {
  id: string;
  label: string;
  type: string;
}

export interface NodeField {
  label: string;
  value: string;
}

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  title: string;
  icon: string;
  inputs: Port[];
  outputs: Port[];
  fields: NodeField[];
}

export interface Connection {
  from: string;
  to: string;
}

export interface TempConnection {
  from: string;
  fromPos: { x: number; y: number };
  to: string | null;
  toPos: { x: number; y: number };
}

export const NODE_WIDTH = 200;
