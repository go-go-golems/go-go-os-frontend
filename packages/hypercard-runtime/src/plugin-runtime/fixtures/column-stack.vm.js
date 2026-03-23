defineRuntimeBundle(({ ui }) => {
  return {
    id: 'column-demo',
    title: 'Column Demo',
    packageIds: ["ui"],
    surfaces: {
      main: {
        packId: 'ui.card.v1',
        render() {
          return ui.column([
            ui.text('top'),
            ui.text('bottom'),
          ]);
        },
        handlers: {},
      },
    },
  };
});
