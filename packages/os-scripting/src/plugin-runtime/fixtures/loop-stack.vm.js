defineRuntimeBundle(({ ui }) => {
  return {
    id: 'loop',
    title: 'Loop',
    packageIds: ["ui"],
    surfaces: {
      loop: {
        packId: 'ui.card.v1',
        render() {
          while (true) {}
        },
        handlers: {},
      },
    },
  };
});
