import type { CSSProperties, ReactNode } from 'react';

export interface HyperCardThemeProps {
  children: ReactNode;
  /** Theme class name (e.g. 'theme-classic', 'theme-modern') */
  theme?: string;
  /** Skip the root scoping wrapper — data-part attrs still render for user CSS */
  unstyled?: boolean;
  /** Inline CSS variable overrides (e.g. { '--hc-color-bg': '#1a1a2e' }) */
  themeVars?: Record<string, string>;
}

/**
 * Provides the `data-widget="hypercard"` scoping root required by all
 * HyperCard CSS. Wrap standalone widgets, stories, or embedded uses in
 * this component so theme tokens and part selectors activate.
 *
 * DesktopShell uses this internally. Use this component directly when rendering
 * widgets outside the shell (Storybook, tests, embedding).
 */
export function HyperCardTheme({ children, theme, unstyled, themeVars }: HyperCardThemeProps) {
  if (unstyled) return <>{children}</>;

  const style: CSSProperties | undefined = themeVars ? (themeVars as unknown as CSSProperties) : undefined;

  return (
    <div data-widget="hypercard" className={theme} style={style}>
      {children}
    </div>
  );
}
