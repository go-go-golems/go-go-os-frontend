import type { Book } from './types';

interface PluginUiNode {
  kind: string;
  text?: string;
  props?: Record<string, unknown>;
  children?: PluginUiNode[];
}

interface PluginUiFactory {
  text(content: unknown): PluginUiNode;
  button(label: unknown, props?: Record<string, unknown>): PluginUiNode;
  input(value: unknown, props?: Record<string, unknown>): PluginUiNode;
  row(children?: PluginUiNode[]): PluginUiNode;
  column(children?: PluginUiNode[]): PluginUiNode;
  panel(children?: PluginUiNode[]): PluginUiNode;
  badge(text: unknown): PluginUiNode;
  table(rows?: unknown[], props?: Record<string, unknown>): PluginUiNode;
}

interface BooksRuntimeState {
  self?: Record<string, unknown>;
  nav?: {
    current?: string;
    param?: unknown;
    [key: string]: unknown;
  };
  ui?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  draft?: Record<string, unknown>;
  books?: {
    items?: Book[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface RuntimeAction {
  type: string;
  payload?: unknown;
  meta?: Record<string, unknown>;
}

interface PluginRenderContext {
  state: BooksRuntimeState;
}

interface PluginHandlerContext extends PluginRenderContext {
  dispatch(action: RuntimeAction): void;
}

interface PluginCardDef {
  render(context: PluginRenderContext): PluginUiNode;
  handlers?: Record<string, (context: PluginHandlerContext, args?: unknown) => void>;
}

interface PluginBundle {
  id: string;
  title: string;
  description?: string;
  initialSessionState?: Record<string, unknown>;
  initialSurfaceState?: Record<string, Record<string, unknown>>;
  surfaces: Record<string, PluginCardDef>;
}

declare global {
  function defineRuntimeBundle(factory: (args: { ui: PluginUiFactory }) => PluginBundle): void;
}

export {};
