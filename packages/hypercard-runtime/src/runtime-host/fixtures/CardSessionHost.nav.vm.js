defineRuntimeBundle(({ ui }) => {
  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function navParam(state) {
    const param = asRecord(asRecord(state).nav).param;
    return typeof param === 'string' ? param : '';
  }

  function item(id) {
    const records = {
      'widget-a': {
        name: 'Widget A',
        sku: 'W-1001',
        category: 'Widgets',
        price: '$12.00',
        stock: '45 units',
        supplier: 'Acme Corp',
        lastRestock: 'Feb 10, 2026',
      },
      'widget-b': {
        name: 'Widget B',
        sku: 'W-1002',
        category: 'Widgets',
        price: '$15.00',
        stock: '12 units',
        supplier: 'Acme Corp',
        lastRestock: 'Feb 12, 2026',
      },
      'widget-c': {
        name: 'Widget C',
        sku: 'W-1003',
        category: 'Widgets',
        price: '$19.00',
        stock: '9 units',
        supplier: 'Globex',
        lastRestock: 'Feb 14, 2026',
      },
    };
    return records[id] || records['widget-a'];
  }

  return {
    id: 'nav-demo',
    title: 'Nav Demo',
    surfaces: {
      list: {
        render() {
          return ui.panel([
            ui.text('Items'),
            ui.button('🔍 View Widget A', { onClick: { handler: 'go', args: { cardId: 'detail', param: 'widget-a' } } }),
            ui.button('🔍 View Widget B', { onClick: { handler: 'go', args: { cardId: 'detail', param: 'widget-b' } } }),
            ui.button('🔍 View Widget C', { onClick: { handler: 'go', args: { cardId: 'detail', param: 'widget-c' } } }),
          ]);
        },
        handlers: {
          go({ dispatch }, args) {
            const payload = asRecord(args);
            dispatch({ type: 'nav.go', payload: { cardId: String(payload.cardId || 'list'), param: String(payload.param || '') } });
          },
        },
      },
      detail: {
        render({ state }) {
          const current = item(navParam(state));
          return ui.panel([
            ui.text('Item Detail'),
            ui.table(
              [
                ['Name', current.name],
                ['SKU', current.sku],
                ['Category', current.category],
                ['Price', current.price],
                ['Stock', current.stock],
                ['Supplier', current.supplier],
                ['Last Restock', current.lastRestock],
              ],
              { headers: ['Field', 'Value'] }
            ),
            ui.row([
              ui.button('← Back', { onClick: { handler: 'back' } }),
              ui.button('🛒 Reorder', { onClick: { handler: 'notify', args: { message: 'Reorder placed' } } }),
            ]),
          ]);
        },
        handlers: {
          back({ dispatch }) {
            dispatch({ type: 'nav.back' });
          },
          notify({ dispatch }, args) {
            dispatch({ type: 'notify.show', payload: { message: String(asRecord(args).message || '') } });
          },
        },
      },
    },
  };
});
