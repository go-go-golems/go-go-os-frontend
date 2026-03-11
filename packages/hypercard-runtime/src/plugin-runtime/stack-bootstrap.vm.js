const __ui = {
  text(content) {
    return { kind: 'text', text: String(content) };
  },
  button(label, props = {}) {
    return { kind: 'button', props: { label: String(label), ...props } };
  },
  input(value, props = {}) {
    return { kind: 'input', props: { value: String(value ?? ''), ...props } };
  },
  row(children = []) {
    return { kind: 'row', children: Array.isArray(children) ? children : [] };
  },
  column(children = []) {
    return { kind: 'column', children: Array.isArray(children) ? children : [] };
  },
  panel(children = []) {
    return { kind: 'panel', children: Array.isArray(children) ? children : [] };
  },
  badge(text) {
    return { kind: 'badge', text: String(text) };
  },
  table(rows = [], props = {}) {
    return {
      kind: 'table',
      props: {
        headers: Array.isArray(props?.headers) ? props.headers : [],
        rows: Array.isArray(rows) ? rows : [],
      },
    };
  },
  dropdown(options = [], props = {}) {
    const selected = Number.isFinite(Number(props?.selected)) ? Number(props.selected) : 0;
    return {
      kind: 'dropdown',
      props: {
        options: Array.isArray(options) ? options.map((option) => String(option)) : [],
        selected,
        onSelect: props?.onSelect,
        width: props?.width,
      },
    };
  },
  selectableTable(rows = [], props = {}) {
    return {
      kind: 'selectableTable',
      props: {
        headers: Array.isArray(props?.headers) ? props.headers.map((header) => String(header)) : [],
        rows: Array.isArray(rows) ? rows : [],
        selectedRowKeys: Array.isArray(props?.selectedRowKeys)
          ? props.selectedRowKeys.map((key) => String(key))
          : [],
        mode: props?.mode,
        rowKeyIndex: Number.isFinite(Number(props?.rowKeyIndex)) ? Number(props.rowKeyIndex) : 0,
        searchable: props?.searchable === true,
        searchText: typeof props?.searchText === 'string' ? props.searchText : '',
        searchPlaceholder: typeof props?.searchPlaceholder === 'string' ? props.searchPlaceholder : undefined,
        emptyMessage: typeof props?.emptyMessage === 'string' ? props.emptyMessage : undefined,
        onSelectionChange: props?.onSelectionChange,
        onSearchChange: props?.onSearchChange,
        onRowClick: props?.onRowClick,
      },
    };
  },
  gridBoard(props = {}) {
    return {
      kind: 'gridBoard',
      props: {
        rows: Number.isFinite(Number(props?.rows)) ? Number(props.rows) : 1,
        cols: Number.isFinite(Number(props?.cols)) ? Number(props.cols) : 1,
        cells: Array.isArray(props?.cells) ? props.cells : [],
        selectedIndex:
          props?.selectedIndex === null || Number.isFinite(Number(props?.selectedIndex))
            ? props.selectedIndex
            : undefined,
        cellSize: props?.cellSize,
        disabled: props?.disabled === true,
        onSelect: props?.onSelect,
      },
    };
  },
};

const __widgets = {
  kanban: {
    page(...children) {
      const flatChildren = children.flat().filter(Boolean);
      return { kind: 'kanban.page', children: flatChildren };
    },
    taxonomy(props = {}) {
      const safeProps = props && typeof props === 'object' && !Array.isArray(props) ? props : {};
      return { kind: 'kanban.taxonomy', props: safeProps };
    },
    header(props = {}) {
      const safeProps = props && typeof props === 'object' && !Array.isArray(props) ? props : {};
      return { kind: 'kanban.header', props: safeProps };
    },
    filters(props = {}) {
      const safeProps = props && typeof props === 'object' && !Array.isArray(props) ? props : {};
      return { kind: 'kanban.filters', props: safeProps };
    },
    highlights(props = {}) {
      const safeProps = props && typeof props === 'object' && !Array.isArray(props) ? props : {};
      return { kind: 'kanban.highlights', props: safeProps };
    },
    board(props = {}) {
      const safeProps = props && typeof props === 'object' && !Array.isArray(props) ? props : {};
      return { kind: 'kanban.board', props: safeProps };
    },
    status(props = {}) {
      const safeProps = props && typeof props === 'object' && !Array.isArray(props) ? props : {};
      return { kind: 'kanban.status', props: safeProps };
    },
  },
};

let __stackBundle = null;
let __runtimeActions = [];

function defineRuntimeBundleImpl(factory) {
  if (typeof factory !== 'function') {
    throw new Error('defineRuntimeBundle requires a factory function');
  }

  __stackBundle = factory({ ui: __ui });
}

function assertStackBundleReady() {
  if (!__stackBundle || typeof __stackBundle !== 'object') {
    throw new Error('Runtime bundle did not register via defineRuntimeBundle');
  }
}

function assertSurfacesMap() {
  assertStackBundleReady();
  if (!__stackBundle.surfaces || typeof __stackBundle.surfaces !== 'object') {
    __stackBundle.surfaces = {};
  }
  return __stackBundle.surfaces;
}

function normalizePackId(packId) {
  if (typeof packId !== 'string' || packId.trim().length === 0) {
    return 'ui.card.v1';
  }

  return packId.trim();
}

function createPackHelpers(packId) {
  const normalizedPackId = normalizePackId(packId);

  if (normalizedPackId === 'ui.card.v1') {
    return { ui: __ui };
  }

  if (normalizedPackId === 'kanban.v1') {
    return { widgets: __widgets };
  }

  throw new Error('Unknown runtime surface type: ' + String(normalizedPackId));
}

