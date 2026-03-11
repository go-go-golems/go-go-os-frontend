defineRuntimeBundle(({ ui }) => {
  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toText(value, fallback = '') {
    if (value === null || value === undefined) return fallback;
    return String(value);
  }

  function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function draftState(state) {
    return asRecord(asRecord(state).draft);
  }

  function selectBooks(state) {
    return asArray(asRecord(asRecord(state).books).items);
  }

  function navParam(state) {
    const param = asRecord(asRecord(state).nav).param;
    return typeof param === 'string' ? param : '';
  }

  function findBook(state, id) {
    const target = toText(id).toLowerCase();
    return selectBooks(state).find((book) => toText(asRecord(book).id).toLowerCase() === target) || null;
  }

  function statusLabel(status) {
    const value = toText(status);
    if (value === 'read') return '✅ read';
    if (value === 'reading') return '🔥 reading';
    return '◻️ to-read';
  }

  function rows(items) {
    return items.map((book) => {
      const row = asRecord(book);
      return [toText(row.id), toText(row.title), toText(row.author), statusLabel(row.status), String(toNumber(row.rating, 0))];
    });
  }

  function readingNow(state) {
    return selectBooks(state).filter((book) => toText(asRecord(book).status) === 'reading');
  }

  function reportRows(state) {
    const items = selectBooks(state);
    const total = items.length;
    const toRead = items.filter((book) => toText(asRecord(book).status) === 'to-read').length;
    const reading = items.filter((book) => toText(asRecord(book).status) === 'reading').length;
    const read = items.filter((book) => toText(asRecord(book).status) === 'read').length;
    const avgRating = total ? (items.reduce((sum, book) => sum + toNumber(asRecord(book).rating, 0), 0) / total).toFixed(1) : '0.0';

    return [
      ['Total Books', String(total)],
      ['To Read', String(toRead)],
      ['Reading', String(reading)],
      ['Read', String(read)],
      ['Average Rating', avgRating],
    ];
  }

  function quickOpen(items) {
    return items.slice(0, 10).map((book) => {
      const row = asRecord(book);
      const id = toText(row.id);
      const label = toText(row.title, id);
      return ui.button('Open ' + label, { onClick: { handler: 'openBook', args: { id } } });
    });
  }

  function dispatchDomain(context, actionType, payload) {
    context.dispatch({ type: 'books/' + actionType, payload });
  }

  function patchDraft(context, payload) {
    context.dispatch({ type: 'draft.patch', payload });
  }

  function setDraft(context, path, value) {
    context.dispatch({ type: 'draft.set', payload: { path, value } });
  }

  function navigate(context, cardId, param) {
    context.dispatch({
      type: 'nav.go',
      payload: param ? { cardId: String(cardId), param: String(param) } : { cardId: String(cardId) },
    });
  }

  function goBack(context) {
    context.dispatch({ type: 'nav.back' });
  }

  return {
    id: 'bookTracker',
    title: 'Book Tracker',
    initialSurfaceState: {
      bookDetail: { edits: {} },
      addBook: {
        formValues: { title: '', author: '', status: 'to-read', rating: 0 },
        submitResult: '',
      },
    },
    surfaces: {
      home: {
        render() {
          return ui.panel([
            ui.text('Book Tracker'),
            ui.button('📋 Browse Books', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
            ui.button('🔥 Reading Now', { onClick: { handler: 'go', args: { cardId: 'readingNow' } } }),
            ui.button('📊 Reading Report', { onClick: { handler: 'go', args: { cardId: 'readingReport' } } }),
            ui.button('➕ Add Book', { onClick: { handler: 'go', args: { cardId: 'addBook' } } }),
            ui.row([
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('♻️ Reset Demo Data', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, asRecord(args).cardId || 'home');
          },
          markAllRead(context) {
            dispatchDomain(context, 'markAllRead');
          },
          resetDemo(context) {
            dispatchDomain(context, 'resetDemo');
          },
        },
      },

      browse: {
        render({ state }) {
          const items = selectBooks(state);
          return ui.panel([
            ui.text('Browse Books (' + items.length + ')'),
            ui.table(rows(items), { headers: ['ID', 'Title', 'Author', 'Status', 'Rating'] }),
            ui.column(quickOpen(items)),
            ui.row([
              ui.button('➕ Add', { onClick: { handler: 'go', args: { cardId: 'addBook' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('♻️ Reset', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, asRecord(args).cardId || 'home');
          },
          openBook(context, args) {
            navigate(context, 'bookDetail', asRecord(args).id);
          },
          markAllRead(context) {
            dispatchDomain(context, 'markAllRead');
          },
          resetDemo(context) {
            dispatchDomain(context, 'resetDemo');
          },
        },
      },

      readingNow: {
        render({ state }) {
          const items = readingNow(state);
          return ui.panel([
            ui.text('Reading Now (' + items.length + ')'),
            ui.table(rows(items), { headers: ['ID', 'Title', 'Author', 'Status', 'Rating'] }),
            ui.column(quickOpen(items)),
            ui.row([
              ui.button('📋 Browse All', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, asRecord(args).cardId || 'home');
          },
          openBook(context, args) {
            navigate(context, 'bookDetail', asRecord(args).id);
          },
          markAllRead(context) {
            dispatchDomain(context, 'markAllRead');
          },
        },
      },

      bookDetail: {
        render({ state }) {
          const draft = draftState(state);
          const edits = asRecord(draft.edits);
          const id = navParam(state);
          const record = findBook(state, id);

          if (!record) {
            return ui.panel([
              ui.text('Book not found: ' + toText(id, '(none)')),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]);
          }

          const current = { ...asRecord(record), ...edits };

          return ui.panel([
            ui.text('Book Detail: ' + toText(current.title, id)),
            ui.row([
              ui.text('Title:'),
              ui.input(toText(current.title), { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Author:'),
              ui.input(toText(current.author), { onChange: { handler: 'change', args: { field: 'author' } } }),
            ]),
            ui.row([
              ui.text('Status:'),
              ui.input(toText(current.status), { onChange: { handler: 'change', args: { field: 'status' } } }),
            ]),
            ui.row([
              ui.text('Rating:'),
              ui.input(toText(current.rating), { onChange: { handler: 'change', args: { field: 'rating' } } }),
            ]),
            ui.row([
              ui.button('✏️ Save', { onClick: { handler: 'save' } }),
              ui.button('📖 Mark Reading', { onClick: { handler: 'setStatus', args: { status: 'reading' } } }),
              ui.button('✅ Mark Read', { onClick: { handler: 'setStatus', args: { status: 'read' } } }),
            ]),
            ui.row([
              ui.button('🗑 Delete', { onClick: { handler: 'remove' } }),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]),
          ]);
        },
        handlers: {
          back(context) {
            goBack(context);
          },
          change(context, args) {
            const payload = asRecord(args);
            const field = String(payload.field || '');
            if (!field) return;
            setDraft(context, 'edits.' + field, payload.value);
          },
          save(context) {
            const id = navParam(context.state);
            if (!id) return;
            const edits = { ...asRecord(draftState(context.state).edits) };
            if (edits.rating !== undefined) {
              edits.rating = toNumber(edits.rating, 0);
            }
            dispatchDomain(context, 'saveBook', { id, edits });
            patchDraft(context, { edits: {} });
          },
          setStatus(context, args) {
            const id = navParam(context.state);
            if (!id) return;
            const status = toText(asRecord(args).status);
            if (!status) return;
            dispatchDomain(context, 'setStatus', { id, status });
            patchDraft(context, { edits: {} });
          },
          remove(context) {
            const id = navParam(context.state);
            if (!id) return;
            dispatchDomain(context, 'deleteBook', { id });
            goBack(context);
          },
        },
      },

      addBook: {
        render({ state }) {
          const draft = draftState(state);
          const form = asRecord(draft.formValues);
          const submitResult = toText(draft.submitResult);

          return ui.panel([
            ui.text('Add Book'),
            ui.row([
              ui.text('Title:'),
              ui.input(toText(form.title), { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Author:'),
              ui.input(toText(form.author), { onChange: { handler: 'change', args: { field: 'author' } } }),
            ]),
            ui.row([
              ui.text('Status:'),
              ui.input(toText(form.status, 'to-read'), { onChange: { handler: 'change', args: { field: 'status' } } }),
            ]),
            ui.row([
              ui.text('Rating:'),
              ui.input(toText(form.rating, '0'), { onChange: { handler: 'change', args: { field: 'rating' } } }),
            ]),
            submitResult ? ui.badge(submitResult) : ui.text(''),
            ui.row([
              ui.button('📚 Add Book', { onClick: { handler: 'submit' } }),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]),
          ]);
        },
        handlers: {
          back(context) {
            goBack(context);
          },
          change(context, args) {
            const payload = asRecord(args);
            const field = String(payload.field || '');
            if (!field) return;
            setDraft(context, 'formValues.' + field, payload.value);
          },
          submit(context) {
            const values = asRecord(draftState(context.state).formValues);
            const title = toText(values.title).trim();
            const author = toText(values.author).trim();
            if (!title || !author) {
              patchDraft(context, { submitResult: '❌ Title and Author are required' });
              return;
            }

            dispatchDomain(context, 'createBook', {
              title,
              author,
              status: toText(values.status, 'to-read'),
              rating: toNumber(values.rating, 0),
            });

            patchDraft(context, {
              submitResult: '✅ Book added',
              formValues: { title: '', author: '', status: 'to-read', rating: 0 },
            });
          },
        },
      },

      readingReport: {
        render({ state }) {
          return ui.panel([
            ui.text('Reading Report'),
            ui.table(reportRows(state), { headers: ['Metric', 'Value'] }),
            ui.row([
              ui.button('📋 Browse', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('♻️ Reset Demo', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, asRecord(args).cardId || 'home');
          },
          markAllRead(context) {
            dispatchDomain(context, 'markAllRead');
          },
          resetDemo(context) {
            dispatchDomain(context, 'resetDemo');
          },
        },
      },
    },
  };
});
