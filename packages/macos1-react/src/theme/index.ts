// Theme exports - all CSS + Macos1Theme component
// Import this to load all CSS side effects

// CSS imports - these are loaded as side effects via package.json sideEffects
// Order matters: tokens first, then theme overlays, then component styles

// Base tokens and component styles from os-core
import './tokens.css';
import './primitives.css';
import './shell.css';
import './animations.css';
import './syntax.css';

// Compatibility layer: support both data-widget="macos1" and data-widget="hypercard"
// Remove this once all consumers are migrated
import './compat.css';

// macos1 theme overlay
import './themes/macos1.css';

export { Macos1Theme } from './Macos1Theme';
export type { Macos1ThemeProps } from './Macos1Theme';
