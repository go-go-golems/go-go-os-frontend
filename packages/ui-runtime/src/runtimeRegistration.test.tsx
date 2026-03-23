import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  clearRuntimePackages,
  clearRuntimeSurfaceTypes,
  getRuntimePackageOrThrow,
  listRuntimePackages,
  listRuntimeSurfaceTypes,
  registerRuntimePackage,
  registerRuntimeSurfaceType,
  renderRuntimeSurfaceTree,
  validateRuntimeSurfaceTree,
} from '../../hypercard-runtime/src';
import { UI_CARD_V1_RUNTIME_SURFACE_TYPE, UI_RUNTIME_PACKAGE } from './runtimeRegistration';

describe('ui runtime registration', () => {
  beforeEach(() => {
    clearRuntimePackages();
    clearRuntimeSurfaceTypes();
  });

  it('registers the ui runtime package explicitly', () => {
    registerRuntimePackage(UI_RUNTIME_PACKAGE);
    expect(listRuntimePackages()).toEqual(['ui']);
    expect(getRuntimePackageOrThrow('ui').surfaceTypes).toEqual(['ui.card.v1']);
  });

  it('registers and renders the ui.card.v1 surface type explicitly', () => {
    registerRuntimeSurfaceType(UI_CARD_V1_RUNTIME_SURFACE_TYPE);
    expect(listRuntimeSurfaceTypes()).toEqual(['ui.card.v1']);

    const tree = validateRuntimeSurfaceTree('ui.card.v1', {
      kind: 'panel',
      children: [{ kind: 'text', text: 'Hello ui-runtime' }],
    });
    const markup = renderToStaticMarkup(<>{renderRuntimeSurfaceTree('ui.card.v1', tree, () => {})}</>);

    expect(markup).toContain('Hello ui-runtime');
  });
});
