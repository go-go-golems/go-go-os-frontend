const __kanbanWidgets = {
  kanban: {
    page(...children) {
      const flatChildren = children.flat().filter(Boolean);
      return { kind: 'kanban.page', children: flatChildren };
    },
    taxonomy(props = {}) {
      const safeProps = props && typeof props === 'object' && !Array.isArray(props) ? props : {};
      return { kind: 'kanban.taxonomy', props: safeProps };
    },
    header(props = {}) {
      const safeProps = props && typeof props === 'object' && !Array.isArray(props) ? props : {};
      return { kind: 'kanban.header', props: safeProps };
    },
    filters(props = {}) {
      const safeProps = props && typeof props === 'object' && !Array.isArray(props) ? props : {};
      return { kind: 'kanban.filters', props: safeProps };
    },
    highlights(props = {}) {
      const safeProps = props && typeof props === 'object' && !Array.isArray(props) ? props : {};
      return { kind: 'kanban.highlights', props: safeProps };
    },
    board(props = {}) {
      const safeProps = props && typeof props === 'object' && !Array.isArray(props) ? props : {};
      return { kind: 'kanban.board', props: safeProps };
    },
    status(props = {}) {
      const safeProps = props && typeof props === 'object' && !Array.isArray(props) ? props : {};
      return { kind: 'kanban.status', props: safeProps };
    },
  },
};

globalThis.registerRuntimePackageApi('kanban', { widgets: __kanbanWidgets });
