defineRuntimeBundle(({ ui }) => {
  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  return {
    id: 'chat-demo',
    title: 'Chat Demo',
    packageIds: ["ui"],
    initialSurfaceState: {
      chat: {
        draft: '',
        messages: [
          'Hello! How can I help you today?',
          'Try asking about report export or low stock alerts.',
        ],
      },
    },
    surfaces: {
      chat: {
        packId: 'ui.card.v1',
        render({ state }) {
          const draftState = asRecord(state?.draft);
          const messages = Array.isArray(draftState.messages) ? draftState.messages : [];
          const draft = String(draftState.draft || '');

          return ui.panel([
            ui.text('Assistant'),
            ui.column(messages.map((message) => ui.text('• ' + String(message)))),
            ui.input(draft, { onChange: { handler: 'changeDraft' } }),
            ui.row([
              ui.button('Send', { onClick: { handler: 'send' } }),
              ui.button('Clear', { onClick: { handler: 'clear' } }),
            ]),
          ]);
        },
        handlers: {
          changeDraft({ dispatch }, args) {
            dispatch({ type: 'draft.set', payload: { path: 'draft', value: asRecord(args).value } });
          },
          send({ state, dispatch }) {
            const draftState = asRecord(state?.draft);
            const draft = String(draftState.draft || '').trim();
            if (!draft) return;
            const messages = Array.isArray(draftState.messages) ? draftState.messages : [];
            dispatch({
              type: 'draft.patch',
              payload: {
                draft: '',
                messages: messages.concat(['You: ' + draft, 'Assistant: Thanks, received.']).slice(-10),
              },
            });
          },
          clear({ dispatch }) {
            dispatch({ type: 'draft.patch', payload: { draft: '', messages: [] } });
          },
        },
      },
    },
  };
});
