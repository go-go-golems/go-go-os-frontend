import type { DesktopContribution } from '@hypercard/engine/desktop-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appsBrowserLauncherModule } from './module';

vi.mock('../components/AppsFolderWindow', () => ({
  AppsFolderWindow: () => <div data-part="mock-apps-folder">folder</div>,
}));

vi.mock('../components/ModuleBrowserWindow', () => ({
  ModuleBrowserWindow: () => <div data-part="mock-module-browser">browser</div>,
}));

vi.mock('../components/HealthDashboardWindow', () => ({
  HealthDashboardWindow: () => <div data-part="mock-health">health</div>,
}));

vi.mock('../components/GetInfoWindowByAppId', () => ({
  GetInfoWindowByAppId: () => <div data-part="mock-get-info">get-info</div>,
}));

vi.mock('../components/doc-browser/DocBrowserWindow', () => ({
  DocBrowserWindow: (props: Record<string, unknown>) => (
    <div data-part="mock-doc-browser">{JSON.stringify(props)}</div>
  ),
}));

function createHostContext() {
  return {
    dispatch: vi.fn(),
    getState: vi.fn(),
    openWindow: vi.fn(),
    closeWindow: vi.fn(),
    resolveApiBase: vi.fn(),
    resolveWsBase: vi.fn(),
  };
}

function getDesktopContribution(hostContext: ReturnType<typeof createHostContext>): DesktopContribution {
  const contributions = appsBrowserLauncherModule.createContributions?.(hostContext as any) ?? [];
  expect(contributions).toHaveLength(1);
  return contributions[0];
}

function getCommandHandler(hostContext: ReturnType<typeof createHostContext>) {
  const contribution = getDesktopContribution(hostContext);
  const handler = contribution.commands?.[0];
  if (!handler) {
    throw new Error('Expected apps-browser command handler');
  }
  return handler;
}

function getDocsAdapter(hostContext: ReturnType<typeof createHostContext>) {
  const contribution = getDesktopContribution(hostContext);
  const adapter = contribution.windowContentAdapters?.[0];
  if (!adapter) {
    throw new Error('Expected apps-browser window content adapter');
  }
  return adapter;
}

function createDesktopCommandContext() {
  return {
    dispatch: vi.fn(),
    getState: vi.fn(),
    focusedWindowId: null,
    openCardWindow: vi.fn(),
    closeWindow: vi.fn(),
  };
}

function createInvocation(payload?: Record<string, unknown>) {
  return {
    source: 'programmatic' as const,
    payload,
  };
}

function createDocWindow(appKey: string) {
  return {
    id: 'window:docs:test',
    title: 'Documentation',
    bounds: { x: 0, y: 0, w: 640, h: 480 },
    z: 1,
    minW: 100,
    minH: 80,
    content: { kind: 'app' as const, appKey },
  };
}

describe('apps-browser docs command routing', () => {
  let hostContext: ReturnType<typeof createHostContext>;

  beforeEach(() => {
    hostContext = createHostContext();
  });

  it('opens module docs from apps-browser.open-docs using moduleId payload', () => {
    const handler = getCommandHandler(hostContext);

    const outcome = handler.run(
      'apps-browser.open-docs',
      createDesktopCommandContext() as any,
      createInvocation({ moduleId: 'inventory' }),
    );

    expect(outcome).toBe('handled');
    expect(hostContext.openWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        dedupeKey: 'apps-browser:docs:module:inventory',
        content: expect.objectContaining({ appKey: 'apps-browser:docs:apps:module:inventory' }),
      }),
    );
  });

  it('opens doc reader from apps-browser.open-doc-page and encodes slug safely', () => {
    const handler = getCommandHandler(hostContext);

    const outcome = handler.run(
      'apps-browser.open-doc-page',
      createDesktopCommandContext() as any,
      createInvocation({ appId: 'arc-agi', slug: 'session lifecycle' }),
    );

    expect(outcome).toBe('handled');
    expect(hostContext.openWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        dedupeKey: 'apps-browser:docs:doc:arc-agi:session%20lifecycle',
        content: expect.objectContaining({
          appKey: 'apps-browser:docs:apps:doc:arc-agi:session%20lifecycle',
        }),
      }),
    );
  });

  it('opens search screen from apps-browser.search-docs even when query is empty', () => {
    const handler = getCommandHandler(hostContext);

    const outcome = handler.run(
      'apps-browser.search-docs',
      createDesktopCommandContext() as any,
      createInvocation(),
    );

    expect(outcome).toBe('handled');
    expect(hostContext.openWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ appKey: 'apps-browser:docs:apps:search' }),
      }),
    );
  });

  it('passes when open-doc-page is missing slug', () => {
    const handler = getCommandHandler(hostContext);

    const outcome = handler.run(
      'apps-browser.open-doc-page',
      createDesktopCommandContext() as any,
      createInvocation({ appId: 'inventory' }),
    );

    expect(outcome).toBe('pass');
    expect(hostContext.openWindow).not.toHaveBeenCalled();
  });

  it('opens help mode browser from apps-browser.open-help', () => {
    const handler = getCommandHandler(hostContext);

    const outcome = handler.run(
      'apps-browser.open-help',
      createDesktopCommandContext() as any,
      createInvocation(),
    );

    expect(outcome).toBe('handled');
    expect(hostContext.openWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Help',
        content: expect.objectContaining({ appKey: 'apps-browser:docs:help:home' }),
        dedupeKey: 'apps-browser:help:home',
      }),
    );
  });

  it('matches apps-browser.open-help command', () => {
    const handler = getCommandHandler(hostContext);
    expect(handler.matches('apps-browser.open-help')).toBe(true);
  });
});

