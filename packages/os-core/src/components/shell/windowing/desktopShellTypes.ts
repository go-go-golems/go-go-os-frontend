import type { ReactNode } from 'react';
import type { RuntimeBundleDefinition } from '../../../cards';
import type { DesktopContribution } from './desktopContributions';
import type {
  DesktopCommandInvocation,
  DesktopIconDef,
  DesktopMenuSection,
  DesktopVisibilityContextResolver,
} from './types';

export interface DesktopShellProps {
  bundle: RuntimeBundleDefinition;
  mode?: 'interactive' | 'preview';
  themeClass?: string;
  /** Optional initial param injected into the first auto-opened home-surface window. */
  homeParam?: string;
  /** Custom menu sections. If omitted, a default menu is generated. */
  menus?: DesktopMenuSection[];
  /** Custom desktop icons. If omitted, icons are generated from bundle surfaces. */
  icons?: DesktopIconDef[];
  /**
   * Render a custom window body for non-surface windows (content.kind === 'app').
   * Receives the appKey from the window's content and the window id.
   * Return null to fall back to the default placeholder.
   */
  renderAppWindow?: (appKey: string, windowId: string) => ReactNode;
  /** Called for menu/icon commands not handled by the built-in command set. */
  onCommand?: (commandId: string, invocation?: DesktopCommandInvocation) => void;
  /** Optional resolver used to inject action-visibility context from external modules. */
  visibilityContextResolver?: DesktopVisibilityContextResolver;
  /** Optional contribution bundles used to compose menus/icons/commands/adapters. */
  contributions?: DesktopContribution[];
}
