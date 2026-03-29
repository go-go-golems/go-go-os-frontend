import type { Meta, StoryObj } from '@storybook/react';
import type { RuntimeBundleDefinition } from '../../../cards';
import type { WindowInstance } from '../../../desktop/core/state/types';
import {
  renderWindowContentWithAdapters,
  type WindowAdapterContext,
  type WindowContentAdapter,
} from './windowContentAdapter';

interface AdapterContractStoryProps {
  contentKind: 'app' | 'card';
}

const STACK: RuntimeBundleDefinition = {
  id: 'contract',
  name: 'Contract Stack',
  icon: '🧪',
  homeSurface: 'home',
  plugin: { packageIds: [], bundleCode: '' },
  surfaces: {
    home: {
      id: 'home',
      type: 'plugin',
      title: 'Home',
      icon: '🏠',
      ui: { t: 'text', value: 'home' },
    },
  },
};

function buildWindow(contentKind: 'app' | 'card'): WindowInstance {
  return {
    id: `window:${contentKind}`,
    title: `Contract ${contentKind}`,
    bounds: { x: 40, y: 40, w: 360, h: 240 },
    z: 1,
    minW: 180,
    minH: 120,
    content:
      contentKind === 'app'
        ? { kind: 'app', appKey: 'contract-app' }
        : {
            kind: 'surface',
            surface: {
              bundleId: 'contract',
              surfaceId: 'home',
              surfaceSessionId: 'session:contract',
            },
          },
  };
}

function runAdapterFixture(contentKind: 'app' | 'card') {
  const trace: string[] = [];
  const window = buildWindow(contentKind);
  const ctx: WindowAdapterContext = {
    bundle: STACK,
    mode: 'interactive',
  };

  const adapters: WindowContentAdapter[] = [
    {
      id: 'app-null-pass',
      canRender: (w) => w.content.kind === 'app',
      render: () => {
        trace.push('app-null-pass(null)');
        return null;
      },
    },
    {
      id: 'card-primary',
      canRender: (w) => w.content.kind === 'surface',
      render: () => {
        trace.push('card-primary(handled)');
        return <span>card-primary</span>;
      },
    },
    {
      id: 'fallback',
      canRender: () => true,
      render: () => {
        trace.push('fallback(handled)');
        return <span>fallback</span>;
      },
    },
  ];

  const rendered = renderWindowContentWithAdapters(window, ctx, adapters);
  return { trace, rendered };
}

function AdapterContractStory({ contentKind }: AdapterContractStoryProps) {
  const fixture = runAdapterFixture(contentKind);

  return (
    <div
      style={{
        width: 760,
        maxWidth: '100%',
        padding: 16,
        border: '1px solid #111',
        background: '#f2f2f2',
        fontFamily: 'monospace',
        fontSize: 12,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Window adapter routing contract fixture</h3>
      <p style={{ marginTop: 0 }}>
        Verifies first-match adapter routing with null pass-through and fallback behavior.
      </p>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(
          {
            contentKind,
            trace: fixture.trace,
            rendered: typeof fixture.rendered === 'object' ? 'react-node' : String(fixture.rendered),
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}

const meta = {
  title: 'Engine/Shell/Contracts/WindowContentAdapters',
  component: AdapterContractStory,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof AdapterContractStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AppWindowFallsThroughToFallback: Story = {
  args: {
    contentKind: 'app',
  },
};

export const CardWindowHandledByCardAdapter: Story = {
  args: {
    contentKind: 'card',
  },
};
