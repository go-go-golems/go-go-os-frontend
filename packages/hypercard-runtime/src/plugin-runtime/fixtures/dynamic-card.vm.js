({ ui }) => ({
  render({ state }) {
    return ui.panel([
      ui.text('Dynamic card: ' + String(state?.draft?.name ?? 'n/a')),
      ui.button('Back', { onClick: { handler: 'back' } }),
    ]);
  },
  handlers: {
    back({ dispatch }) {
      dispatch({ type: 'nav.back' });
    },
  },
})