describe('apps-browser help menu contribution', () => {
  it('contributes a Help menu section with required entries', () => {
    const hostContext = createHostContext();
    const contribution = getDesktopContribution(hostContext);

    const menus = contribution.menus ?? [];
    const helpMenu = menus.find((m) => m.id === 'help');

    expect(helpMenu).toBeDefined();
    expect(helpMenu!.label).toBe('Help');

    const items = helpMenu!.items.filter((item) => !('separator' in item));
    expect(items).toHaveLength(2);

    const generalHelp = items.find((item) => 'id' in item && item.id === 'general-help');
    expect(generalHelp).toBeDefined();
    expect((generalHelp as any).commandId).toBe('apps-browser.open-help');

    const appsDocs = items.find((item) => 'id' in item && item.id === 'apps-docs');
    expect(appsDocs).toBeDefined();
    expect((appsDocs as any).commandId).toBe('apps-browser.open-docs');
  });
});

describe('apps-browser docs window route parsing', () => {
  let hostContext: ReturnType<typeof createHostContext>;

  beforeEach(() => {
    hostContext = createHostContext();
  });

  function renderDocWindow(appKey: string): string {
    const adapter = getDocsAdapter(hostContext);
    const rendered = adapter.render(createDocWindow(appKey) as any, {} as any);
    return renderToStaticMarkup(rendered as any);
  }

  it('routes search window suffix to search screen with decoded query', () => {
    const html = renderDocWindow('apps-browser:docs:search:runtime%20error');

    expect(html).toContain('&quot;initialScreen&quot;:&quot;search&quot;');
    expect(html).toContain('&quot;initialQuery&quot;:&quot;runtime error&quot;');
  });

  it('routes doc window suffix to reader params with decoded module and slug', () => {
    const html = renderDocWindow('apps-browser:docs:doc:arc-agi:session%20lifecycle');

    expect(html).toContain('&quot;initialModuleId&quot;:&quot;arc-agi&quot;');
    expect(html).toContain('&quot;initialSlug&quot;:&quot;session lifecycle&quot;');
  });

  it('falls back to home params for malformed encoded route parts', () => {
    const html = renderDocWindow('apps-browser:docs:doc:%E0%A4%A:overview');

    expect(html).toContain('{}');
  });

  it('routes help:home suffix to help mode home screen', () => {
    const html = renderDocWindow('apps-browser:docs:help:home');

    expect(html).toContain('&quot;mode&quot;:&quot;help&quot;');
  });

  it('routes help:doc:<slug> suffix to help mode reader with wesen-os moduleId', () => {
    const html = renderDocWindow('apps-browser:docs:help:doc:wesen-os-guide');

    expect(html).toContain('&quot;mode&quot;:&quot;help&quot;');
    expect(html).toContain('&quot;initialModuleId&quot;:&quot;wesen-os&quot;');
    expect(html).toContain('&quot;initialSlug&quot;:&quot;wesen-os-guide&quot;');
  });

  it('routes apps:module:<id> suffix to apps mode with moduleId', () => {
    const html = renderDocWindow('apps-browser:docs:apps:module:inventory');

    expect(html).toContain('&quot;mode&quot;:&quot;apps&quot;');
    expect(html).toContain('&quot;initialModuleId&quot;:&quot;inventory&quot;');
  });

  it('routes apps:search:<query> suffix to apps mode search', () => {
    const html = renderDocWindow('apps-browser:docs:apps:search:test%20query');

    expect(html).toContain('&quot;mode&quot;:&quot;apps&quot;');
    expect(html).toContain('&quot;initialScreen&quot;:&quot;search&quot;');
    expect(html).toContain('&quot;initialQuery&quot;:&quot;test query&quot;');
  });
});
