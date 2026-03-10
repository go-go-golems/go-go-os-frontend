import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { createAppStore } from '../../app/createAppStore';
import type { CardStackDefinition } from '@hypercard/engine';
import { RuntimeCardDebugWindow } from './RuntimeCardDebugWindow';
import { upsertArtifact } from '../artifacts/artifactsSlice';
import { clearRuntimeCardRegistry, registerRuntimeCard } from '../../plugin-runtime';
import { clearRegisteredRuntimeDebugStacks, registerRuntimeDebugStacks } from './runtimeDebugRegistry';

const STORY_STACK: CardStackDefinition = {
  id: 'inventory',
  name: 'Inventory',
  icon: '📦',
  homeCard: 'home',
  plugin: { bundleCode: '' },
  cards: {
    home: {
      id: 'home',
      type: 'report',
      title: 'Inventory Home',
      icon: '🏠',
      ui: {},
    },
    reportViewer: {
      id: 'reportViewer',
      type: 'report',
      title: 'Report Viewer',
      icon: '📊',
      ui: {},
    },
  },
};

const SECOND_STACK: CardStackDefinition = {
  id: 'os-launcher',
  name: 'go-go-os Launcher',
  icon: '🖥️',
  homeCard: 'home',
  plugin: { bundleCode: '' },
  cards: {
    home: {
      id: 'home',
      type: 'report',
      title: 'Launcher Home',
      icon: '🏠',
      ui: {},
    },
  },
};

function RuntimeCardDebugStory() {
  const { createStore } = createAppStore({});
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createStore();
  }

  useEffect(() => {
    clearRuntimeCardRegistry();
    clearRegisteredRuntimeDebugStacks();
    registerRuntimeDebugStacks([STORY_STACK, SECOND_STACK]);

    registerRuntimeCard(
      'lowStockDrilldown',
      '({ ui }) => ({ render() { return ui.panel([ui.text(\"Low Stock\")]); } })',
    );
    registerRuntimeCard(
      'inventorySummary',
      '({ ui }) => ({ render() { return ui.panel([ui.text(\"Summary\")]); } })',
    );

    storeRef.current?.dispatch(
      upsertArtifact({
        id: 'artifact-low-stock',
        title: 'Low Stock Drilldown',
        template: 'reportViewer',
        source: 'card',
        data: { threshold: 5 },
        runtimeCardId: 'lowStockDrilldown',
        runtimeCardCode: '({ ui }) => ({ render() { return ui.text(\"ok\"); } })',
        updatedAt: Date.now(),
      }),
    );
  }, []);

  return (
    <Provider store={storeRef.current}>
      <div style={{ width: 980, height: 620, background: '#f4f4f6' }}>
        <RuntimeCardDebugWindow ownerAppId="hypercard-runtime-debug" />
      </div>
    </Provider>
  );
}

const meta = {
  title: 'HypercardRuntime/Debug/RuntimeCardDebugWindow',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <RuntimeCardDebugStory />,
};
