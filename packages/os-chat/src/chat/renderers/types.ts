import type React from 'react';

export interface RenderEntity {
  id: string;
  kind: string;
  props: Record<string, unknown>;
  createdAt: number;
  updatedAt?: number;
}

export type RenderMode = 'normal' | 'debug';

export interface RenderContext {
  mode: RenderMode;
  convId: string;
}

export type TimelineRenderer = React.ComponentType<{ e: RenderEntity; ctx?: RenderContext }>;

export type ChatWidgetRenderers = Record<string, TimelineRenderer> & {
  default: TimelineRenderer;
};
