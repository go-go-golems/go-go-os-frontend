import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  QuickJSRuntimeService,
  validateRuntimeSurfaceTree,
  clearRuntimePackages,
  clearRuntimeSurfaceTypes,
  registerRuntimePackage,
  registerRuntimeSurfaceType,
} from '@go-go-golems/os-scripting';
import { UI_CARD_V1_RUNTIME_SURFACE_TYPE, UI_RUNTIME_PACKAGE } from '../../../../packages/os-ui-cards/src/runtimeRegistration';
import { HYPERCARD_TOOLS_DEMO_PLUGIN_BUNDLE } from './pluginBundle';
import { STACK } from './stack';

describe('hypercard-tools runtime surfaces', () => {
  const services: QuickJSRuntimeService[] = [];

  beforeEach(() => {
    clearRuntimePackages();
    clearRuntimeSurfaceTypes();
    registerRuntimePackage(UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(UI_CARD_V1_RUNTIME_SURFACE_TYPE);
  });

  afterEach(() => {
    for (const service of services) {
      for (const sessionId of service.health().sessions) {
        service.disposeSession(sessionId);
      }
    }
    services.length = 0;
  });

  it('loads the HyperCard Tools bundle with ui.card.v1 surface metadata and renders the home surface', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    const bundle = await service.loadRuntimeBundle(STACK.id, 'hypercard-tools@test', ['ui'], HYPERCARD_TOOLS_DEMO_PLUGIN_BUNDLE);

    const expectedSurfaceIds = Object.keys(STACK.surfaces);
    expect(bundle.packageIds).toEqual(['ui']);
    expect(bundle.surfaces).toEqual(expect.arrayContaining(expectedSurfaceIds));
    expect(bundle.surfaceTypes).toMatchObject(
      Object.fromEntries(expectedSurfaceIds.map((surfaceId) => [surfaceId, 'ui.card.v1'])),
    );

    const rawTree = service.renderRuntimeSurface('hypercard-tools@test', 'home', {
      filters: {
        catalogFilter: '',
        lastVisited: 'home',
        visitCount: 1,
      },
      draft: {},
      nav: {
        current: 'home',
        depth: 1,
        canBack: false,
      },
    });
    const tree = validateRuntimeSurfaceTree('ui.card.v1', rawTree);
    expect(tree).toMatchObject({
      kind: 'panel',
      children: expect.arrayContaining([
        expect.objectContaining({ kind: 'text', text: 'HyperCard Tools - UI DSL Demo Catalog' }),
        expect.objectContaining({ kind: 'column' }),
      ]),
    });
  });
});
