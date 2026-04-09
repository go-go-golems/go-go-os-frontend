// Theme exports - all CSS + Macos1Theme component
// Import this to load all CSS side effects

// CSS imports - these are loaded as side effects via package.json sideEffects
import './tokens.css';
import './primitives.css';
import './shell.css';
import './animations.css';
import './syntax.css';
import './rich-primitives.css';
import './sparkline.css';
import './themes/macos1.css';

export { Macos1Theme } from './Macos1Theme';
export type { Macos1ThemeProps } from './Macos1Theme';
