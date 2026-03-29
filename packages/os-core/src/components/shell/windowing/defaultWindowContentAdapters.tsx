import type { WindowContentAdapter } from './windowContentAdapter';

export function createAppWindowContentAdapter(): WindowContentAdapter {
  return {
    id: 'default.app-window',
    canRender: (window, ctx) => window.content.kind === 'app' && Boolean(window.content.appKey) && Boolean(ctx.renderAppWindow),
    render: (window, ctx) => {
      if (window.content.kind !== 'app' || !window.content.appKey || !ctx.renderAppWindow) return null;
      return ctx.renderAppWindow(window.content.appKey, window.id);
    },
  };
}

export function createFallbackWindowContentAdapter(): WindowContentAdapter {
  return {
    id: 'default.fallback',
    canRender: () => true,
    render: (window) => (
      <div style={{ padding: 10 }}>
        <p>{window.title}</p>
      </div>
    ),
  };
}
