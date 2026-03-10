defineStackBundle(({ ui }) => {
  return {
    id: 'report-demo',
    title: 'Report Demo',
    cards: {
      report: {
        render() {
          return ui.panel([
            ui.text('Monthly Report'),
            ui.table(
              [
                ['Gross Revenue', '$12,450.00'],
                ['Net Revenue', '$10,830.00'],
                ['Refunds', '$620.00'],
                ['Items in Stock', '156'],
                ['Low Stock Alerts', '3'],
                ['Out of Stock', '0'],
              ],
              { headers: ['Metric', 'Value'] }
            ),
            ui.button('📄 Export CSV', { onClick: { handler: 'notify' } }),
          ]);
        },
        handlers: {
          notify({ dispatch }) {
            dispatch({ type: 'notify.show', payload: { message: 'Export not available in demo' } });
          },
        },
      },
    },
  };
});
