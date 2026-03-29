export const UI_RUNTIME_DOCS_METADATA = {
  packId: 'ui.card.v1',
  docs: {
    files: [
      {
        package: {
          name: 'ui.card.v1',
          title: 'UI Runtime Surface Type',
          category: 'runtime-surface-type',
          version: '1',
          description: 'Structured UI runtime surface type for classic panel-and-table surfaces.',
          prose:
            'The ui.card.v1 runtime surface type exposes a small structured UI DSL for classic panel-and-table runtime surfaces. Surfaces compose ui.panel([...]) from smaller semantic primitives such as text, button, input, row, column, badge, table, dropdown, selectableTable, and gridBoard nodes. The VM remains responsible for semantic state selection and action dispatch. The host owns actual rendering and event plumbing.',
          source_file: 'packages/os-ui-cards/src/docsMetadata.ts',
        },
        symbols: [
          {
            name: 'ui.panel',
            summary: 'Compose the root container for a classic ui.card.v1 runtime surface.',
            prose:
              'Use ui.panel([...]) as the outer container for a runtime surface. Most surfaces return one panel with rows, buttons, tables, and badges inside.',
            tags: ['dsl', 'ui-card', 'layout'],
            source_file: 'packages/os-ui-cards/src/docsMetadata.ts',
          },
          {
            name: 'ui.row',
            summary: 'Lay out child widgets horizontally.',
            prose: 'Use ui.row([...]) for compact horizontal groups such as field label plus input or button bars.',
            tags: ['dsl', 'ui-card', 'layout'],
            source_file: 'packages/os-ui-cards/src/docsMetadata.ts',
          },
          {
            name: 'ui.column',
            summary: 'Lay out child widgets vertically.',
            prose: 'Use ui.column([...]) for stacked actions or narrow grouped controls.',
            tags: ['dsl', 'ui-card', 'layout'],
            source_file: 'packages/os-ui-cards/src/docsMetadata.ts',
          },
          {
            name: 'ui.text',
            summary: 'Render plain text content.',
            prose: 'Use ui.text(...) for headings, descriptions, and inline labels that do not need user interaction.',
            tags: ['dsl', 'ui-card', 'text'],
            source_file: 'packages/os-ui-cards/src/docsMetadata.ts',
          },
          {
            name: 'ui.button',
            summary: 'Render a button that emits a handler invocation when clicked.',
            prose:
              'Use ui.button(label, { onClick: { handler, args } }) to declare a semantic button action. The VM handler decides what runtime actions to dispatch.',
            tags: ['dsl', 'ui-card', 'actions'],
            source_file: 'packages/os-ui-cards/src/docsMetadata.ts',
          },
          {
            name: 'ui.input',
            summary: 'Render a text input with a semantic change handler.',
            prose:
              'Use ui.input(value, { onChange: { handler, args } }) to bind text entry to a surface handler. The host feeds the changed value back through args.value.',
            tags: ['dsl', 'ui-card', 'forms'],
            source_file: 'packages/os-ui-cards/src/docsMetadata.ts',
          },
          {
            name: 'ui.table',
            summary: 'Render a read-only table with headers and rows.',
            prose:
              'Use ui.table(rows, { headers }) for compact grid views such as listings, sales logs, and report metrics.',
            tags: ['dsl', 'ui-card', 'data'],
            source_file: 'packages/os-ui-cards/src/docsMetadata.ts',
          },
          {
            name: 'ui.badge',
            summary: 'Render a small status badge.',
            prose:
              'Use ui.badge(text) for lightweight status summaries such as totals, success messages, and empty-state markers.',
            tags: ['dsl', 'ui-card', 'status'],
            source_file: 'packages/os-ui-cards/src/docsMetadata.ts',
          },
          {
            name: 'ui.dropdown',
            summary: 'Render a select-style menu with semantic onSelect wiring.',
            prose:
              'Use ui.dropdown(options, { selected, onSelect }) when the surface needs one compact single-select control whose result should flow back as index and value.',
            tags: ['dsl', 'ui-card', 'forms'],
            source_file: 'packages/os-ui-cards/src/docsMetadata.ts',
          },
          {
            name: 'ui.selectableTable',
            summary: 'Render a selectable data table with optional search.',
            prose:
              'Use ui.selectableTable(rows, {...}) when the host should manage row selection, search text, and row click interactions while the VM continues to own semantic handler routing.',
            tags: ['dsl', 'ui-card', 'data'],
            source_file: 'packages/os-ui-cards/src/docsMetadata.ts',
          },
          {
            name: 'ui.gridBoard',
            summary: 'Render a grid of selectable cells for compact spatial interactions.',
            prose:
              'Use ui.gridBoard({...}) for puzzle boards, tile pickers, and other compact spatial surfaces where the host should own focus and cell-hit behavior.',
            tags: ['dsl', 'ui-card', 'board'],
            source_file: 'packages/os-ui-cards/src/docsMetadata.ts',
          },
        ],
        file_path: 'packages/os-ui-cards/src/docsMetadata.ts',
      },
    ],
  },
} as const;
