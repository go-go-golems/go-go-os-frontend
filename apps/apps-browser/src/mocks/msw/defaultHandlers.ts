import {
  MOCK_ARC_AGI_DOCS,
  MOCK_APPS_DEFAULT,
  MOCK_GEPA_DOCS,
  MOCK_GEPA_REFLECTION,
  MOCK_INVENTORY_DOCS,
} from '../fixtures/apps';
import { type AppsHandlerData, createAppsHandlers } from './createAppsHandlers';

export const defaultAppsHandlerData: AppsHandlerData = {
  apps: MOCK_APPS_DEFAULT,
  reflections: { gepa: MOCK_GEPA_REFLECTION },
  unsupportedReflection: ['inventory'],
  docsByApp: {
    inventory: MOCK_INVENTORY_DOCS,
    gepa: MOCK_GEPA_DOCS,
    'arc-agi': MOCK_ARC_AGI_DOCS,
  },
  docsEndpointErrors: [],
};

export function createDefaultAppsHandlers(
  dataOverrides: Partial<AppsHandlerData> = {},
  options: { delayMs?: number } = {},
) {
  return createAppsHandlers({
    data: { ...defaultAppsHandlerData, ...dataOverrides },
    delayMs: options.delayMs,
  });
}

export const defaultHandlers = createDefaultAppsHandlers();
