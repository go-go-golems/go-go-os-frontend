import type { RuntimeSurfaceMeta, RuntimeBundleDefinition } from '@go-go-golems/os-core';
import { CRM_PLUGIN_BUNDLE } from './pluginBundle';

interface PluginCardMeta {
  id: string;
  title: string;
  icon: string;
}

const CRM_CARD_META: PluginCardMeta[] = [
  { id: 'home', title: 'CRM Home', icon: '🏠' },
  { id: 'contacts', title: 'Contacts', icon: '👤' },
  { id: 'contactDetail', title: 'Contact Detail', icon: '👤' },
  { id: 'addContact', title: 'Add Contact', icon: '➕' },
  { id: 'companies', title: 'Companies', icon: '🏢' },
  { id: 'companyDetail', title: 'Company Detail', icon: '🏢' },
  { id: 'deals', title: 'Deals', icon: '💰' },
  { id: 'openDeals', title: 'Open Deals', icon: '🔥' },
  { id: 'dealDetail', title: 'Deal Detail', icon: '💰' },
  { id: 'addDeal', title: 'Add Deal', icon: '➕' },
  { id: 'pipeline', title: 'Pipeline Report', icon: '📊' },
  { id: 'activityLog', title: 'Activity Log', icon: '📝' },
  { id: 'addActivity', title: 'Log Activity', icon: '📝' },
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
  id: 'crm',
  name: 'CRM',
  icon: '💼',
  homeSurface: 'home',
  plugin: {
    packageIds: ['ui'],
    bundleCode: CRM_PLUGIN_BUNDLE,
    capabilities: {
      domain: ['contacts', 'companies', 'deals', 'activities'],
      system: ['nav.go', 'nav.back', 'notify.show'],
    },
  },
  surfaces: Object.fromEntries(CRM_CARD_META.map((card) => [card.id, toPluginCard(card)])),
};
