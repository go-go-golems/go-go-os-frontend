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

  function toMoney(value) {
    return '$' + Math.round(toNumber(value, 0)).toLocaleString();
  }

  function draftState(state) {
    return asRecord(asRecord(state).draft);
  }

  function selectContacts(state) {
    return asArray(asRecord(asRecord(state).contacts).items);
  }

  function selectCompanies(state) {
    return asArray(asRecord(asRecord(state).companies).items);
  }

  function selectDeals(state) {
    return asArray(asRecord(asRecord(state).deals).items);
  }

  function selectActivities(state) {
    return asArray(asRecord(asRecord(state).activities).items);
  }

  function navParam(state) {
    const param = asRecord(asRecord(state).nav).param;
    return typeof param === 'string' ? param : '';
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function findById(items, id) {
    const target = toText(id).toLowerCase();
    if (!target) return null;
    return items.find((item) => toText(asRecord(item).id).toLowerCase() === target) || null;
  }

  function findContact(state, id) {
    return findById(selectContacts(state), id);
  }

  function findCompany(state, id) {
    return findById(selectCompanies(state), id);
  }

  function findDeal(state, id) {
    return findById(selectDeals(state), id);
  }

  function withDraftState(state) {
    const draft = draftState(state);
    return {
      edits: asRecord(draft.edits),
      formValues: asRecord(draft.formValues),
      submitResult: toText(draft.submitResult),
    };
  }

  function contactLifecycle(status) {
    const v = toText(status);
    if (v === 'customer') return '✅ Active Customer';
    if (v === 'prospect') return '🔍 In Pipeline';
    if (v === 'churned') return '⚠️ Churned';
    return '🌱 New Lead';
  }

  function companyTier(size) {
    const v = toText(size);
    if (v === 'enterprise') return '🏢 Enterprise';
    if (v === 'medium') return '🏗️ Mid-Market';
    if (v === 'small') return '🏠 SMB';
    return '🚀 Startup';
  }

  function stageLabel(stage) {
    const v = toText(stage);
    if (v === 'qualification') return '🔍 Qualifying';
    if (v === 'proposal') return '📝 Proposal';
    if (v === 'negotiation') return '🤝 Negotiation';
    if (v === 'closed-won') return '🎉 Won';
    if (v === 'closed-lost') return '❌ Lost';
    return v;
  }

  function contactsRows(items) {
    return items.map((contact) => {
      const row = asRecord(contact);
      return [
        toText(row.id),
        toText(row.name),
        toText(row.email),
        toText(row.phone),
        toText(row.status),
      ];
    });
  }

  function companiesRows(items) {
    return items.map((company) => {
      const row = asRecord(company);
      return [
        toText(row.id),
        toText(row.name),
        toText(row.industry),
        toText(row.size),
        toText(row.website),
      ];
    });
  }

  function dealsRows(items) {
    return items.map((deal) => {
      const row = asRecord(deal);
      return [
        toText(row.id),
        toText(row.title),
        stageLabel(row.stage),
        toMoney(row.value),
        String(toNumber(row.probability, 0)) + '%',
        toText(row.closeDate),
      ];
    });
  }

  function activitiesRows(items) {
    return items.map((activity) => {
      const row = asRecord(activity);
      return [
        toText(row.id),
        toText(row.date),
        toText(row.type),
        toText(row.subject),
        toText(row.contactId),
      ];
    });
  }

  function openDeals(state) {
    return selectDeals(state).filter((deal) => !toText(asRecord(deal).stage).startsWith('closed'));
  }

  function recentActivities(state) {
    return [...selectActivities(state)]
      .sort((a, b) => toText(asRecord(b).date).localeCompare(toText(asRecord(a).date)))
      .slice(0, 20);
  }

  function pipelineSections(state) {
    const deals = selectDeals(state);
    const contacts = selectContacts(state);

    const open = deals.filter((deal) => !toText(asRecord(deal).stage).startsWith('closed'));
    const won = deals.filter((deal) => toText(asRecord(deal).stage) === 'closed-won');
    const lost = deals.filter((deal) => toText(asRecord(deal).stage) === 'closed-lost');

    const totalPipeline = open.reduce((sum, deal) => sum + toNumber(asRecord(deal).value, 0), 0);
    const weightedPipeline = open.reduce(
      (sum, deal) => sum + toNumber(asRecord(deal).value, 0) * (toNumber(asRecord(deal).probability, 0) / 100),
      0
    );
    const wonRevenue = won.reduce((sum, deal) => sum + toNumber(asRecord(deal).value, 0), 0);

    const leads = contacts.filter((contact) => toText(asRecord(contact).status) === 'lead').length;
    const customers = contacts.filter((contact) => toText(asRecord(contact).status) === 'customer').length;

    return [
      ['Open Deals', String(open.length)],
      ['Total Pipeline', toMoney(totalPipeline)],
      ['Weighted Pipeline', toMoney(weightedPipeline)],
      ['Won Revenue', toMoney(wonRevenue)],
      ['Lost Deals', String(lost.length)],
      ['Total Contacts', String(contacts.length)],
      ['Leads', String(leads)],
      ['Customers', String(customers)],
    ];
  }

  function sanitizeDealEdits(edits) {
    const safe = { ...asRecord(edits) };

    if (safe.value !== undefined) {
      safe.value = toNumber(safe.value, 0);
    }

    if (safe.probability !== undefined) {
      safe.probability = toNumber(safe.probability, 0);
    }

    return safe;
  }

  function dispatchDomain(context, domain, actionType, payload) {
    context.dispatch({ type: domain + '/' + actionType, payload });
  }

  function patchDraft(context, payload) {
    context.dispatch({ type: 'draft.patch', payload });
  }

  function setDraft(context, path, value) {
    context.dispatch({ type: 'draft.set', payload: { path, value } });
  }

  function navigate(context, cardId, param) {
    const payload = param ? { cardId, param: toText(param) } : { cardId };
    context.dispatch({ type: 'nav.go', payload });
  }

  function goBack(context) {
    context.dispatch({ type: 'nav.back' });
  }

  function notify(context, message) {
    context.dispatch({ type: 'notify.show', payload: { message: toText(message) } });
  }

  function quickOpenButtons(items, labelField, handlerName) {
    return items.slice(0, 12).map((item) => {
      const row = asRecord(item);
      const id = toText(row.id);
      const label = toText(row[labelField], id);
      return ui.button('Open ' + label, { onClick: { handler: handlerName, args: { id } } });
    });
  }

  return {
    id: 'crm',
    title: 'CRM',
    initialSurfaceState: {
      contactDetail: { edits: {} },
      companyDetail: { edits: {} },
      dealDetail: { edits: {} },
      addContact: {
        formValues: { name: '', email: '', phone: '', companyId: '', status: 'lead' },
        submitResult: '',
      },
      addDeal: {
        formValues: {
          title: '',
          contactId: '',
          companyId: '',
          stage: 'qualification',
          value: 0,
          probability: 25,
          closeDate: '',
        },
        submitResult: '',
      },
      addActivity: {
        formValues: { subject: '', type: 'note', contactId: '', dealId: '', date: '', notes: '' },
        submitResult: '',
      },
    },
    surfaces: {
      home: {
        render() {
          return ui.panel([
            ui.text('CRM Dashboard'),
            ui.text('Contacts · Companies · Deals · Activities'),
            ui.button('👤 Contacts', { onClick: { handler: 'go', args: { cardId: 'contacts' } } }),
            ui.button('🏢 Companies', { onClick: { handler: 'go', args: { cardId: 'companies' } } }),
            ui.button('💰 Deals', { onClick: { handler: 'go', args: { cardId: 'deals' } } }),
            ui.button('📊 Pipeline Report', { onClick: { handler: 'go', args: { cardId: 'pipeline' } } }),
            ui.button('📝 Activity Log', { onClick: { handler: 'go', args: { cardId: 'activityLog' } } }),
            ui.row([
              ui.button('➕ New Contact', { onClick: { handler: 'go', args: { cardId: 'addContact' } } }),
              ui.button('➕ New Deal', { onClick: { handler: 'go', args: { cardId: 'addDeal' } } }),
              ui.button('➕ Log Activity', { onClick: { handler: 'go', args: { cardId: 'addActivity' } } }),
            ]),
            ui.button('🔄 Reset Demo Data', { onClick: { handler: 'resetAll' } }),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).cardId, 'home'));
          },
          resetAll(context) {
            dispatchDomain(context, 'contacts', 'resetContacts');
            dispatchDomain(context, 'companies', 'resetCompanies');
            dispatchDomain(context, 'deals', 'resetDeals');
            dispatchDomain(context, 'activities', 'resetActivities');
            notify(context, 'CRM demo data reset');
          },
        },
      },

      contacts: {
        render({ state }) {
          const contacts = selectContacts(state);
          return ui.panel([
            ui.text('Contacts (' + contacts.length + ')'),
            ui.table(contactsRows(contacts), {
              headers: ['ID', 'Name', 'Email', 'Phone', 'Status'],
            }),
            contacts.length ? ui.text('Quick open:') : ui.badge('No contacts yet.'),
            ui.column(quickOpenButtons(contacts, 'name', 'openContact')),
            ui.row([
              ui.button('Add Contact', { onClick: { handler: 'go', args: { cardId: 'addContact' } } }),
              ui.button('Reset', { onClick: { handler: 'resetContacts' } }),
              ui.button('Home', { onClick: { handler: 'go', args: { cardId: 'home' } } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).cardId, 'home'));
          },
          openContact(context, args) {
            navigate(context, 'contactDetail', toText(asRecord(args).id));
          },
          resetContacts(context) {
            dispatchDomain(context, 'contacts', 'resetContacts');
          },
        },
      },

      contactDetail: {
        render({ state }) {
          const id = navParam(state);
          const record = findContact(state, id);
          if (!record) {
            return ui.panel([
              ui.text('Contact not found: ' + toText(id, '(none)')),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]);
          }

          const draft = withDraftState(state);
          const current = { ...asRecord(record), ...draft.edits };

          return ui.panel([
            ui.text('Contact Detail: ' + toText(current.name, id)),
            ui.text('Lifecycle: ' + contactLifecycle(current.status)),
            ui.row([
              ui.text('Name:'),
              ui.input(toText(current.name), { onChange: { handler: 'change', args: { field: 'name' } } }),
            ]),
            ui.row([
              ui.text('Email:'),
              ui.input(toText(current.email), { onChange: { handler: 'change', args: { field: 'email' } } }),
            ]),
            ui.row([
              ui.text('Phone:'),
              ui.input(toText(current.phone), { onChange: { handler: 'change', args: { field: 'phone' } } }),
            ]),
            ui.row([
              ui.text('Company ID:'),
              ui.input(toText(current.companyId), { onChange: { handler: 'change', args: { field: 'companyId' } } }),
            ]),
            ui.row([
              ui.text('Status:'),
              ui.input(toText(current.status), { onChange: { handler: 'change', args: { field: 'status' } } }),
            ]),
            ui.row([
              ui.button('💾 Save', { onClick: { handler: 'save' } }),
              ui.button('⭐ Promote to Customer', { onClick: { handler: 'promote' } }),
            ]),
            ui.row([
              ui.button('💰 View Deals', { onClick: { handler: 'go', args: { cardId: 'deals' } } }),
              ui.button('🗑 Delete', { onClick: { handler: 'remove' } }),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).cardId, 'home'));
          },
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
            dispatchDomain(context, 'contacts', 'saveContact', {
              id,
              edits: asRecord(draftState(context.state).edits),
            });
            patchDraft(context, { edits: {} });
            notify(context, 'Saved contact ' + id);
          },
          promote(context) {
            const id = navParam(context.state);
            if (!id) return;
            dispatchDomain(context, 'contacts', 'setContactStatus', { id, status: 'customer' });
          },
          remove(context) {
            const id = navParam(context.state);
            if (!id) return;
            dispatchDomain(context, 'contacts', 'deleteContact', { id });
            notify(context, 'Deleted contact ' + id);
            goBack(context);
          },
        },
      },

      addContact: {
        render({ state }) {
          const draft = withDraftState(state);
          const form = {
            name: toText(draft.formValues.name),
            email: toText(draft.formValues.email),
            phone: toText(draft.formValues.phone),
            companyId: toText(draft.formValues.companyId),
            status: toText(draft.formValues.status, 'lead'),
          };

          return ui.panel([
            ui.text('Add Contact'),
            ui.row([
              ui.text('Name:'),
              ui.input(form.name, { onChange: { handler: 'change', args: { field: 'name' } } }),
            ]),
            ui.row([
              ui.text('Email:'),
              ui.input(form.email, { onChange: { handler: 'change', args: { field: 'email' } } }),
            ]),
            ui.row([
              ui.text('Phone:'),
              ui.input(form.phone, { onChange: { handler: 'change', args: { field: 'phone' } } }),
            ]),
            ui.row([
              ui.text('Company ID:'),
              ui.input(form.companyId, { onChange: { handler: 'change', args: { field: 'companyId' } } }),
            ]),
            ui.row([
              ui.text('Status:'),
              ui.input(form.status, { onChange: { handler: 'change', args: { field: 'status' } } }),
            ]),
            draft.submitResult ? ui.badge(draft.submitResult) : ui.text(''),
            ui.row([
              ui.button('Add Contact', { onClick: { handler: 'submit' } }),
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
            const name = toText(values.name).trim();
            const email = toText(values.email).trim();
            if (!name || !email) {
              patchDraft(context, { submitResult: 'Name and Email are required' });
              return;
            }

            dispatchDomain(context, 'contacts', 'createContact', {
              name,
              email,
              phone: toText(values.phone),
              companyId: toText(values.companyId),
              status: toText(values.status, 'lead'),
              tags: [],
            });

            patchDraft(context, {
              submitResult: 'Contact created',
              formValues: { name: '', email: '', phone: '', companyId: '', status: 'lead' },
            });
            notify(context, 'Contact created: ' + name);
          },
        },
      },

      companies: {
        render({ state }) {
          const companies = selectCompanies(state);
          return ui.panel([
            ui.text('Companies (' + companies.length + ')'),
            ui.table(companiesRows(companies), {
              headers: ['ID', 'Name', 'Industry', 'Size', 'Website'],
            }),
            companies.length ? ui.text('Quick open:') : ui.badge('No companies yet.'),
            ui.column(quickOpenButtons(companies, 'name', 'openCompany')),
            ui.row([
              ui.button('Reset', { onClick: { handler: 'resetCompanies' } }),
              ui.button('Home', { onClick: { handler: 'go', args: { cardId: 'home' } } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).cardId, 'home'));
          },
          openCompany(context, args) {
            navigate(context, 'companyDetail', toText(asRecord(args).id));
          },
          resetCompanies(context) {
            dispatchDomain(context, 'companies', 'resetCompanies');
          },
        },
      },

      companyDetail: {
        render({ state }) {
          const id = navParam(state);
          const record = findCompany(state, id);
          if (!record) {
            return ui.panel([
              ui.text('Company not found: ' + toText(id, '(none)')),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]);
          }

          const draft = withDraftState(state);
          const current = { ...asRecord(record), ...draft.edits };

          return ui.panel([
            ui.text('Company Detail: ' + toText(current.name, id)),
            ui.text('Tier: ' + companyTier(current.size)),
            ui.row([
              ui.text('Name:'),
              ui.input(toText(current.name), { onChange: { handler: 'change', args: { field: 'name' } } }),
            ]),
            ui.row([
              ui.text('Industry:'),
              ui.input(toText(current.industry), { onChange: { handler: 'change', args: { field: 'industry' } } }),
            ]),
            ui.row([
              ui.text('Website:'),
              ui.input(toText(current.website), { onChange: { handler: 'change', args: { field: 'website' } } }),
            ]),
            ui.row([
              ui.text('Size:'),
              ui.input(toText(current.size), { onChange: { handler: 'change', args: { field: 'size' } } }),
            ]),
            ui.row([
              ui.button('💾 Save', { onClick: { handler: 'save' } }),
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
            dispatchDomain(context, 'companies', 'saveCompany', {
              id,
              edits: asRecord(draftState(context.state).edits),
            });
            patchDraft(context, { edits: {} });
            notify(context, 'Saved company ' + id);
          },
          remove(context) {
            const id = navParam(context.state);
            if (!id) return;
            dispatchDomain(context, 'companies', 'deleteCompany', { id });
            notify(context, 'Deleted company ' + id);
            goBack(context);
          },
        },
      },

      deals: {
        render({ state }) {
          const deals = selectDeals(state);
          return ui.panel([
            ui.text('Deals (' + deals.length + ')'),
            ui.table(dealsRows(deals), {
              headers: ['ID', 'Title', 'Stage', 'Value', 'Prob', 'Close'],
            }),
            deals.length ? ui.text('Quick open:') : ui.badge('No deals yet.'),
            ui.column(quickOpenButtons(deals, 'title', 'openDeal')),
            ui.row([
              ui.button('Add Deal', { onClick: { handler: 'go', args: { cardId: 'addDeal' } } }),
              ui.button('Open Only', { onClick: { handler: 'go', args: { cardId: 'openDeals' } } }),
              ui.button('Reset', { onClick: { handler: 'resetDeals' } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).cardId, 'home'));
          },
          openDeal(context, args) {
            navigate(context, 'dealDetail', toText(asRecord(args).id));
          },
          resetDeals(context) {
            dispatchDomain(context, 'deals', 'resetDeals');
          },
        },
      },

      openDeals: {
        render({ state }) {
          const deals = openDeals(state);
          return ui.panel([
            ui.text('Open Deals (' + deals.length + ')'),
            ui.table(dealsRows(deals), {
              headers: ['ID', 'Title', 'Stage', 'Value', 'Prob', 'Close'],
            }),
            deals.length ? ui.text('Quick open:') : ui.badge('No open deals. Time to prospect!'),
            ui.column(quickOpenButtons(deals, 'title', 'openDeal')),
            ui.row([
              ui.button('All Deals', { onClick: { handler: 'go', args: { cardId: 'deals' } } }),
              ui.button('Add Deal', { onClick: { handler: 'go', args: { cardId: 'addDeal' } } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).cardId, 'home'));
          },
          openDeal(context, args) {
            navigate(context, 'dealDetail', toText(asRecord(args).id));
          },
        },
      },

      dealDetail: {
        render({ state }) {
          const id = navParam(state);
          const record = findDeal(state, id);
          if (!record) {
            return ui.panel([
              ui.text('Deal not found: ' + toText(id, '(none)')),
              ui.button('← Back', { onClick: { handler: 'back' } }),
            ]);
          }

          const draft = withDraftState(state);
          const current = { ...asRecord(record), ...draft.edits };
          const weightedValue = toNumber(current.value, 0) * (toNumber(current.probability, 0) / 100);

          return ui.panel([
            ui.text('Deal Detail: ' + toText(current.title, id)),
            ui.text('Weighted Value: ' + toMoney(weightedValue)),
            ui.text('Stage Status: ' + stageLabel(current.stage)),
            ui.row([
              ui.text('Title:'),
              ui.input(toText(current.title), { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Contact ID:'),
              ui.input(toText(current.contactId), { onChange: { handler: 'change', args: { field: 'contactId' } } }),
            ]),
            ui.row([
              ui.text('Company ID:'),
              ui.input(toText(current.companyId), { onChange: { handler: 'change', args: { field: 'companyId' } } }),
            ]),
            ui.row([
              ui.text('Stage:'),
              ui.input(toText(current.stage), { onChange: { handler: 'change', args: { field: 'stage' } } }),
            ]),
            ui.row([
              ui.text('Value:'),
              ui.input(toText(current.value), { onChange: { handler: 'change', args: { field: 'value' } } }),
            ]),
            ui.row([
              ui.text('Probability %:'),
              ui.input(toText(current.probability), { onChange: { handler: 'change', args: { field: 'probability' } } }),
            ]),
            ui.row([
              ui.text('Close Date:'),
              ui.input(toText(current.closeDate), { onChange: { handler: 'change', args: { field: 'closeDate' } } }),
            ]),
            ui.row([
              ui.button('💾 Save', { onClick: { handler: 'save' } }),
              ui.button('➡ Advance Stage', { onClick: { handler: 'setStage', args: { stage: 'negotiation' } } }),
            ]),
            ui.row([
              ui.button('🎉 Mark Won', { onClick: { handler: 'setStage', args: { stage: 'closed-won' } } }),
              ui.button('❌ Mark Lost', { onClick: { handler: 'setStage', args: { stage: 'closed-lost' } } }),
              ui.button('🗑 Delete', { onClick: { handler: 'remove' } }),
            ]),
            ui.button('← Back', { onClick: { handler: 'back' } }),
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
            dispatchDomain(context, 'deals', 'saveDeal', {
              id,
              edits: sanitizeDealEdits(asRecord(draftState(context.state).edits)),
            });
            patchDraft(context, { edits: {} });
            notify(context, 'Saved deal ' + id);
          },
          setStage(context, args) {
            const id = navParam(context.state);
            if (!id) return;
            dispatchDomain(context, 'deals', 'setDealStage', {
              id,
              stage: toText(asRecord(args).stage),
            });
          },
          remove(context) {
            const id = navParam(context.state);
            if (!id) return;
            dispatchDomain(context, 'deals', 'deleteDeal', { id });
            notify(context, 'Deleted deal ' + id);
            goBack(context);
          },
        },
      },

      addDeal: {
        render({ state }) {
          const draft = withDraftState(state);
          const form = {
            title: toText(draft.formValues.title),
            contactId: toText(draft.formValues.contactId),
            companyId: toText(draft.formValues.companyId),
            stage: toText(draft.formValues.stage, 'qualification'),
            value: toText(draft.formValues.value, '0'),
            probability: toText(draft.formValues.probability, '25'),
            closeDate: toText(draft.formValues.closeDate),
          };

          return ui.panel([
            ui.text('Add Deal'),
            ui.row([
              ui.text('Title:'),
              ui.input(form.title, { onChange: { handler: 'change', args: { field: 'title' } } }),
            ]),
            ui.row([
              ui.text('Contact ID:'),
              ui.input(form.contactId, { onChange: { handler: 'change', args: { field: 'contactId' } } }),
            ]),
            ui.row([
              ui.text('Company ID:'),
              ui.input(form.companyId, { onChange: { handler: 'change', args: { field: 'companyId' } } }),
            ]),
            ui.row([
              ui.text('Stage:'),
              ui.input(form.stage, { onChange: { handler: 'change', args: { field: 'stage' } } }),
            ]),
            ui.row([
              ui.text('Value:'),
              ui.input(form.value, { onChange: { handler: 'change', args: { field: 'value' } } }),
            ]),
            ui.row([
              ui.text('Probability %:'),
              ui.input(form.probability, { onChange: { handler: 'change', args: { field: 'probability' } } }),
            ]),
            ui.row([
              ui.text('Close Date:'),
              ui.input(form.closeDate, { onChange: { handler: 'change', args: { field: 'closeDate' } } }),
            ]),
            draft.submitResult ? ui.badge(draft.submitResult) : ui.text(''),
            ui.row([
              ui.button('Create Deal', { onClick: { handler: 'submit' } }),
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
            if (!title) {
              patchDraft(context, { submitResult: 'Deal title is required' });
              return;
            }

            dispatchDomain(context, 'deals', 'createDeal', {
              title,
              contactId: toText(values.contactId),
              companyId: toText(values.companyId),
              stage: toText(values.stage, 'qualification'),
              value: toNumber(values.value, 0),
              probability: toNumber(values.probability, 25),
              closeDate: toText(values.closeDate),
            });

            patchDraft(context, {
              submitResult: 'Deal created',
              formValues: {
                title: '',
                contactId: '',
                companyId: '',
                stage: 'qualification',
                value: 0,
                probability: 25,
                closeDate: '',
              },
            });
            notify(context, 'Deal created: ' + title);
          },
        },
      },

      pipeline: {
        render({ state }) {
          const sections = pipelineSections(state);
          return ui.panel([
            ui.text('Pipeline Report'),
            ui.table(sections, { headers: ['Metric', 'Value'] }),
            ui.row([
              ui.button('View Deals', { onClick: { handler: 'go', args: { cardId: 'deals' } } }),
              ui.button('View Contacts', { onClick: { handler: 'go', args: { cardId: 'contacts' } } }),
              ui.button('Reset All', { onClick: { handler: 'resetAll' } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).cardId, 'home'));
          },
          resetAll(context) {
            dispatchDomain(context, 'contacts', 'resetContacts');
            dispatchDomain(context, 'companies', 'resetCompanies');
            dispatchDomain(context, 'deals', 'resetDeals');
            dispatchDomain(context, 'activities', 'resetActivities');
            notify(context, 'CRM demo data reset');
          },
        },
      },

      activityLog: {
        render({ state }) {
          const items = recentActivities(state);
          return ui.panel([
            ui.text('Activity Log (' + items.length + ')'),
            ui.table(activitiesRows(items), {
              headers: ['ID', 'Date', 'Type', 'Subject', 'Contact'],
            }),
            ui.row([
              ui.button('Log Activity', { onClick: { handler: 'go', args: { cardId: 'addActivity' } } }),
              ui.button('Reset', { onClick: { handler: 'resetActivities' } }),
              ui.button('Home', { onClick: { handler: 'go', args: { cardId: 'home' } } }),
            ]),
          ]);
        },
        handlers: {
          go(context, args) {
            navigate(context, toText(asRecord(args).cardId, 'home'));
          },
          resetActivities(context) {
            dispatchDomain(context, 'activities', 'resetActivities');
          },
        },
      },

      addActivity: {
        render({ state }) {
          const draft = withDraftState(state);
          const form = {
            subject: toText(draft.formValues.subject),
            type: toText(draft.formValues.type, 'note'),
            contactId: toText(draft.formValues.contactId),
            dealId: toText(draft.formValues.dealId),
            date: toText(draft.formValues.date),
            notes: toText(draft.formValues.notes),
          };

          return ui.panel([
            ui.text('Log Activity'),
            ui.row([
              ui.text('Subject:'),
              ui.input(form.subject, { onChange: { handler: 'change', args: { field: 'subject' } } }),
            ]),
            ui.row([
              ui.text('Type:'),
              ui.input(form.type, { onChange: { handler: 'change', args: { field: 'type' } } }),
            ]),
            ui.row([
              ui.text('Contact ID:'),
              ui.input(form.contactId, { onChange: { handler: 'change', args: { field: 'contactId' } } }),
            ]),
            ui.row([
              ui.text('Deal ID:'),
              ui.input(form.dealId, { onChange: { handler: 'change', args: { field: 'dealId' } } }),
            ]),
            ui.row([
              ui.text('Date:'),
              ui.input(form.date, { onChange: { handler: 'change', args: { field: 'date' } } }),
            ]),
            ui.row([
              ui.text('Notes:'),
              ui.input(form.notes, { onChange: { handler: 'change', args: { field: 'notes' } } }),
            ]),
            draft.submitResult ? ui.badge(draft.submitResult) : ui.text(''),
            ui.row([
              ui.button('Log Activity', { onClick: { handler: 'submit' } }),
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
            const subject = toText(values.subject).trim();
            if (!subject) {
              patchDraft(context, { submitResult: 'Subject is required' });
              return;
            }

            dispatchDomain(context, 'activities', 'createActivity', {
              contactId: toText(values.contactId),
              dealId: toText(values.dealId),
              type: toText(values.type, 'note'),
              subject,
              date: toText(values.date, todayIso()),
              notes: toText(values.notes),
            });

            patchDraft(context, {
              submitResult: 'Activity logged',
              formValues: {
                subject: '',
                type: 'note',
                contactId: '',
                dealId: '',
                date: '',
                notes: '',
              },
            });
            notify(context, 'Activity logged');
          },
        },
      },
    },
  };
});
