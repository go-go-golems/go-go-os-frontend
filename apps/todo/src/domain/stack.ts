import type { RuntimeSurfaceMeta, RuntimeBundleDefinition } from '@hypercard/engine';
import { TODO_PLUGIN_BUNDLE } from './pluginBundle';

interface PluginCardMeta {
  id: string;
  title: string;
  icon: string;
}

const TODO_CARD_META: PluginCardMeta[] = [
  { id: 'home', title: 'Home', icon: '🏠' },
  { id: 'browse', title: 'All Tasks', icon: '📋' },
  { id: 'inProgress', title: 'In Progress', icon: '🔥' },
  { id: 'completed', title: 'Completed', icon: '✅' },
  { id: 'taskDetail', title: 'Task Detail', icon: '📝' },
  { id: 'newTask', title: 'New Task', icon: '➕' },
];

function toPluginCard(card: PluginCardMeta): RuntimeSurfaceMeta {
  return {
    id: card.id,
    type: 'plugin',
    title: card.title,
    icon: card.icon,
    ui: {
      t: 'text',
      value: `Plugin card placeholder: ${card.id}`,
    },
  };
}

export const STACK: RuntimeBundleDefinition = {
  id: 'todo',
  name: 'My Tasks',
  icon: '✅',
  homeSurface: 'home',
  plugin: {
    packageIds: ['ui'],
    bundleCode: TODO_PLUGIN_BUNDLE,
    capabilities: {
      domain: ['tasks'],
      system: ['nav.go', 'nav.back', 'notify.show'],
    },
  },
  surfaces: Object.fromEntries(TODO_CARD_META.map((card) => [card.id, toPluginCard(card)])),
};
