import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Btn } from '@hypercard/engine';
import { PluginCardRenderer } from '../runtime-host/PluginCardRenderer';
import type { RuntimeAction } from './contracts';
import DYNAMIC_CARD from './fixtures/dynamic-card.vm.js?raw';
import INVENTORY_STACK from './fixtures/inventory-stack.vm.js?raw';
import PATCHED_LOW_STOCK_HANDLER from './fixtures/patched-low-stock-handler.vm.js?raw';
import PATCHED_LOW_STOCK_RENDER from './fixtures/patched-low-stock-render.vm.js?raw';
import { QuickJSRuntimeService } from './runtimeService';
import type { UINode } from './uiTypes';

const SESSION_ID = 'story@runtime-mutation';
const STACK_ID = 'inventory';

type RuntimeStatus = 'loading' | 'ready' | 'error';

function RuntimeMutationDemo() {
  const runtimeRef = useRef<QuickJSRuntimeService | null>(null);
  if (!runtimeRef.current) {
    runtimeRef.current = new QuickJSRuntimeService();
  }

  const runtime = runtimeRef.current;

  const [status, setStatus] = useState<RuntimeStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<string[]>([]);
  const [activeCardId, setActiveCardId] = useState('lowStock');
  const [lowStockLimit, setLowStockLimit] = useState(5);
  const [tree, setTree] = useState<UINode | null>(null);
  const [lastActions, setLastActions] = useState<RuntimeAction[]>([]);

  const stateFor = useCallback(
    (cardId: string) => {
      const draft =
        cardId === 'lowStock'
          ? { limit: lowStockLimit }
          : cardId === 'onDemand'
            ? { name: 'Add Deal' }
            : {};

      return {
        filters: { filter: 'all' },
        draft,
      };
    },
    [lowStockLimit]
  );

  const renderRuntimeSurface = useCallback(
    (cardId: string) => {
      const nextTree = runtime.renderRuntimeSurface(SESSION_ID, cardId, stateFor(cardId));
      setTree(nextTree);
    },
    [runtime, stateFor]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const bundle = await runtime.loadRuntimeBundle(STACK_ID, SESSION_ID, INVENTORY_STACK);
        if (cancelled) {
          return;
        }

        setCards(bundle.surfaces);
        setStatus('ready');
        setError(null);
        renderRuntimeSurface('lowStock');
      } catch (cause) {
        if (cancelled) {
          return;
        }

        setStatus('error');
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    }

    void load();

    return () => {
      cancelled = true;
      runtime.disposeSession(SESSION_ID);
    };
  }, [renderRuntimeSurface, runtime]);

  useEffect(() => {
    if (status !== 'ready') {
      return;
    }

    try {
      renderRuntimeSurface(activeCardId);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, [activeCardId, renderRuntimeSurface, status]);

  const run = useCallback(
    (label: string, fn: () => void) => {
      if (status !== 'ready') {
        return;
      }

      try {
        fn();
        setError(null);
        renderRuntimeSurface(activeCardId);
      } catch (cause) {
        setError(`${label}: ${cause instanceof Error ? cause.message : String(cause)}`);
      }
    },
    [activeCardId, renderRuntimeSurface, status]
  );

  const onEvent = useCallback(
    (handler: string, args?: unknown) => {
      run('eventRuntimeSurface', () => {
        const actions = runtime.eventRuntimeSurface(SESSION_ID, activeCardId, handler, args, stateFor(activeCardId));
        setLastActions(actions);

        const hasBack = actions.some((action) => action.type === 'nav.back');
        if (hasBack) {
          setActiveCardId('lowStock');
        }
      });
    },
    [activeCardId, run, runtime, stateFor]
  );

  if (status === 'loading') {
    return <div style={{ padding: 12 }}>Loading runtime session…</div>;
  }

  if (status === 'error') {
    return (
      <div style={{ padding: 12, color: '#9f1d1d' }}>
        Runtime load failed: {error}
      </div>
    );
  }

  return (
    <div style={{ width: 900, display: 'grid', gridTemplateColumns: '320px 1fr', gap: 12 }}>
      <div style={{ border: '1px solid #111', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 700 }}>Runtime Mutations</div>
        <div style={{ fontSize: 12 }}>Session: {SESSION_ID}</div>
        <div style={{ fontSize: 12 }}>Cards: {cards.join(', ') || '(none)'}</div>

        <label style={{ fontSize: 12 }}>
          Low stock limit
          <input
            type="number"
            value={lowStockLimit}
            onChange={(event) => setLowStockLimit(Number(event.target.value) || 0)}
            style={{ width: '100%', marginTop: 4 }}
          />
        </label>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Btn
            onClick={() =>
              run('defineRuntimeSurface', () => {
                const bundle = runtime.defineRuntimeSurface(SESSION_ID, 'onDemand', DYNAMIC_CARD);
                setCards(bundle.surfaces);
                setActiveCardId('onDemand');
              })
            }
          >
            defineRuntimeSurface(onDemand)
          </Btn>

          <Btn
            onClick={() =>
              run('defineRuntimeSurfaceRender', () => {
                runtime.defineRuntimeSurfaceRender(SESSION_ID, 'lowStock', PATCHED_LOW_STOCK_RENDER);
                setActiveCardId('lowStock');
              })
            }
          >
            defineRuntimeSurfaceRender(lowStock)
          </Btn>

          <Btn
            onClick={() =>
              run('defineRuntimeSurfaceHandler', () => {
                runtime.defineRuntimeSurfaceHandler(SESSION_ID, 'onDemand', 'back', PATCHED_LOW_STOCK_HANDLER);
              })
            }
          >
            defineRuntimeSurfaceHandler(onDemand.back)
          </Btn>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cards.map((cardId) => (
            <Btn key={cardId} onClick={() => setActiveCardId(cardId)}>
              show {cardId}
            </Btn>
          ))}
        </div>

        {error ? (
          <div style={{ color: '#9f1d1d', fontSize: 12 }}>Error: {error}</div>
        ) : (
          <div style={{ fontSize: 12 }}>Active card: {activeCardId}</div>
        )}

        <div style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
          Last actions: {lastActions.length === 0 ? '[]' : JSON.stringify(lastActions, null, 2)}
        </div>
      </div>

      <div style={{ border: '2px solid #000', minHeight: 380, background: '#fff', overflow: 'auto' }}>
        {tree ? <PluginCardRenderer tree={tree} onEvent={onEvent} /> : <div style={{ padding: 12 }}>No output.</div>}
      </div>
    </div>
  );
}

const meta = {
  title: 'HypercardRuntime/PluginRuntime/RuntimeMutation',
  component: RuntimeMutationDemo,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof RuntimeMutationDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RuntimeMutation: Story = {};
