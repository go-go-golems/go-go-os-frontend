defineRuntimeBundle(({ ui }) => {
  return {
    id: 'inventory',
    title: 'Inventory',
    packageIds: ["ui"],
    initialSessionState: { filter: 'all' },
    initialSurfaceState: { lowStock: { limit: 5 } },
    surfaces: {
      lowStock: {
        packId: 'ui.card.v1',
        render({ state }) {
          return ui.panel([
            ui.text('Filter: ' + String(state?.filters?.filter ?? 'all')),
            ui.text('Limit: ' + String(state?.draft?.limit ?? 0)),
            ui.button('Reserve', { onClick: { handler: 'reserve', args: { sku: 'A-1' } } }),
          ]);
        },
        handlers: {
          reserve({ dispatch }, args) {
            dispatch({ type: 'draft.set', payload: { path: 'lastSku', value: args?.sku } });
            dispatch({ type: 'filters.set', payload: { path: 'filter', value: 'low-stock' } });
            dispatch({ type: 'inventory/reserve-item', payload: { sku: args?.sku } });
            dispatch({ type: 'notify.show', payload: { level: 'info', message: 'reserved' } });
          },
        },
      },
    },
  };
});
