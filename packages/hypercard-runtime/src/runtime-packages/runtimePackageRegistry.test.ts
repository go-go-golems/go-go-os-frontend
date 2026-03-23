import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearRuntimePackages,
  getRuntimePackageOrThrow,
  listRuntimePackages,
  registerRuntimePackage,
  resolveRuntimePackageInstallOrder,
} from './runtimePackageRegistry';
import { TEST_UI_RUNTIME_PACKAGE } from '../testRuntimeUi';

describe('runtimePackageRegistry', () => {
  beforeEach(() => {
    clearRuntimePackages();
  });

  it('can stay empty until packages are registered explicitly', () => {
    expect(listRuntimePackages()).toEqual([]);
    expect(() => getRuntimePackageOrThrow('ui')).toThrow(/unknown runtime package/i);
  });

  it('registers only the built-in ui package explicitly', () => {
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);

    expect(listRuntimePackages()).toEqual(['ui']);
    expect(getRuntimePackageOrThrow('ui').surfaceTypes).toEqual(['ui.card.v1']);
  });

  it('orders package installation by dependency', () => {
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
    registerRuntimePackage({
      packageId: 'demo',
      version: '1.0.0',
      installPrelude: '',
      surfaceTypes: ['demo.v1'],
      dependencies: ['ui'],
    });
    expect(resolveRuntimePackageInstallOrder(['demo', 'ui'])).toEqual(['ui', 'demo']);
  });

  it('throws for unknown runtime packages', () => {
    expect(() => resolveRuntimePackageInstallOrder(['missing-package'])).toThrow(/unknown runtime package/i);
  });
});