function normalizeRuntimeSurfaceDefinition(surfaceId, definitionOrFactory, packId) {
  const normalizedPackId = normalizePackId(packId);
  const definition =
    typeof definitionOrFactory === 'function'
      ? definitionOrFactory(createPackHelpers(normalizedPackId))
      : definitionOrFactory;

  if (!definition || typeof definition !== 'object') {
    throw new Error('Runtime surface definition must be an object for surface: ' + String(surfaceId));
  }

  if (typeof definition.render !== 'function') {
    throw new Error('Runtime surface definition render() is required for surface: ' + String(surfaceId));
  }

  if (definition.handlers !== undefined) {
    if (!definition.handlers || typeof definition.handlers !== 'object' || Array.isArray(definition.handlers)) {
      throw new Error('Runtime surface definition handlers must be an object for surface: ' + String(surfaceId));
    }
  } else {
    definition.handlers = {};
  }

  definition.packId = normalizedPackId;
  return definition;
}

function ensureRuntimeSurfaceRecord(surfaceId) {
  const surfaces = assertSurfacesMap();
  const key = String(surfaceId);
  const existing = surfaces[key];
  if (!existing || typeof existing !== 'object') {
    surfaces[key] = {
      handlers: {},
    };
  } else if (!existing.handlers || typeof existing.handlers !== 'object') {
    existing.handlers = {};
  }
  return surfaces[key];
}

function defineRuntimeSurfaceImpl(surfaceId, definitionOrFactory, packId) {
  const surfaces = assertSurfacesMap();
  const key = String(surfaceId);
  surfaces[key] = normalizeRuntimeSurfaceDefinition(key, definitionOrFactory, packId);
}

function defineRuntimeSurfaceRenderImpl(surfaceId, renderFn) {
  if (typeof renderFn !== 'function') {
    throw new Error('defineRuntimeSurfaceRender requires a render function');
  }

  const surface = ensureRuntimeSurfaceRecord(surfaceId);
  surface.render = renderFn;
}

function defineRuntimeSurfaceHandlerImpl(surfaceId, handlerName, handlerFn) {
  if (typeof handlerFn !== 'function') {
    throw new Error('defineRuntimeSurfaceHandler requires a handler function');
  }

  const surface = ensureRuntimeSurfaceRecord(surfaceId);
  surface.handlers[String(handlerName)] = handlerFn;
}

globalThis.defineRuntimeBundle = defineRuntimeBundleImpl;
globalThis.defineRuntimeSurface = defineRuntimeSurfaceImpl;
globalThis.defineRuntimeSurfaceRender = defineRuntimeSurfaceRenderImpl;
globalThis.defineRuntimeSurfaceHandler = defineRuntimeSurfaceHandlerImpl;
globalThis.ui = __ui;

globalThis.__runtimeBundleHost = {
  getMeta() {
    if (!__stackBundle || typeof __stackBundle !== 'object') {
      throw new Error('Runtime bundle did not register via defineRuntimeBundle');
    }

    if (!__stackBundle.surfaces || typeof __stackBundle.surfaces !== 'object') {
      throw new Error('Runtime bundle surfaces must be an object');
    }

    return {
      declaredId: typeof __stackBundle.id === 'string' ? __stackBundle.id : undefined,
      title: String(__stackBundle.title ?? 'Untitled Stack'),
      description: typeof __stackBundle.description === 'string' ? __stackBundle.description : undefined,
      initialSessionState: __stackBundle.initialSessionState,
      initialSurfaceState: __stackBundle.initialSurfaceState,
      surfaces: Object.keys(__stackBundle.surfaces),
      surfaceTypes: Object.fromEntries(
        Object.entries(__stackBundle.surfaces).map(([key, surface]) => [
          key,
          typeof surface?.packId === 'string' && surface.packId.length > 0 ? surface.packId : 'ui.card.v1',
        ]),
      ),
    };
  },

  renderRuntimeSurface(surfaceId, state) {
    const surface = __stackBundle?.surfaces?.[surfaceId];
    if (!surface || typeof surface.render !== 'function') {
      throw new Error('Runtime surface not found or render() is missing: ' + String(surfaceId));
    }

    return surface.render({ state });
  },

  eventRuntimeSurface(surfaceId, handlerName, args, state) {
    const surface = __stackBundle?.surfaces?.[surfaceId];
    if (!surface) {
      throw new Error('Runtime surface not found: ' + String(surfaceId));
    }

    const handler = surface.handlers?.[handlerName];
    if (typeof handler !== 'function') {
      throw new Error('Handler not found: ' + String(handlerName));
    }

    __runtimeActions = [];

    const dispatch = (action) => {
      __runtimeActions.push(action);
    };

    handler(
      {
        state,
        dispatch,
      },
      args
    );

    return __runtimeActions.slice();
  },

  defineRuntimeSurface(surfaceId, definitionOrFactory, packId) {
    defineRuntimeSurfaceImpl(surfaceId, definitionOrFactory, packId);
    return this.getMeta();
  },

  defineRuntimeSurfaceRender(surfaceId, renderFn) {
    defineRuntimeSurfaceRenderImpl(surfaceId, renderFn);
    return this.getMeta();
  },

  defineRuntimeSurfaceHandler(surfaceId, handlerName, handlerFn) {
    defineRuntimeSurfaceHandlerImpl(surfaceId, handlerName, handlerFn);
    return this.getMeta();
  },
};
