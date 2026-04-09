// Macos1Theme - Theme scoping component
// Extracted from os-core/src/theme/HyperCardTheme.tsx
// Will be populated in Phase 2

import React from 'react';

export interface Macos1ThemeProps {
  children: React.ReactNode;
  theme?: string;
  unstyled?: boolean;
  themeVars?: React.CSSProperties;
}

/**
 * Macos1Theme provides the CSS scoping root for the macos1 theme system.
 * It renders a div with data-widget="macos1" to scope CSS custom properties.
 */
export function Macos1Theme({ children, theme, unstyled, themeVars }: Macos1ThemeProps) {
  if (unstyled) return <>{children}</>;
  return (
    <div data-widget="macos1" className={theme} style={themeVars}>
      {children}
    </div>
  );
}
