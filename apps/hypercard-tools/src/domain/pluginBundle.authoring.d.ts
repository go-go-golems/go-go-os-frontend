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
  dropdown(options?: unknown[], props?: Record<string, unknown>): PluginUiNode;
  selectableTable(rows?: unknown[], props?: Record<string, unknown>): PluginUiNode;
  gridBoard(props?: Record<string, unknown>): PluginUiNode;
}

interface HypercardToolsRuntimeState {
  self?: Record<string, unknown>;
  nav?: {
    current?: string;
    param?: unknown;
    depth?: number;
    canBack?: boolean;
    [key: string]: unknown;
  };
  ui?: {
    focusedWindowId?: string | null;
    runtimeStatus?: string;
    [key: string]: unknown;
  };
  filters?: Record<string, unknown>;
  draft?: Record<string, unknown>;
  app_hypercard_tools?: Record<string, unknown>;
  [key: string]: unknown;
}

interface RuntimeAction {
  type: string;
  payload?: unknown;
  meta?: Record<string, unknown>;
}

interface PluginRenderContext {
  state: HypercardToolsRuntimeState;
}

interface PluginHandlerContext extends PluginRenderContext {
  dispatch(action: RuntimeAction): void;
}

interface PluginCardDef {
  packId: string;
  render(context: PluginRenderContext): PluginUiNode;
  handlers?: Record<string, (context: PluginHandlerContext, args?: unknown) => void>;
}

interface PluginBundle {
  id: string;
  title: string;
  packageIds: string[];
  description?: string;
  initialSessionState?: Record<string, unknown>;
  initialSurfaceState?: Record<string, Record<string, unknown>>;
  surfaces: Record<string, PluginCardDef>;
}

declare global {
  function defineRuntimeBundle(factory: (args: { ui: PluginUiFactory }) => PluginBundle): void;
}

export {};
