import type { RuntimeSurfaceMeta, RuntimeBundleDefinition } from '@go-go-golems/os-core';
import { HYPERCARD_TOOLS_DEMO_PLUGIN_BUNDLE } from './pluginBundle';

interface DemoCardMeta {
  id: string;
  title: string;
  icon: string;
}

const DEMO_CARDS: DemoCardMeta[] = [
  { id: 'home', title: 'UI DSL Demo Catalog', icon: '🗂️' },
  { id: 'layouts', title: 'Layouts', icon: '📐' },
  { id: 'textBadges', title: 'Text and Badges', icon: '🏷️' },
  { id: 'buttons', title: 'Buttons and Actions', icon: '🖱️' },
  { id: 'inputs', title: 'Inputs', icon: '⌨️' },
  { id: 'tables', title: 'Tables', icon: '📊' },
  { id: 'dropdowns', title: 'Dropdowns', icon: '🔽' },
  { id: 'selectableTable', title: 'Selectable Table', icon: '☑️' },
  { id: 'gridBoard', title: 'Grid Board', icon: '🟦' },
  { id: 'eventPayloads', title: 'Event Payloads', icon: '🧬' },
  { id: 'domainIntents', title: 'Domain Intents', icon: '🧩' },
  { id: 'stateNav', title: 'State and Navigation', icon: '🧭' },
  { id: 'playground', title: 'All Widgets Playground', icon: '🧪' },
];

function toPluginCard(meta: DemoCardMeta): RuntimeSurfaceMeta {
  return {
    id: meta.id,
    type: 'plugin',
    title: meta.title,
    icon: meta.icon,
    ui: {
      t: 'text',
      value: `Plugin card placeholder: ${meta.id}`,
    },
  };
}

export const STACK: RuntimeBundleDefinition = {
  id: 'hypercardToolsUiDslDemo',
  name: 'HyperCard UI DSL Demos',
  icon: '🛠️',
  homeSurface: 'home',
  plugin: {
    packageIds: ['ui'],
    bundleCode: HYPERCARD_TOOLS_DEMO_PLUGIN_BUNDLE,
    capabilities: {
      domain: ['app_hypercard_tools'],
      system: ['nav.go', 'nav.back', 'notify.show', 'window.close'],
    },
  },
  surfaces: Object.fromEntries(DEMO_CARDS.map((card) => [card.id, toPluginCard(card)])),
};
