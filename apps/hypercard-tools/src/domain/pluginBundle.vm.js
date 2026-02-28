// @ts-check
/// <reference path="./pluginBundle.authoring.d.ts" />
defineStackBundle(({ ui }) => {
  const DEMO_CARDS = [
    { id: 'layouts', title: 'Layouts', focus: 'panel / row / column composition' },
    { id: 'textBadges', title: 'Text and Badges', focus: 'text and badge primitives' },
    { id: 'buttons', title: 'Buttons and Actions', focus: 'button handlers + variants + notify' },
    { id: 'inputs', title: 'Inputs', focus: 'input change events + placeholders' },
    { id: 'tables', title: 'Tables', focus: 'headers, rows, filtering' },
    { id: 'dropdowns', title: 'Dropdowns', focus: 'ui.dropdown selection events' },
    { id: 'selectableTable', title: 'Selectable Table', focus: 'multi-select + searchable table events' },
    { id: 'gridBoard', title: 'Grid Board', focus: 'cell selection callbacks' },
    { id: 'eventPayloads', title: 'Event Payload Merge', focus: 'handler args merged with event payload' },
    { id: 'domainIntents', title: 'Domain Intents', focus: 'dispatchDomainAction into app domain reducer' },
    { id: 'stateNav', title: 'State and Navigation', focus: 'card/session state and nav intents' },
    { id: 'playground', title: 'Composed Playground', focus: 'all active widgets in one card' },
  ];

  const SAMPLE_TABLE_ROWS = [
    ['widget-a', 'Alpha sensor', 'ok', '12'],
    ['widget-b', 'Beta sensor', 'warn', '3'],
    ['widget-c', 'Gamma sensor', 'ok', '29'],
    ['widget-d', 'Delta sensor', 'error', '0'],
    ['widget-e', 'Epsilon sensor', 'ok', '17'],
  ];

  const SELECTABLE_TABLE_ROWS = [
    ['A-100', 'Drill Set', '14', 'ok', 'Mia'],
    ['A-120', 'Bolt Pack', '2', 'warning', 'Noah'],
    ['A-130', 'Saw Blade', '0', 'critical', 'Aria'],
    ['A-145', 'Wrench Kit', '9', 'ok', 'Liam'],
    ['A-188', 'Shop Gloves', '3', 'warning', 'Eli'],
  ];

  const FONT_OPTIONS = ['Geneva', 'Chicago', 'Monaco', 'New York', 'Athens', 'Cairo'];
  const THEME_OPTIONS = ['Geneva', 'Chicago', 'Monaco'];

  const GRID_CELLS = [
    { label: 'A1', color: '#f9f4d2' },
    { label: 'A2', color: '#d2f9e7' },
    { label: 'A3', color: '#d2e5f9' },
    { label: 'A4', color: '#f9d2dc' },
    { label: 'B1', color: '#f4d2f9' },
    { label: 'B2', color: '#f9ecd2', disabled: true },
    { label: 'B3', color: '#e4f9d2' },
    { label: 'B4', color: '#d2f0f9' },
    { label: 'C1', color: '#f9d2f0' },
    { label: 'C2', color: '#f9f4d2' },
    { label: 'C3', color: '#d2f9e7' },
    { label: 'C4', color: '#d2e5f9' },
    { label: 'D1', color: '#f9d2dc' },
    { label: 'D2', color: '#f4d2f9' },
    { label: 'D3', color: '#f9ecd2' },
    { label: 'D4', color: '#e4f9d2' },
  ];

  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toText(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    return String(value);
  }

  function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function toJson(value) {
    try {
      return JSON.stringify(value, null, 2);
    } catch (_error) {
      return '{"error":"failed to serialize"}';
    }
  }

  function navState(globalState) {
    return asRecord(asRecord(globalState).nav);
  }

  function appDomainState(globalState) {
    const domains = asRecord(asRecord(globalState).domains);
    return asRecord(domains.app_hypercard_tools);
  }

  function readInputValue(args) {
    return toText(asRecord(args).value);
  }

  function goTo(context, cardId, param) {
    const payload = param ? { cardId, param: toText(param) } : { cardId };
    context.dispatchSystemCommand('nav.go', payload);
  }

  function goHome(context) {
    context.dispatchSystemCommand('nav.go', { cardId: 'home' });
  }

  function back(context) {
    context.dispatchSystemCommand('nav.back');
  }

  function notify(context, message) {
    context.dispatchSystemCommand('notify', { message: toText(message) });
  }

  function isVisibleWithFilter(card, filterText) {
    const query = toText(filterText).trim().toLowerCase();
    if (!query) return true;
    return (
      card.id.toLowerCase().includes(query) ||
      card.title.toLowerCase().includes(query) ||
      card.focus.toLowerCase().includes(query)
    );
  }

  function catalogRows(sessionState) {
    const session = asRecord(sessionState);
    const filter = toText(session.catalogFilter).trim().toLowerCase();
    return DEMO_CARDS.filter((card) => isVisibleWithFilter(card, filter)).map((card, index) => [
      String(index + 1),
      card.title,
      card.focus,
      card.id,
    ]);
  }

  function catalogButtons(sessionState) {
    const session = asRecord(sessionState);
    const filter = toText(session.catalogFilter).trim().toLowerCase();
    return DEMO_CARDS.filter((card) => isVisibleWithFilter(card, filter)).map((card) =>
      ui.button('Open ' + card.title, {
        onClick: {
          handler: 'openDemo',
          args: { cardId: card.id },
        },
      })
    );
  }

  function filteredRows(query) {
    const q = toText(query).trim().toLowerCase();
    if (!q) return SAMPLE_TABLE_ROWS;
    return SAMPLE_TABLE_ROWS.filter((row) => row.some((cell) => toText(cell).toLowerCase().includes(q)));
  }

  function selectableRows(query) {
    const q = toText(query).trim().toLowerCase();
    if (!q) return SELECTABLE_TABLE_ROWS;
    return SELECTABLE_TABLE_ROWS.filter((row) => row.some((cell) => toText(cell).toLowerCase().includes(q)));
  }

  function playgroundRows(state) {
    return asArray(asRecord(state).rows)
      .map((row) => (Array.isArray(row) ? row : []))
      .filter((row) => row.length >= 2)
      .map((row) => [toText(row[0]), toText(row[1])]);
  }

  function dropdownSelected(options, selectedIndex) {
    const index = Math.max(0, Math.min(options.length - 1, toNumber(selectedIndex, 0)));
    return { index, value: toText(options[index], options[0] || '') };
  }

  function gridSelectionText(selection) {
    const value = asRecord(selection);
    return `row=${toNumber(value.row, -1)} col=${toNumber(value.col, -1)} idx=${toNumber(value.cellIndex, -1)}`;
  }

  return {
    id: 'hypercardToolsUiDslDemo',
    title: 'HyperCard Tools UI DSL Demos',
    description: 'Demo stack for the active UI DSL widget surface.',
    initialSessionState: {
      catalogFilter: '',
      lastVisited: 'home',
      visitCount: 1,
      note: 'Use this stack as the reference for card authoring.',
    },
    initialCardState: {
      textBadges: { badgeLabel: 'alpha' },
      buttons: { clicks: 0, lastAction: 'none' },
      inputs: { name: '', message: '', search: '' },
      tables: { query: '' },
      dropdowns: { selectedFont: 1, width: '180' },
      selectableTable: { selectedRowKeys: ['A-120'], searchText: '', lastRowKey: '(none)' },
      gridBoard: { selectedIndex: 5, lastSelection: 'row=1 col=1 idx=5' },
      eventPayloads: {
        query: '',
        lastPayload: {},
        lastPayloadJson: '{\n  "field": "query",\n  "source": "eventPayloads",\n  "tag": "merge-demo",\n  "value": ""\n}',
      },
      stateNav: { scratch: { title: 'untitled', priority: 'low' } },
      playground: {
        draftName: 'sample-widget',
        draftState: 'ready',
        rows: [
          ['sample-widget', 'ready'],
          ['demo-widget', 'draft'],
        ],
        selectedFont: 0,
        selectedCellIndex: 0,
      },
    },
    cards: {
      home: {
        render({ sessionState }) {
          const session = asRecord(sessionState);
          const rows = catalogRows(session);
          const buttons = catalogButtons(session);
          return ui.panel([
            ui.text('HyperCard Tools - UI DSL Demo Catalog'),
            ui.text('This stack demonstrates every active UI DSL widget kind.'),
            ui.row([
              ui.text('Filter:'),
              ui.input(toText(session.catalogFilter), {
                placeholder: 'Type card id/title/focus',
                onChange: { handler: 'setCatalogFilter', args: { source: 'catalogFilter' } },
              }),
            ]),
            ui.table(rows, {
              headers: ['#', 'Demo Card', 'Focus', 'Card ID'],
            }),
            rows.length ? ui.text('Open a demo card:') : ui.badge('No cards matched your filter.'),
            ui.column(buttons),
            ui.row([
              ui.button('Reset Session State', { onClick: { handler: 'resetSessionState' }, variant: 'danger' }),
              ui.button('Show Welcome Toast', { onClick: { handler: 'toastWelcome' }, variant: 'primary' }),
              ui.button('Close Window', { onClick: { handler: 'closeWindow' } }),
            ]),
            ui.text('Last visited: ' + toText(session.lastVisited, 'home')),
            ui.text('Visit count: ' + String(toNumber(session.visitCount, 1))),
          ]);
        },
        handlers: {
          setCatalogFilter({ dispatchSessionAction }, args) {
            dispatchSessionAction('patch', { catalogFilter: readInputValue(args) });
          },
          openDemo({ sessionState, dispatchSessionAction, dispatchSystemCommand }, args) {
            const cardId = toText(asRecord(args).cardId, 'home');
            const nextVisitCount = toNumber(asRecord(sessionState).visitCount, 0) + 1;
            dispatchSessionAction('patch', {
              lastVisited: cardId,
              visitCount: nextVisitCount,
            });
            dispatchSystemCommand('nav.go', { cardId });
          },
          resetSessionState({ dispatchSessionAction }) {
            dispatchSessionAction('reset');
            dispatchSessionAction('patch', {
              catalogFilter: '',
              lastVisited: 'home',
              visitCount: 1,
              note: 'Session state reset from catalog.',
            });
          },
          toastWelcome(context) {
            notify(context, 'HyperCard UI DSL demo stack is ready.');
          },
          closeWindow({ dispatchSystemCommand }) {
            dispatchSystemCommand('window.close');
          },
        },
      },

      layouts: {
        render() {
          return ui.panel([
            ui.text('Layouts Demo'),
            ui.text('Use panel for page sections, row for horizontal alignment, and column for vertical stacks.'),
            ui.panel([
              ui.text('Nested Panel'),
              ui.row([
                ui.badge('left zone'),
                ui.badge('center zone'),
                ui.badge('right zone'),
              ]),
              ui.column([
                ui.text('Column item A'),
                ui.text('Column item B'),
                ui.text('Column item C'),
              ]),
            ]),
            ui.row([
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
              ui.button('Next: Text/Badges', { onClick: { handler: 'go', args: { cardId: 'textBadges' } } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            goTo(context, toText(asRecord(args).cardId, 'home'));
          },
          back,
          home: goHome,
        },
      },

      textBadges: {
        render({ cardState, sessionState }) {
          const state = asRecord(cardState);
          const session = asRecord(sessionState);
          const badgeLabel = toText(state.badgeLabel, 'alpha');
          return ui.panel([
            ui.text('Text and Badges Demo'),
            ui.text('Badges are useful for compact status highlights.'),
            ui.row([
              ui.text('Badge label:'),
              ui.input(badgeLabel, { onChange: { handler: 'setBadgeLabel' }, placeholder: 'Set badge text' }),
            ]),
            ui.row([
              ui.badge('status: ' + badgeLabel),
              ui.badge('last: ' + toText(session.lastVisited, 'home')),
              ui.badge('visits: ' + String(toNumber(session.visitCount, 1))),
            ]),
            ui.row([
              ui.button('Toast badge label', { onClick: { handler: 'toastLabel' }, variant: 'primary' }),
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
            ]),
          ]);
        },
        handlers: {
          setBadgeLabel({ dispatchCardAction }, args) {
            dispatchCardAction('patch', { badgeLabel: readInputValue(args) });
          },
          toastLabel({ cardState, dispatchSystemCommand }) {
            const label = toText(asRecord(cardState).badgeLabel, 'updated');
            dispatchSystemCommand('notify', { message: 'Badge label: ' + label });
          },
          back,
          home: goHome,
        },
      },

      buttons: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const clicks = toNumber(state.clicks, 0);
          const lastAction = toText(state.lastAction, 'none');
          return ui.panel([
            ui.text('Buttons and Actions Demo'),
            ui.text('Includes button variants and system notifications.'),
            ui.badge('click count: ' + String(clicks)),
            ui.badge('last action: ' + lastAction),
            ui.row([
              ui.button('Default', { onClick: { handler: 'markAction', args: { action: 'default' } } }),
              ui.button('Primary', {
                onClick: { handler: 'markAction', args: { action: 'primary' } },
                variant: 'primary',
              }),
              ui.button('Danger', {
                onClick: { handler: 'markAction', args: { action: 'danger' } },
                variant: 'danger',
              }),
            ]),
            ui.row([
              ui.button('Increment', { onClick: { handler: 'increment' } }),
              ui.button('Notify', { onClick: { handler: 'notify' }, variant: 'primary' }),
              ui.button('Reset Card State', { onClick: { handler: 'resetCard' }, variant: 'danger' }),
            ]),
            ui.row([
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
              ui.button('Next: Inputs', { onClick: { handler: 'go', args: { cardId: 'inputs' } } }),
            ]),
          ]);
        },
        handlers: {
          markAction({ dispatchCardAction }, args) {
            dispatchCardAction('patch', {
              lastAction: toText(asRecord(args).action, 'unknown'),
            });
          },
          increment({ cardState, dispatchCardAction, dispatchSessionAction }) {
            const clicks = toNumber(asRecord(cardState).clicks, 0) + 1;
            dispatchCardAction('patch', { clicks, lastAction: 'increment' });
            dispatchSessionAction('set', { path: 'visitCount', value: clicks });
          },
          notify(context) {
            notify(context, 'Button demo emitted a notify system intent.');
          },
          resetCard({ dispatchCardAction }) {
            dispatchCardAction('reset');
            dispatchCardAction('patch', { clicks: 0, lastAction: 'reset' });
          },
          go(context, args) {
            goTo(context, toText(asRecord(args).cardId, 'home'));
          },
          back,
          home: goHome,
        },
      },

      inputs: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const name = toText(state.name);
          const message = toText(state.message);
          const search = toText(state.search);
          return ui.panel([
            ui.text('Inputs Demo'),
            ui.text('Each input emits onChange payload { value } merged with optional args.'),
            ui.row([
              ui.text('Name:'),
              ui.input(name, {
                placeholder: 'Jane Doe',
                onChange: { handler: 'setField', args: { field: 'name', source: 'inputs-name' } },
              }),
            ]),
            ui.row([
              ui.text('Message:'),
              ui.input(message, {
                placeholder: 'Type a message',
                onChange: { handler: 'setField', args: { field: 'message', source: 'inputs-message' } },
              }),
            ]),
            ui.row([
              ui.text('Search:'),
              ui.input(search, {
                placeholder: 'Filter value',
                onChange: { handler: 'setField', args: { field: 'search', source: 'inputs-search' } },
              }),
            ]),
            ui.table(
              [
                ['name', name],
                ['message', message],
                ['search', search],
              ],
              { headers: ['Field', 'Value'] }
            ),
            ui.row([
              ui.button('Clear', { onClick: { handler: 'clear' }, variant: 'danger' }),
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
            ]),
          ]);
        },
        handlers: {
          setField({ dispatchCardAction }, args) {
            const payload = asRecord(args);
            const field = toText(payload.field);
            if (!field) {
              return;
            }
            dispatchCardAction('set', {
              path: field,
              value: toText(payload.value),
            });
          },
          clear({ dispatchCardAction }) {
            dispatchCardAction('patch', { name: '', message: '', search: '' });
          },
          back,
          home: goHome,
        },
      },

      tables: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const query = toText(state.query);
          const rows = filteredRows(query);
          return ui.panel([
            ui.text('Tables Demo'),
            ui.text('Table rows can be generated dynamically from card or session state.'),
            ui.row([
              ui.text('Filter rows:'),
              ui.input(query, { placeholder: 'Type any term', onChange: { handler: 'setQuery' } }),
            ]),
            ui.table(rows, {
              headers: ['SKU', 'Name', 'Health', 'Qty'],
            }),
            rows.length === 0 ? ui.badge('No rows matched the filter.') : ui.text('Rows: ' + String(rows.length)),
            ui.row([
              ui.button('Clear Filter', { onClick: { handler: 'clearQuery' }, variant: 'danger' }),
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
              ui.button('Next: Dropdowns', { onClick: { handler: 'go', args: { cardId: 'dropdowns' } } }),
            ]),
          ]);
        },
        handlers: {
          setQuery({ dispatchCardAction }, args) {
            dispatchCardAction('patch', { query: readInputValue(args) });
          },
          clearQuery({ dispatchCardAction }) {
            dispatchCardAction('patch', { query: '' });
          },
          go(context, args) {
            goTo(context, toText(asRecord(args).cardId, 'home'));
          },
          back,
          home: goHome,
        },
      },

      dropdowns: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const selected = dropdownSelected(FONT_OPTIONS, state.selectedFont);
          const widthValue = toText(state.width, '180');
          const width = Math.max(120, toNumber(widthValue, 180));
          return ui.panel([
            ui.text('Dropdowns Demo'),
            ui.text('ui.dropdown maps options + selected index + onSelect callbacks.'),
            ui.row([
              ui.text('Dropdown width:'),
              ui.input(widthValue, {
                placeholder: '180',
                onChange: { handler: 'setWidth' },
              }),
            ]),
            ui.dropdown(FONT_OPTIONS, {
              selected: selected.index,
              width,
              onSelect: { handler: 'pickFont' },
            }),
            ui.badge('selected index: ' + String(selected.index)),
            ui.badge('selected value: ' + selected.value),
            ui.row([
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
              ui.button('Next: Selectable Table', { onClick: { handler: 'go', args: { cardId: 'selectableTable' } } }),
            ]),
          ]);
        },
        handlers: {
          setWidth({ dispatchCardAction }, args) {
            dispatchCardAction('patch', { width: readInputValue(args) });
          },
          pickFont({ dispatchCardAction, dispatchDomainAction }, args) {
            const payload = asRecord(args);
            const index = toNumber(payload.index, 0);
            const value = toText(payload.value, FONT_OPTIONS[0]);
            dispatchCardAction('patch', { selectedFont: index });
            dispatchDomainAction('app_hypercard_tools', 'setTheme', { theme: value });
            dispatchDomainAction('app_hypercard_tools', 'logDemoEvent', { label: 'Dropdown selected: ' + value });
          },
          go(context, args) {
            goTo(context, toText(asRecord(args).cardId, 'home'));
          },
          back,
          home: goHome,
        },
      },

      selectableTable: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const searchText = toText(state.searchText);
          const selectedRowKeys = asArray(state.selectedRowKeys).map((key) => toText(key));
          const rows = selectableRows(searchText);
          return ui.panel([
            ui.text('Selectable Table Demo'),
            ui.text('ui.selectableTable supports selection events, search updates, and row click payloads.'),
            ui.selectableTable(rows, {
              headers: ['SKU', 'Name', 'Qty', 'Status', 'Owner'],
              selectedRowKeys,
              mode: 'multiple',
              rowKeyIndex: 0,
              searchable: true,
              searchText,
              searchPlaceholder: 'Search by SKU, Name, Status, Owner',
              emptyMessage: 'No rows matched your search.',
              onSelectionChange: { handler: 'setSelection' },
              onSearchChange: { handler: 'setSearch' },
              onRowClick: { handler: 'setLastRow' },
            }),
            ui.badge('selected keys: ' + (selectedRowKeys.join(', ') || '(none)')),
            ui.badge('last clicked row key: ' + toText(state.lastRowKey, '(none)')),
            ui.row([
              ui.button('Select warnings', { onClick: { handler: 'selectWarnings' }, variant: 'primary' }),
              ui.button('Clear selection', { onClick: { handler: 'clearSelection' }, variant: 'danger' }),
            ]),
            ui.row([
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
              ui.button('Next: Grid Board', { onClick: { handler: 'go', args: { cardId: 'gridBoard' } } }),
            ]),
          ]);
        },
        handlers: {
          setSelection({ dispatchCardAction, dispatchDomainAction }, args) {
            const selectedRowKeys = asArray(asRecord(args).selectedRowKeys).map((key) => toText(key));
            dispatchCardAction('patch', { selectedRowKeys });
            dispatchDomainAction('app_hypercard_tools', 'setSelectedRows', { selectedRowKeys });
          },
          setSearch({ dispatchCardAction, dispatchDomainAction }, args) {
            const value = readInputValue(args);
            dispatchCardAction('patch', { searchText: value });
            dispatchDomainAction('app_hypercard_tools', 'setSearchText', { value });
          },
          setLastRow({ dispatchCardAction }, args) {
            dispatchCardAction('patch', {
              lastRowKey: toText(asRecord(args).rowKey, '(none)'),
            });
          },
          selectWarnings({ dispatchCardAction, dispatchDomainAction }) {
            const selectedRowKeys = ['A-120', 'A-188'];
            dispatchCardAction('patch', { selectedRowKeys });
            dispatchDomainAction('app_hypercard_tools', 'setSelectedRows', { selectedRowKeys });
          },
          clearSelection({ dispatchCardAction, dispatchDomainAction }) {
            dispatchCardAction('patch', { selectedRowKeys: [] });
            dispatchDomainAction('app_hypercard_tools', 'setSelectedRows', { selectedRowKeys: [] });
          },
          go(context, args) {
            goTo(context, toText(asRecord(args).cardId, 'home'));
          },
          back,
          home: goHome,
        },
      },

      gridBoard: {
        render({ cardState }) {
          const state = asRecord(cardState);
          const selectedIndex = toNumber(state.selectedIndex, 0);
          return ui.panel([
            ui.text('Grid Board Demo'),
            ui.text('ui.gridBoard supports positional selection callbacks and cell metadata.'),
            ui.gridBoard({
              rows: 4,
              cols: 4,
              cells: GRID_CELLS,
              selectedIndex,
              cellSize: 'medium',
              onSelect: { handler: 'pickCell' },
            }),
            ui.badge('selected index: ' + String(selectedIndex)),
            ui.badge('selection: ' + toText(state.lastSelection, '(none)')),
            ui.row([
              ui.button('Clear selection', { onClick: { handler: 'clearSelection' }, variant: 'danger' }),
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
              ui.button('Next: Event Payloads', {
                onClick: { handler: 'go', args: { cardId: 'eventPayloads' } },
                variant: 'primary',
              }),
            ]),
          ]);
        },
        handlers: {
          pickCell({ dispatchCardAction, dispatchDomainAction }, args) {
            const payload = asRecord(args);
            const selectedIndex = toNumber(payload.cellIndex, 0);
            dispatchCardAction('patch', {
              selectedIndex,
              lastSelection: gridSelectionText(payload),
            });
            dispatchDomainAction('app_hypercard_tools', 'setSelectedCellIndex', { selectedIndex });
          },
          clearSelection({ dispatchCardAction, dispatchDomainAction }) {
            dispatchCardAction('patch', {
              selectedIndex: null,
              lastSelection: '(none)',
            });
            dispatchDomainAction('app_hypercard_tools', 'setSelectedCellIndex', { selectedIndex: null });
          },
          go(context, args) {
            goTo(context, toText(asRecord(args).cardId, 'home'));
          },
          back,
          home: goHome,
        },
      },

      eventPayloads: {
        render({ cardState }) {
          const state = asRecord(cardState);
          return ui.panel([
            ui.text('Event Payload Merge Demo'),
            ui.text('Input onChange payload merges with static args before handler invocation.'),
            ui.row([
              ui.text('Query:'),
              ui.input(toText(state.query), {
                placeholder: 'Type to inspect merged payload',
                onChange: {
                  handler: 'captureMergedPayload',
                  args: {
                    field: 'query',
                    source: 'eventPayloads',
                    tag: 'merge-demo',
                  },
                },
              }),
            ]),
            ui.table(
              [
                ['field', toText(asRecord(state.lastPayload).field, '(none)')],
                ['source', toText(asRecord(state.lastPayload).source, '(none)')],
                ['tag', toText(asRecord(state.lastPayload).tag, '(none)')],
                ['value', toText(asRecord(state.lastPayload).value, '')],
              ],
              { headers: ['Key', 'Merged Value'] }
            ),
            ui.text('Payload JSON: ' + toText(state.lastPayloadJson, '{}')),
            ui.row([
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
              ui.button('Next: Domain Intents', {
                onClick: { handler: 'go', args: { cardId: 'domainIntents' } },
                variant: 'primary',
              }),
            ]),
          ]);
        },
        handlers: {
          captureMergedPayload({ dispatchCardAction, dispatchDomainAction }, args) {
            const payload = asRecord(args);
            const query = toText(payload.value);
            dispatchCardAction('patch', {
              query,
              lastPayload: payload,
              lastPayloadJson: toJson(payload),
            });
            dispatchDomainAction('app_hypercard_tools', 'setMergedPayload', payload);
            dispatchDomainAction('app_hypercard_tools', 'logDemoEvent', { label: 'Merged payload captured' });
          },
          go(context, args) {
            goTo(context, toText(asRecord(args).cardId, 'home'));
          },
          back,
          home: goHome,
        },
      },

      domainIntents: {
        render({ globalState }) {
          const domain = appDomainState(globalState);
          const selectedTheme = dropdownSelected(THEME_OPTIONS, THEME_OPTIONS.indexOf(toText(domain.selectedTheme, 'Geneva')));
          const events = asArray(domain.demoEvents)
            .slice(0, 5)
            .map((entry) => {
              const row = asRecord(entry);
              return [toText(row.ts), toText(row.label)];
            });
          return ui.panel([
            ui.text('Domain Intents Demo'),
            ui.text('These actions call dispatchDomainAction and mutate app_hypercard_tools reducer state.'),
            ui.dropdown(THEME_OPTIONS, {
              selected: selectedTheme.index,
              onSelect: { handler: 'setTheme' },
            }),
            ui.table(
              [
                ['selectedTheme', toText(domain.selectedTheme, '(none)')],
                ['selectedRows', toJson(asArray(domain.selectedRows))],
                ['searchText', toText(domain.searchText, '')],
                ['selectedCellIndex', toText(domain.selectedCellIndex, '(none)')],
              ],
              { headers: ['Domain Key', 'Value'] }
            ),
            ui.text('Recent domain events:'),
            ui.table(events, {
              headers: ['Timestamp', 'Label'],
            }),
            ui.row([
              ui.button('Set warning rows', { onClick: { handler: 'setRows' } }),
              ui.button('Set search=sensor', { onClick: { handler: 'setSearch' } }),
              ui.button('Set cell index 7', { onClick: { handler: 'setCell' } }),
              ui.button('Log event', { onClick: { handler: 'logEvent' }, variant: 'primary' }),
            ]),
            ui.row([
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
              ui.button('Next: State/Nav', { onClick: { handler: 'go', args: { cardId: 'stateNav' } } }),
            ]),
          ]);
        },
        handlers: {
          setTheme({ dispatchDomainAction }, args) {
            const value = toText(asRecord(args).value, THEME_OPTIONS[0]);
            dispatchDomainAction('app_hypercard_tools', 'setTheme', { theme: value });
            dispatchDomainAction('app_hypercard_tools', 'logDemoEvent', { label: 'Theme set: ' + value });
          },
          setRows({ dispatchDomainAction }) {
            dispatchDomainAction('app_hypercard_tools', 'setSelectedRows', {
              selectedRowKeys: ['A-120', 'A-188'],
            });
          },
          setSearch({ dispatchDomainAction }) {
            dispatchDomainAction('app_hypercard_tools', 'setSearchText', { value: 'sensor' });
          },
          setCell({ dispatchDomainAction }) {
            dispatchDomainAction('app_hypercard_tools', 'setSelectedCellIndex', { selectedIndex: 7 });
          },
          logEvent({ dispatchDomainAction }) {
            dispatchDomainAction('app_hypercard_tools', 'logDemoEvent', {
              label: 'Manual domain-intent log event',
            });
          },
          go(context, args) {
            goTo(context, toText(asRecord(args).cardId, 'home'));
          },
          back,
          home: goHome,
        },
      },

      stateNav: {
        render({ cardState, sessionState, globalState }) {
          const card = asRecord(cardState);
          const session = asRecord(sessionState);
          const scratch = asRecord(card.scratch);
          const nav = navState(globalState);
          return ui.panel([
            ui.text('State and Navigation Demo'),
            ui.text('This card demonstrates patch/set/reset and nav params.'),
            ui.table(
              [
                ['session.lastVisited', toText(session.lastVisited, 'home')],
                ['session.visitCount', String(toNumber(session.visitCount, 1))],
                ['session.note', toText(session.note)],
                ['nav.current', toText(nav.current)],
                ['nav.param', toText(nav.param, '(none)')],
                ['card.scratch.title', toText(scratch.title, 'untitled')],
                ['card.scratch.priority', toText(scratch.priority, 'low')],
              ],
              { headers: ['Path', 'Value'] }
            ),
            ui.row([
              ui.button('Set title via path', { onClick: { handler: 'setTitlePath' } }),
              ui.button('Toggle priority', { onClick: { handler: 'togglePriority' } }),
              ui.button('Increment session visitCount', { onClick: { handler: 'incrementVisitCount' } }),
            ]),
            ui.row([
              ui.button('Go playground with param', {
                onClick: { handler: 'go', args: { cardId: 'playground', param: 'from-state-nav' } },
              }),
              ui.button('Reset card state', { onClick: { handler: 'resetCardState' }, variant: 'danger' }),
            ]),
            ui.row([
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
            ]),
          ]);
        },
        handlers: {
          setTitlePath({ dispatchCardAction }) {
            dispatchCardAction('set', {
              path: 'scratch.title',
              value: 'updated-via-set-path',
            });
          },
          togglePriority({ cardState, dispatchCardAction }) {
            const current = toText(asRecord(asRecord(cardState).scratch).priority, 'low');
            dispatchCardAction('set', {
              path: 'scratch.priority',
              value: current === 'low' ? 'high' : 'low',
            });
          },
          incrementVisitCount({ sessionState, dispatchSessionAction }) {
            const next = toNumber(asRecord(sessionState).visitCount, 1) + 1;
            dispatchSessionAction('set', { path: 'visitCount', value: next });
          },
          resetCardState({ dispatchCardAction }) {
            dispatchCardAction('reset');
            dispatchCardAction('patch', { scratch: { title: 'untitled', priority: 'low' } });
          },
          go(context, args) {
            const payload = asRecord(args);
            goTo(context, toText(payload.cardId, 'home'), payload.param);
          },
          back,
          home: goHome,
        },
      },

      playground: {
        render({ cardState, sessionState, globalState }) {
          const card = asRecord(cardState);
          const session = asRecord(sessionState);
          const nav = navState(globalState);
          const draftName = toText(card.draftName, 'sample-widget');
          const draftState = toText(card.draftState, 'ready');
          const rows = playgroundRows(card);
          const fontSelection = dropdownSelected(FONT_OPTIONS, card.selectedFont);
          const selectedCellIndex = toNumber(card.selectedCellIndex, 0);
          return ui.panel([
            ui.text('All Widgets Playground'),
            ui.text('Compose panel + row + column + text + badge + button + input + table + dropdown + selectableTable + gridBoard.'),
            ui.row([
              ui.badge('lastVisited: ' + toText(session.lastVisited, 'home')),
              ui.badge('nav.param: ' + toText(nav.param, '(none)')),
            ]),
            ui.column([
              ui.row([
                ui.text('Name:'),
                ui.input(draftName, {
                  placeholder: 'Widget name',
                  onChange: { handler: 'setDraftField', args: { field: 'draftName' } },
                }),
              ]),
              ui.row([
                ui.text('State:'),
                ui.input(draftState, {
                  placeholder: 'draft|ready|archived',
                  onChange: { handler: 'setDraftField', args: { field: 'draftState' } },
                }),
              ]),
            ]),
            ui.dropdown(FONT_OPTIONS, {
              selected: fontSelection.index,
              onSelect: { handler: 'setDraftField', args: { field: 'selectedFont' } },
            }),
            ui.row([
              ui.button('Add Row', { onClick: { handler: 'addRow' }, variant: 'primary' }),
              ui.button('Clear Rows', { onClick: { handler: 'clearRows' }, variant: 'danger' }),
              ui.button('Notify', { onClick: { handler: 'notify' } }),
            ]),
            ui.table(rows, { headers: ['Name', 'State'] }),
            ui.selectableTable(rows, {
              headers: ['Name', 'State'],
              selectedRowKeys: asArray(card.selectedRowKeys).map((key) => toText(key)),
              mode: 'multiple',
              rowKeyIndex: 0,
              onSelectionChange: { handler: 'setSelection' },
            }),
            ui.gridBoard({
              rows: 2,
              cols: 4,
              cells: GRID_CELLS.slice(0, 8),
              selectedIndex: selectedCellIndex,
              cellSize: 'small',
              onSelect: { handler: 'setGridSelection' },
            }),
            ui.row([
              ui.button('Back', { onClick: { handler: 'back' } }),
              ui.button('Home', { onClick: { handler: 'home' } }),
            ]),
          ]);
        },
        handlers: {
          setDraftField({ dispatchCardAction }, args) {
            const payload = asRecord(args);
            const field = toText(payload.field);
            if (!field) {
              return;
            }
            const nextValue = field === 'selectedFont' ? toNumber(payload.index, 0) : toText(payload.value);
            dispatchCardAction('set', {
              path: field,
              value: nextValue,
            });
          },
          addRow({ cardState, dispatchCardAction }) {
            const card = asRecord(cardState);
            const rows = playgroundRows(card);
            const nextRows = rows.concat([[toText(card.draftName, 'new-widget'), toText(card.draftState, 'draft')]]);
            dispatchCardAction('patch', { rows: nextRows });
          },
          clearRows({ dispatchCardAction }) {
            dispatchCardAction('patch', { rows: [] });
          },
          setSelection({ dispatchCardAction }, args) {
            dispatchCardAction('patch', {
              selectedRowKeys: asArray(asRecord(args).selectedRowKeys).map((key) => toText(key)),
            });
          },
          setGridSelection({ dispatchCardAction }, args) {
            dispatchCardAction('patch', {
              selectedCellIndex: toNumber(asRecord(args).cellIndex, 0),
            });
          },
          notify(context) {
            notify(context, 'Playground card emitted a notify intent.');
          },
          back,
          home: goHome,
        },
      },
    },
  };
});
