// @ts-check
/// <reference path="./pluginBundle.authoring.d.ts" />
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
    if (!target) return null;
    return selectBooks(state).find((book) => toText(asRecord(book).id).toLowerCase() === target) || null;
  }

  function statusLabel(status) {
    const v = toText(status);
    if (v === 'read') return '✅ read';
    if (v === 'reading') return '🔥 reading';
    return '◻️ to-read';
  }

  function progressLabel(status) {
    const v = toText(status);
    if (v === 'read') return 'Finished';
    if (v === 'reading') return 'In Progress';
    return 'Queued';
  }

  function reportRows(state) {
    const items = selectBooks(state);
    const total = items.length;
    const toRead = items.filter((book) => toText(asRecord(book).status) === 'to-read').length;
    const reading = items.filter((book) => toText(asRecord(book).status) === 'reading').length;
    const read = items.filter((book) => toText(asRecord(book).status) === 'read').length;
    const avgRating =
      total === 0
        ? '0.0'
        : (
            items.reduce((sum, book) => sum + toNumber(asRecord(book).rating, 0), 0) /
            total
          ).toFixed(1);

    return [
      ['Total Books', String(total)],
      ['To Read', String(toRead)],
      ['Reading', String(reading)],
      ['Read', String(read)],
      ['Average Rating', avgRating],
    ];
  }

  function booksRows(items) {
    return items.map((book) => {
      const row = asRecord(book);
      return [
        toText(row.id),
        toText(row.title),
        toText(row.author),
        statusLabel(row.status),
        String(toNumber(row.rating, 0)),
      ];
    });
  }

  function readingNow(state) {
    return selectBooks(state).filter((book) => toText(asRecord(book).status) === 'reading');
  }

  function withDraftState(state) {
    const draft = draftState(state);
    return {
      edits: asRecord(draft.edits),
      formValues: asRecord(draft.formValues),
      submitResult: toText(draft.submitResult),
    };
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

  function navigate(context, surfaceId, param) {
    const payload = param ? { surfaceId, param: toText(param) } : { surfaceId };
    context.dispatch({ type: 'nav.go', payload });
  }

  function goBack(context) {
    context.dispatch({ type: 'nav.back' });
  }

  function notify(context, message) {
    context.dispatch({ type: 'notify.show', payload: { message: toText(message) } });
  }

  function quickOpenButtons(items) {
    return items.slice(0, 10).map((book) => {
      const row = asRecord(book);
      const id = toText(row.id);
      const title = toText(row.title, id);
      return ui.button('Open ' + title, { onClick: { handler: 'openBook', args: { id } } });
    });
  }

  return {
    id: 'bookTrackerDebug',
    title: 'Book Tracker',
    packageIds: ["ui"],
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
            ui.text('Plugin runtime'),
            ui.button('📋 Browse Books', { onClick: { handler: 'go', args: { surfaceId: 'browse' } } }),
            ui.button('🔥 Reading Now', { onClick: { handler: 'go', args: { surfaceId: 'readingNow' } } }),
            ui.button('📊 Reading Report', { onClick: { handler: 'go', args: { surfaceId: 'readingReport' } } }),
            ui.button('➕ Add Book', { onClick: { handler: 'go', args: { surfaceId: 'addBook' } } }),
            ui.row([
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('🔄 Reset Demo Data', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).surfaceId, 'home'));
          },
          markAllRead(context) {
            dispatchDomain(context, 'markAllRead');
            notify(context, 'All books marked read');
          },
          resetDemo(context) {
            dispatchDomain(context, 'resetDemo');
            notify(context, 'Book demo data reset');
          },
        },
      },

      browse: {
        render({ state }) {
          const items = selectBooks(state);
          return ui.panel([
            ui.text('Browse Books (' + items.length + ')'),
            ui.table(booksRows(items), {
              headers: ['ID', 'Title', 'Author', 'Status', 'Rating'],
            }),
            items.length ? ui.text('Quick open:') : ui.badge('No books found.'),
            ui.column(quickOpenButtons(items)),
            ui.row([
              ui.button('➕ Add', { onClick: { handler: 'go', args: { surfaceId: 'addBook' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('🔄 Reset', { onClick: { handler: 'resetDemo' } }),
              ui.button('🏠 Home', { onClick: { handler: 'go', args: { surfaceId: 'home' } } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).surfaceId, 'home'));
          },
          openBook(context, args) {
            navigate(context, 'bookDetail', toText(asRecord(args).id));
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
            ui.table(booksRows(items), {
              headers: ['ID', 'Title', 'Author', 'Status', 'Rating'],
            }),
            items.length ? ui.text('Quick open:') : ui.badge('No active reading books right now.'),
            ui.column(quickOpenButtons(items)),
            ui.row([
              ui.button('📋 Browse All', { onClick: { handler: 'go', args: { surfaceId: 'browse' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).surfaceId, 'home'));
          },
          openBook(context, args) {
            navigate(context, 'bookDetail', toText(asRecord(args).id));
          },
          markAllRead(context) {
            dispatchDomain(context, 'markAllRead');
          },
        },
      },

      bookDetail: {
        render({ state }) {
          const id = navParam(state);
          const record = findBook(state, id);
          if (!record) {
            return ui.panel([
              ui.text('Book not found: ' + toText(id, '(none)')),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]);
          }

          const draft = withDraftState(state);
          const current = { ...asRecord(record), ...draft.edits };

          return ui.panel([
            ui.text('Book Detail: ' + toText(current.title, id)),
            ui.text('Progress: ' + progressLabel(current.status)),
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
              ui.button('💾 Save', { onClick: { handler: 'save' } }),
              ui.button('🔥 Mark Reading', { onClick: { handler: 'setStatus', args: { status: 'reading' } } }),
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
            const field = toText(asRecord(args).field);
            if (!field) return;
            setDraft(context, 'edits.' + field, asRecord(args).value);
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
            notify(context, 'Saved book ' + id);
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
            notify(context, 'Deleted book ' + id);
            goBack(context);
          },
        },
      },

      addBook: {
        render({ state }) {
          const draft = withDraftState(state);
          const form = {
            title: toText(draft.formValues.title),
            author: toText(draft.formValues.author),
            status: toText(draft.formValues.status, 'to-read'),
            rating: toText(draft.formValues.rating, '0'),
          };

          return ui.panel([
            ui.text('Add Book'),
            ui.row([
              ui.text('Title:'),
              ui.input(form.title, { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Author:'),
              ui.input(form.author, { onChange: { handler: 'change', args: { field: 'author' } } }),
            ]),
            ui.row([
              ui.text('Status:'),
              ui.input(form.status, { onChange: { handler: 'change', args: { field: 'status' } } }),
            ]),
            ui.row([
              ui.text('Rating:'),
              ui.input(form.rating, { onChange: { handler: 'change', args: { field: 'rating' } } }),
            ]),
            draft.submitResult ? ui.badge(draft.submitResult) : ui.text(''),
            ui.row([
              ui.button('Add Book', { onClick: { handler: 'submit' } }),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]),
          ]);
        },
        handlers: {
          back(context) {
            goBack(context);
          },
          change(context, args) {
            const field = toText(asRecord(args).field);
            if (!field) return;
            setDraft(context, 'formValues.' + field, asRecord(args).value);
          },
          submit(context) {
            const values = asRecord(draftState(context.state).formValues);
            const title = toText(values.title).trim();
            const author = toText(values.author).trim();
            if (!title || !author) {
              patchDraft(context, { submitResult: 'Title and Author are required' });
              return;
            }

            dispatchDomain(context, 'createBook', {
              title,
              author,
              status: toText(values.status, 'to-read'),
              rating: toNumber(values.rating, 0),
            });

            patchDraft(context, {
              submitResult: 'Book added',
              formValues: { title: '', author: '', status: 'to-read', rating: 0 },
            });
            notify(context, 'Book added: ' + title);
          },
        },
      },

      readingReport: {
        render({ state }) {
          return ui.panel([
            ui.text('Reading Report'),
            ui.table(reportRows(state), { headers: ['Metric', 'Value'] }),
            ui.row([
              ui.button('📋 Browse', { onClick: { handler: 'go', args: { surfaceId: 'browse' } } }),
              ui.button('✅ Mark All Read', { onClick: { handler: 'markAllRead' } }),
              ui.button('🔄 Reset Demo', { onClick: { handler: 'resetDemo' } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).surfaceId, 'home'));
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
