({ dispatch }) => {
  dispatch({ type: 'notify.show', payload: { level: 'info', message: 'patched-handler' } });
}
