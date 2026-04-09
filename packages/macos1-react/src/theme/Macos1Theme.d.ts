import type { ReactNode } from 'react';
export interface Macos1ThemeProps {
    children: ReactNode;
    /** Theme class name (e.g. 'theme-macos1') */
    theme?: string;
    /** Skip the root scoping wrapper — data-part attrs still render for user CSS */
    unstyled?: boolean;
    /** Inline CSS variable overrides (e.g. { '--hc-color-bg': '#1a1a2e' }) */
    themeVars?: Record<string, string>;
}
/**
 * Provides the `data-widget="macos1"` scoping root required by all
 * macos1 CSS. Wrap standalone widgets, stories, or embedded uses in
 * this component so theme tokens and part selectors activate.
 *
 * The component also supports the legacy `data-widget="hypercard"` selector
 * for backward compatibility during migration.
 */
export declare function Macos1Theme({ children, theme, unstyled, themeVars }: Macos1ThemeProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Macos1Theme.d.ts.map