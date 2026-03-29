// Import this module once in app entry to load default HyperCard desktop + widget CSS packs.
// Optional theme layers can be added on top (classic / modern / desktop theme-macos1).
import './desktop/tokens.css';
import './desktop/shell.css';
import './desktop/primitives.css';
import './desktop/syntax.css';
import './desktop/animations.css';

export { HyperCardTheme, type HyperCardThemeProps } from './HyperCardTheme';
