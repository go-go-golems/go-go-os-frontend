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

let __stackBundle = null;
let __runtimeIntents = [];

function defineStackBundle(factory) {
  if (typeof factory !== 'function') {
    throw new Error('defineStackBundle requires a factory function');
  }

  __stackBundle = factory({ ui: __ui });
}

function assertStackBundleReady() {
  if (!__stackBundle || typeof __stackBundle !== 'object') {
    throw new Error('Stack bundle did not register via defineStackBundle');
  }
}

function assertCardsMap() {
  assertStackBundleReady();
  if (!__stackBundle.cards || typeof __stackBundle.cards !== 'object') {
    __stackBundle.cards = {};
  }
  return __stackBundle.cards;
}

function normalizeCardDefinition(cardId, definitionOrFactory) {
  const definition =
    typeof definitionOrFactory === 'function'
      ? definitionOrFactory({ ui: __ui })
      : definitionOrFactory;

  if (!definition || typeof definition !== 'object') {
    throw new Error('Card definition must be an object for card: ' + String(cardId));
  }

  if (typeof definition.render !== 'function') {
    throw new Error('Card definition render() is required for card: ' + String(cardId));
  }

  if (definition.handlers !== undefined) {
    if (!definition.handlers || typeof definition.handlers !== 'object' || Array.isArray(definition.handlers)) {
      throw new Error('Card definition handlers must be an object for card: ' + String(cardId));
    }
  } else {
    definition.handlers = {};
  }

  return definition;
}

function ensureCardRecord(cardId) {
  const cards = assertCardsMap();
  const key = String(cardId);
  const existing = cards[key];
  if (!existing || typeof existing !== 'object') {
    cards[key] = {
      handlers: {},
    };
  } else if (!existing.handlers || typeof existing.handlers !== 'object') {
    existing.handlers = {};
  }
  return cards[key];
}

function defineCard(cardId, definitionOrFactory) {
  const cards = assertCardsMap();
  const key = String(cardId);
  cards[key] = normalizeCardDefinition(key, definitionOrFactory);
}

function defineCardRender(cardId, renderFn) {
  if (typeof renderFn !== 'function') {
    throw new Error('defineCardRender requires a render function');
  }

  const card = ensureCardRecord(cardId);
  card.render = renderFn;
}

function defineCardHandler(cardId, handlerName, handlerFn) {
  if (typeof handlerFn !== 'function') {
    throw new Error('defineCardHandler requires a handler function');
  }

  const card = ensureCardRecord(cardId);
  card.handlers[String(handlerName)] = handlerFn;
}

globalThis.defineStackBundle = defineStackBundle;
globalThis.defineCard = defineCard;
globalThis.defineCardRender = defineCardRender;
globalThis.defineCardHandler = defineCardHandler;
globalThis.ui = __ui;

globalThis.__stackHost = {
  getMeta() {
    if (!__stackBundle || typeof __stackBundle !== 'object') {
      throw new Error('Stack bundle did not register via defineStackBundle');
    }

    if (!__stackBundle.cards || typeof __stackBundle.cards !== 'object') {
      throw new Error('Stack bundle cards must be an object');
    }

    return {
      declaredId: typeof __stackBundle.id === 'string' ? __stackBundle.id : undefined,
      title: String(__stackBundle.title ?? 'Untitled Stack'),
      description: typeof __stackBundle.description === 'string' ? __stackBundle.description : undefined,
      initialSessionState: __stackBundle.initialSessionState,
      initialCardState: __stackBundle.initialCardState,
      cards: Object.keys(__stackBundle.cards),
    };
  },

  render(cardId, cardState, sessionState, globalState) {
    const card = __stackBundle?.cards?.[cardId];
    if (!card || typeof card.render !== 'function') {
      throw new Error('Card not found or render() is missing: ' + String(cardId));
    }

    return card.render({ cardState, sessionState, globalState });
  },

  event(cardId, handlerName, args, cardState, sessionState, globalState) {
    const card = __stackBundle?.cards?.[cardId];
    if (!card) {
      throw new Error('Card not found: ' + String(cardId));
    }

    const handler = card.handlers?.[handlerName];
    if (typeof handler !== 'function') {
      throw new Error('Handler not found: ' + String(handlerName));
    }

    __runtimeIntents = [];

    const dispatchCardAction = (actionType, payload) => {
      __runtimeIntents.push({
        scope: 'card',
        actionType: String(actionType),
        payload,
      });
    };

    const dispatchSessionAction = (actionType, payload) => {
      __runtimeIntents.push({
        scope: 'session',
        actionType: String(actionType),
        payload,
      });
    };

    const dispatchDomainAction = (domain, actionType, payload) => {
      __runtimeIntents.push({
        scope: 'domain',
        domain: String(domain),
        actionType: String(actionType),
        payload,
      });
    };

    const dispatchSystemCommand = (command, payload) => {
      __runtimeIntents.push({
        scope: 'system',
        command: String(command),
        payload,
      });
    };

    handler(
      {
        cardState,
        sessionState,
        globalState,
        dispatchCardAction,
        dispatchSessionAction,
        dispatchDomainAction,
        dispatchSystemCommand,
      },
      args
    );

    return __runtimeIntents.slice();
  },

  defineCard(cardId, definitionOrFactory) {
    defineCard(cardId, definitionOrFactory);
    return this.getMeta();
  },

  defineCardRender(cardId, renderFn) {
    defineCardRender(cardId, renderFn);
    return this.getMeta();
  },

  defineCardHandler(cardId, handlerName, handlerFn) {
    defineCardHandler(cardId, handlerName, handlerFn);
    return this.getMeta();
  },
};
