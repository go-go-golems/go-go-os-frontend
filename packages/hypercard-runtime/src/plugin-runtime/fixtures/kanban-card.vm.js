({ widgets }) => ({
  render({ state }) {
    const board = state?.app_kanban ?? {};

    return widgets.kanban.page(
      widgets.kanban.taxonomy({
        issueTypes: Array.isArray(board.taxonomy?.issueTypes) ? board.taxonomy.issueTypes : [{ id: 'feature', label: 'Feature', icon: '✨' }],
        priorities: Array.isArray(board.taxonomy?.priorities) ? board.taxonomy.priorities : [{ id: 'high', label: 'High', icon: '▲' }],
        labels: Array.isArray(board.taxonomy?.labels) ? board.taxonomy.labels : [{ id: 'frontend', label: 'Frontend', icon: '🖼️' }],
      }),
      widgets.kanban.header({
        title: 'Sprint Board',
        subtitle: 'Fixture board',
        searchQuery: typeof board.searchQuery === 'string' ? board.searchQuery : '',
      }),
      widgets.kanban.highlights({
        items: [
          {
            id: 'total',
            label: 'Total',
            value: Array.isArray(board.tasks) ? board.tasks.length : 0,
            tone: 'accent',
          },
        ],
      }),
      widgets.kanban.filters({
        filterType: board.filterType ?? null,
        filterPriority: board.filterPriority ?? null,
      }),
      widgets.kanban.board({
        columns: Array.isArray(board.columns) ? board.columns : [],
        tasks: Array.isArray(board.tasks) ? board.tasks : [],
        editingTask: board.editingTask ?? null,
        collapsedCols:
          board.collapsedCols && typeof board.collapsedCols === 'object' && !Array.isArray(board.collapsedCols)
            ? board.collapsedCols
            : {},
        onMoveTask: { handler: 'moveTask' },
      }),
      widgets.kanban.status({
        metrics: [
          { label: 'total', value: Array.isArray(board.tasks) ? board.tasks.length : 0 },
        ],
      }),
    );
  },
  handlers: {
    moveTask({ dispatch }, args) {
      dispatch({
        type: 'kanban/move-task',
        payload: args,
      });
    },
  },
})
