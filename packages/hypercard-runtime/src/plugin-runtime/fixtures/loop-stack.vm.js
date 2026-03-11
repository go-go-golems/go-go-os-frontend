defineRuntimeBundle(({ ui }) => {
  return {
    id: 'loop',
    title: 'Loop',
    surfaces: {
      loop: {
        render() {
          while (true) {}
        },
        handlers: {},
      },
    },
  };
});
