import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
/**
 * Provides the `data-widget="macos1"` scoping root required by all
 * macos1 CSS. Wrap standalone widgets, stories, or embedded uses in
 * this component so theme tokens and part selectors activate.
 *
 * The component also supports the legacy `data-widget="hypercard"` selector
 * for backward compatibility during migration.
 */
export function Macos1Theme({ children, theme, unstyled, themeVars }) {
    if (unstyled)
        return _jsx(_Fragment, { children: children });
    const style = themeVars ? themeVars : undefined;
    return (_jsx("div", { "data-widget": "macos1", className: theme, style: style, children: children }));
}
//# sourceMappingURL=Macos1Theme.js.map