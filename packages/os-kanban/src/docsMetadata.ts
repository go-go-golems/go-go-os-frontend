export const KANBAN_RUNTIME_DOCS_METADATA = {
  packId: 'kanban.v1',
  docs: {
    files: [
      {
        package: {
          name: 'kanban.v1',
          title: 'Kanban Runtime Surface Type',
          category: 'runtime-surface-type',
          version: '1',
          description: 'Structured Kanban shell runtime surface type for HyperCard-authored surfaces.',
          prose:
            'The Kanban runtime surface type exposes a compositional page contract. A runtime surface composes widgets.kanban.page(...) from smaller semantic widgets such as taxonomy, header, optional highlights, optional filters, board, and optional status nodes. The VM remains responsible for semantic state and handler wiring. The host remains responsible for rendering, drag/drop behavior, and modal UI.',
          source_file: 'packages/os-kanban/src/docsMetadata.ts',
        },
        symbols: [
          {
            name: 'widgets.kanban.page',
            summary: 'Compose the root page for a Kanban runtime tree.',
            prose:
              'Use widgets.kanban.page(...) as the root return value from a kanban.v1 runtime surface render function. Pass child nodes in a component-like style: taxonomy, header, optional highlights, optional filters, board, and optional status nodes.',
            tags: ['dsl', 'kanban', 'runtime-surface-type'],
            source_file: 'packages/os-kanban/src/docsMetadata.ts',
          },
          {
            name: 'widgets.kanban.taxonomy',
            summary: 'Describe the available issue types, priorities, and labels for a Kanban shell.',
            prose:
              'Use widgets.kanban.taxonomy({...}) to register descriptor-driven issue systems. This replaces hardcoded bug, feature, or tag enumerations with semantic descriptors owned by the runtime surface.',
            tags: ['dsl', 'kanban', 'taxonomy'],
            source_file: 'packages/os-kanban/src/docsMetadata.ts',
          },
          {
            name: 'widgets.kanban.header',
            summary: 'Describe the shell header with title, subtitle, search state, and primary action wiring.',
            prose:
              'Use widgets.kanban.header({...}) to configure page title text, search query, and the primary action button. Typical surfaces wire the primary action back to openTaskEditor or another semantic handler.',
            tags: ['dsl', 'kanban', 'shell'],
            source_file: 'packages/os-kanban/src/docsMetadata.ts',
          },
          {
            name: 'widgets.kanban.highlights',
            summary: 'Describe a row of summary cards with metrics, captions, progress, or sparklines.',
            prose:
              'Use widgets.kanban.highlights({...}) to render summary cards above the board. This is the main mechanism for making Kanban pages feel different without escaping the semantic DSL.',
            tags: ['dsl', 'kanban', 'summary'],
            source_file: 'packages/os-kanban/src/docsMetadata.ts',
          },
          {
            name: 'widgets.kanban.filters',
            summary: 'Describe the optional filter bar for issue-type and priority filtering.',
            prose:
              'Use widgets.kanban.filters({...}) when the board should expose issue-type and priority filters. If the surface omits this node, the host page will not render the filter bar.',
            tags: ['dsl', 'kanban', 'filters'],
            source_file: 'packages/os-kanban/src/docsMetadata.ts',
          },
          {
            name: 'widgets.kanban.board',
            summary: 'Describe the core board state, task list, lane list, editing state, and event bindings.',
            prose:
              'Use widgets.kanban.board({...}) to provide columns, tasks, collapsed state, editing state, and board interaction handlers. This node is semantic data, not a host component escape hatch.',
            tags: ['dsl', 'kanban', 'board'],
            source_file: 'packages/os-kanban/src/docsMetadata.ts',
          },
          {
            name: 'widgets.kanban.status',
            summary: 'Describe optional footer metrics for the shell.',
            prose:
              'Use widgets.kanban.status({...}) when the page should render explicit footer metrics. Surfaces may omit this node entirely or provide custom metrics that match their own domain vocabulary.',
            tags: ['dsl', 'kanban', 'status'],
            source_file: 'packages/os-kanban/src/docsMetadata.ts',
          },
        ],
        file_path: 'packages/os-kanban/src/docsMetadata.ts',
      },
    ],
  },
} as const;
