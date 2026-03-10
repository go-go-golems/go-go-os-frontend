import { describe, expect, it } from 'vitest';
import { buildDocObjectPath, buildDocsMountPath } from '../../domain/docsObjects';
import { resolveInitialDocBrowserScreen } from './DocBrowserWindow';

describe('resolveInitialDocBrowserScreen', () => {
  it('prefers explicit screen when provided', () => {
    const screen = resolveInitialDocBrowserScreen({
      screen: 'search',
      initialPath: buildDocObjectPath('module', 'inventory', 'overview'),
    });

    expect(screen).toBe('search');
  });

  it('uses reader when module and slug are provided', () => {
    const screen = resolveInitialDocBrowserScreen({
      initialPath: buildDocObjectPath('module', 'inventory', 'overview'),
    });

    expect(screen).toBe('reader');
  });

  it('uses collection when only mount path is provided', () => {
    const screen = resolveInitialDocBrowserScreen({
      initialMountPath: buildDocsMountPath('module', 'inventory'),
    });

    expect(screen).toBe('collection');
  });

  it('falls back to home when no params are provided', () => {
    const screen = resolveInitialDocBrowserScreen({});

    expect(screen).toBe('home');
  });
});
