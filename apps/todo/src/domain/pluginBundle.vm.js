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

  function draftState(state) {
    return asRecord(asRecord(state).draft);
  }

  function filtersState(state) {
    return asRecord(asRecord(state).filters);
  }

  function selectTasks(state) {
    return asArray(asRecord(asRecord(state).tasks).tasks);
  }

  function navParam(state) {
    const param = asRecord(asRecord(state).nav).param;
    return typeof param === 'string' ? param : '';
  }

  function statusLabel(status) {
    const v = toText(status);
    if (v === 'done') return '✅ done';
    if (v === 'doing') return '🔥 doing';
    return '◻️ todo';
  }

  function priorityLabel(priority) {
    const v = toText(priority);
    if (v === 'high') return '🔴 high';
    if (v === 'medium') return '🟡 medium';
    return '🟢 low';
  }

  function taskRows(items) {
    return items.map((task) => {
      const row = asRecord(task);
      return [
        toText(row.id),
        toText(row.title),
        statusLabel(row.status),
        priorityLabel(row.priority),
        toText(row.due, '—'),
      ];
    });
  }

  function findTask(state, id) {
    const target = toText(id).toLowerCase();
    return selectTasks(state).find((task) => toText(asRecord(task).id).toLowerCase() === target) || null;
  }

  function withDraftState(state) {
    const draft = draftState(state);
    return {
      edits: asRecord(draft.edits),
      form: asRecord(draft.form),
      submitResult: toText(draft.submitResult),
    };
  }

  function dispatchDomain(context, actionType, payload) {
    context.dispatch({ type: 'tasks/' + actionType, payload });
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

  function renderTaskList(title, items, emptyMessage) {
    const quickOpen = items.slice(0, 10).map((task) => {
      const row = asRecord(task);
      const id = toText(row.id);
      return ui.button('Open ' + id, { onClick: { handler: 'openTask', args: { id } } });
    });

    return ui.panel([
      ui.text(title),
      ui.table(taskRows(items), { headers: ['ID', 'Title', 'Status', 'Priority', 'Due'] }),
      items.length === 0 ? ui.badge(emptyMessage) : ui.text('Quick open:'),
      ui.column(quickOpen),
      ui.row([
        ui.button('➕ New Task', { onClick: { handler: 'go', args: { surfaceId: 'newTask' } } }),
        ui.button('🏠 Home', { onClick: { handler: 'go', args: { surfaceId: 'home' } } }),
      ]),
    ]);
  }

  return {
    id: 'todo',
    title: 'My Tasks',
    packageIds: ["ui"],
    initialSessionState: {
      defaultPriority: 'medium',
    },
    initialSurfaceState: {
      taskDetail: { edits: {} },
      newTask: { form: { title: '', priority: 'medium', due: '' }, submitResult: '' },
    },
    surfaces: {
      home: {
        render() {
          return ui.panel([
            ui.text('My Tasks'),
            ui.text('Plugin DSL runtime'),
            ui.button('📋 All Tasks', { onClick: { handler: 'go', args: { surfaceId: 'browse' } } }),
            ui.button('🔥 In Progress', { onClick: { handler: 'go', args: { surfaceId: 'inProgress' } } }),
            ui.button('✅ Completed', { onClick: { handler: 'go', args: { surfaceId: 'completed' } } }),
            ui.button('➕ New Task', { onClick: { handler: 'go', args: { surfaceId: 'newTask' } } }),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).surfaceId, 'home'));
          },
        },
      },

      browse: {
        render({ state }) {
          return renderTaskList('All Tasks', selectTasks(state), 'No tasks yet.');
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).surfaceId, 'home'));
          },
          openTask(context, args) {
            navigate(context, 'taskDetail', toText(asRecord(args).id));
          },
        },
      },

      inProgress: {
        render({ state }) {
          const tasks = selectTasks(state).filter((task) => toText(asRecord(task).status) === 'doing');
          return renderTaskList('In Progress', tasks, 'Nothing in progress — pick something up! 💪');
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).surfaceId, 'home'));
          },
          openTask(context, args) {
            navigate(context, 'taskDetail', toText(asRecord(args).id));
          },
        },
      },

      completed: {
        render({ state }) {
          const tasks = selectTasks(state).filter((task) => toText(asRecord(task).status) === 'done');
          return renderTaskList('Completed', tasks, 'No completed tasks yet. Get to work! 🚀');
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).surfaceId, 'home'));
          },
          openTask(context, args) {
            navigate(context, 'taskDetail', toText(asRecord(args).id));
          },
        },
      },

      taskDetail: {
        render({ state }) {
          const id = navParam(state);
          const task = findTask(state, id);
          if (!task) {
            return ui.panel([
              ui.text('Task not found: ' + toText(id, '(none)')),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]);
          }

          const draft = withDraftState(state);
          const current = { ...asRecord(task), ...draft.edits };

          return ui.panel([
            ui.text('Task Detail: ' + toText(current.id)),
            ui.row([
              ui.text('Title:'),
              ui.input(toText(current.title), { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Status:'),
              ui.input(toText(current.status), { onChange: { handler: 'change', args: { field: 'status' } } }),
            ]),
            ui.row([
              ui.text('Priority:'),
              ui.input(toText(current.priority), { onChange: { handler: 'change', args: { field: 'priority' } } }),
            ]),
            ui.row([
              ui.text('Due:'),
              ui.input(toText(current.due), { onChange: { handler: 'change', args: { field: 'due' } } }),
            ]),
            ui.row([
              ui.button('▶️ Start', { onClick: { handler: 'setStatus', args: { status: 'doing' } } }),
              ui.button('✅ Complete', { onClick: { handler: 'setStatus', args: { status: 'done' } } }),
            ]),
            ui.row([
              ui.button('✏️ Save', { onClick: { handler: 'save' } }),
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
          setStatus(context, args) {
            const id = navParam(context.state);
            if (!id) return;
            dispatchDomain(context, 'setStatus', {
              id,
              status: toText(asRecord(args).status, 'todo'),
            });
          },
          save(context) {
            const id = navParam(context.state);
            if (!id) return;
            dispatchDomain(context, 'saveTask', {
              id,
              edits: asRecord(draftState(context.state).edits),
            });
            patchDraft(context, { edits: {} });
            notify(context, 'Saved task ' + id);
          },
          remove(context) {
            const id = navParam(context.state);
            if (!id) return;
            dispatchDomain(context, 'deleteTask', { id });
            notify(context, 'Deleted task ' + id);
            goBack(context);
          },
        },
      },

      newTask: {
        render({ state }) {
          const draft = withDraftState(state);
          const defaultPriority = toText(filtersState(state).defaultPriority, 'medium');
          const form = {
            title: toText(draft.form.title),
            priority: toText(draft.form.priority, defaultPriority),
            due: toText(draft.form.due),
          };

          return ui.panel([
            ui.text('Create New Task'),
            ui.row([
              ui.text('Title:'),
              ui.input(form.title, { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Priority:'),
              ui.input(form.priority, { onChange: { handler: 'change', args: { field: 'priority' } } }),
            ]),
            ui.row([
              ui.text('Due:'),
              ui.input(form.due, { onChange: { handler: 'change', args: { field: 'due' } } }),
            ]),
            draft.submitResult ? ui.badge(draft.submitResult) : ui.text(''),
            ui.row([
              ui.button('➕ Create Task', { onClick: { handler: 'submit' } }),
              ui.button('🏠 Home', { onClick: { handler: 'goHome' } }),
            ]),
          ]);
        },
        handlers: {
          change(context, args) {
            const field = toText(asRecord(args).field);
            if (!field) return;
            setDraft(context, 'form.' + field, toText(asRecord(args).value));
          },
          submit(context) {
            const form = asRecord(draftState(context.state).form);
            const title = toText(form.title).trim();
            if (!title) {
              setDraft(context, 'submitResult', '❌ Title is required');
              return;
            }

            const defaultPriority = toText(filtersState(context.state).defaultPriority, 'medium');
            dispatchDomain(context, 'createTask', {
              title,
              priority: toText(form.priority, defaultPriority),
              due: toText(form.due).trim() || undefined,
            });

            patchDraft(context, {
              form: { title: '', priority: defaultPriority, due: '' },
              submitResult: '✅ Task created',
            });
            notify(context, 'Task created');
          },
          goHome(context) {
            navigate(context, 'home');
          },
        },
      },
    },
  };
});
