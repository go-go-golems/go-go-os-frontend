import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { createAppStore } from '../../app/createAppStore';
import type { RuntimeBundleDefinition } from '@hypercard/engine';
import { RuntimeSurfaceDebugWindow } from './RuntimeSurfaceDebugWindow';
import { upsertArtifact } from '../artifacts/artifactsSlice';
import { clearRuntimeSurfaceRegistry, registerRuntimeSurface } from '../../plugin-runtime';
import { clearRegisteredRuntimeDebugStacks, registerRuntimeDebugStacks } from './runtimeDebugRegistry';

const STORY_STACK: RuntimeBundleDefinition = {
  id: 'inventory',
  name: 'Inventory',
  icon: '📦',
  homeSurface: 'home',
  plugin: { packageIds: [], bundleCode: '' },
  surfaces: {
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

const SECOND_STACK: RuntimeBundleDefinition = {
  id: 'os-launcher',
  name: 'go-go-os Launcher',
  icon: '🖥️',
  homeSurface: 'home',
  plugin: { packageIds: [], bundleCode: '' },
  surfaces: {
    home: {
      id: 'home',
      type: 'report',
      title: 'Launcher Home',
      icon: '🏠',
      ui: {},
    },
  },
};

function RuntimeSurfaceDebugStory() {
  const { createStore } = createAppStore({});
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createStore();
  }

  useEffect(() => {
    clearRuntimeSurfaceRegistry();
    clearRegisteredRuntimeDebugStacks();
    registerRuntimeDebugStacks([STORY_STACK, SECOND_STACK]);

    registerRuntimeSurface(
      'lowStockDrilldown',
      '({ ui }) => ({ render() { return ui.panel([ui.text(\"Low Stock\")]); } })',
    );
    registerRuntimeSurface(
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
        runtimeSurfaceId: 'lowStockDrilldown',
        runtimeSurfaceCode: '({ ui }) => ({ render() { return ui.text(\"ok\"); } })',
        updatedAt: Date.now(),
      }),
    );
  }, []);

  return (
    <Provider store={storeRef.current}>
      <div style={{ width: 980, height: 620, background: '#f4f4f6' }}>
        <RuntimeSurfaceDebugWindow ownerAppId="hypercard-runtime-debug" />
      </div>
    </Provider>
  );
}

const meta = {
  title: 'HypercardRuntime/Debug/RuntimeSurfaceDebugWindow',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <RuntimeSurfaceDebugStory />,
};
