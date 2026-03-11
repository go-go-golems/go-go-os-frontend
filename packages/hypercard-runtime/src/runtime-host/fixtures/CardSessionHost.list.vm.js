defineRuntimeBundle(({ ui }) => {
  const ITEMS = [
    ['W-1001', 'Widget A', 'Widgets', '$12.00', '45'],
    ['G-2001', 'Gadget B', 'Gadgets', '$25.50', '38'],
    ['P-3001', 'Doohickey C', 'Parts', '$8.75', '73'],
    ['W-1002', 'Widget D', 'Widgets', '$15.00', '12'],
    ['G-2002', 'Gizmo E', 'Gadgets', '$42.00', '5'],
    ['P-3002', 'Thingamajig F', 'Parts', '$3.25', '120'],
  ];

  return {
    id: 'list-demo',
    title: 'List Demo',
    surfaces: {
      browse: {
        render() {
          return ui.panel([
            ui.text('Browse Items'),
            ui.table(ITEMS, { headers: ['SKU', 'Name', 'Category', 'Price', 'Qty'] }),
            ui.text('Use Desktop Shell stories for richer interactions.'),
          ]);
        },
        handlers: {},
      },
    },
  };
});
