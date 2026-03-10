({ widgets }) => ({
  render({ state }) {
    const board = state?.app_kanban ?? {};

    return widgets.kanban.board({
      columns: Array.isArray(board.columns) ? board.columns : [],
      tasks: Array.isArray(board.tasks) ? board.tasks : [],
      editingTask: board.editingTask ?? null,
      filterTag: board.filterTag ?? null,
      filterPriority: board.filterPriority ?? null,
      searchQuery: typeof board.searchQuery === 'string' ? board.searchQuery : '',
      collapsedCols:
        board.collapsedCols && typeof board.collapsedCols === 'object' && !Array.isArray(board.collapsedCols)
          ? board.collapsedCols
          : {},
      onMoveTask: { handler: 'moveTask' },
    });
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
