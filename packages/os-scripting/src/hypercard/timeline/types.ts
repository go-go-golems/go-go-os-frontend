export interface RenderEntity {
  id: string;
  kind: string;
  createdAt?: number;
  updatedAt?: number;
  version?: number;
  props: Record<string, unknown>;
}

export interface RenderContext {
  mode?: 'normal' | 'compact' | 'debug' | string;
  convId?: string;
}
