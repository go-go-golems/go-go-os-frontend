({ state }) =>
  ui.panel([
    ui.text('Patched limit: ' + String(state?.draft?.limit ?? 0)),
    ui.button('Reserve', { onClick: { handler: 'reserve', args: { sku: 'A-1' } } }),
  ])
