# go-go-os Theming & Widget Playbook

**A Complete Guide for New Engineers**

---

## Table of Contents

### Part I: Understanding the System
1. [What Is go-go-os?](#chapter-1-what-is-go-go-os)
2. [The Design Philosophy](#chapter-2-the-design-philosophy)
3. [Architecture at a Glance](#chapter-3-architecture-at-a-glance)

### Part II: The CSS Foundation
4. [Tokens: The Design Language](#chapter-4-tokens-the-design-language)
5. [Data-Parts: The Attribute System](#chapter-5-data-parts-the-attribute-system)
6. [Primitives: Component CSS Rules](#chapter-6-primitives-component-css-rules)
7. [Shell: The Desktop Chrome](#chapter-7-shell-the-desktop-chrome)

### Part III: Creating Themes
8. [How Themes Work](#chapter-8-how-themes-work)
9. [Your First Theme: macOS Aqua](#chapter-9-your-first-theme-macos-aqua)
10. [Studying the Existing Themes](#chapter-10-studying-the-existing-themes)
11. [Advanced Theme Techniques](#chapter-11-advanced-theme-techniques)

### Part IV: Building Widgets
12. [Anatomy of a Widget](#chapter-12-anatomy-of-a-widget)
13. [Your First Widget: StatusBadge](#chapter-13-your-first-widget-statusbadge)
14. [Widget Patterns & Recipes](#chapter-14-widget-patterns--recipes)
15. [Complex Widgets: Selection, Search, Keyboard](#chapter-15-complex-widgets-selection-search-keyboard)

### Part V: Composing Applications
16. [The Desktop Shell & Contributions](#chapter-16-the-desktop-shell--contributions)
17. [The Confirm Runtime: A Composition Case Study](#chapter-17-the-confirm-runtime-a-composition-case-study)

### Part VI: Storybook & Quality
18. [Writing Stories](#chapter-18-writing-stories)
19. [Validation & Theme Compatibility](#chapter-19-validation--theme-compatibility)

### Part VII: Reference
20. [Complete Token Catalogue](#chapter-20-complete-token-catalogue)
21. [Complete Parts Catalogue](#chapter-21-complete-parts-catalogue)
22. [New Widget Checklist](#chapter-22-new-widget-checklist)
23. [Troubleshooting](#chapter-23-troubleshooting)

---

## Part I: Understanding the System

---

## Chapter 1: What Is go-go-os?

go-go-os is a **retro macOS desktop environment** built in React. It recreates the look, feel, and interaction model of classic Macintosh operating systems — complete with draggable windows, a menu bar, desktop icons, and the pixel-perfect visual language of System 7 through early macOS. But unlike a museum piece, it's a living application framework: real apps run inside its windows, real data flows through its widgets, and the entire visual system is designed to be themed, extended, and composed.

### What It Looks Like

Imagine opening your browser and seeing a gray dithered desktop with a menu bar across the top. On the desktop sit icons — double-click one and a window opens with a familiar title bar, close box, and resize handle. The window might contain a data table with zebra-striped rows, or a form with input fields and buttons that have hard pixel shadows. Everything is rendered in Geneva/Chicago monospace at 11 pixels, with black-on-white contrast and zero border radius. It looks like 1991 — and it's entirely on purpose.

### What It's For

go-go-os serves as the visual frontend for several systems:

- **Inventory management** — The `apps/inventory` application runs inside the desktop shell and manages stock, queues, and operational workflows.
- **plz-confirm integration** — The human-in-the-loop confirmation tool uses go-go-os widgets to present approval dialogs, selection lists, data tables, file uploads, and multi-step scripted workflows to human operators.
- **AI chat** — An AI panel slides in from the side, using the same visual language for conversations.
- **Extensible applications** — New apps can register desktop icons, menu items, keyboard shortcuts, and window content through a contribution system.

### The Engine Package

The core of the visual system lives in `packages/engine/`. This is the package you'll work with most. It exports:

- **Theme CSS** — The complete visual language (tokens, primitives, shell chrome)
- **HyperCardTheme** — A React component that scopes all styling
- **Widgets** — 30+ reusable components (buttons, tables, forms, lists, dialogs, etc.)
- **Desktop Shell** — The window manager, menu bar, and icon layer
- **Parts** — A constant registry of all data-attribute names

When someone says "build a macOS-looking widget," they mean: build a React component that plugs into this engine and renders using its CSS system.

---

## Chapter 2: The Design Philosophy

Before writing any code, it's worth understanding the three principles that shaped every decision in the visual system. These aren't arbitrary rules — they solve real problems that come up when you build a complex, themeable UI.

### Principle 1: Everything Is Scoped

All CSS in go-go-os lives under the `[data-widget="hypercard"]` attribute selector. Nothing leaks into the surrounding page. This matters because go-go-os often runs embedded inside a larger application (the plz-confirm server's web UI, for example), and its styles must not interfere with anything outside the desktop.

The scoping root is provided by the `HyperCardTheme` component:

```tsx
// packages/engine/src/theme/HyperCardTheme.tsx
export function HyperCardTheme({ children, theme, unstyled, themeVars }: HyperCardThemeProps) {
  if (unstyled) return <>{children}</>;

  const style = themeVars ? (themeVars as unknown as CSSProperties) : undefined;

  return (
    <div data-widget="hypercard" className={theme} style={style}>
      {children}
    </div>
  );
}
```

Every story in Storybook, every app window, and every standalone widget gets wrapped in this component. The `data-widget="hypercard"` attribute is what activates the entire CSS system.

### Principle 2: Everything Is Token-Driven

Colors, fonts, spacing, borders, shadows — every visual decision is expressed as a CSS custom property (a "token") with a `--hc-` prefix. Component CSS rules never contain raw values like `#0a84ff` or `12px`. Instead they reference tokens:

```css
/* This is how every component rule looks: */
[data-part="btn"] {
  font-family: var(--hc-font-family);      /* not 'Geneva, monospace' */
  background: var(--hc-btn-bg);            /* not '#fff' */
  border: var(--hc-btn-border);            /* not '2px solid #000' */
}
```

Why does this matter? Because a **theme is nothing more than a CSS file that overrides tokens**. When you change `--hc-btn-bg` from `#fff` to `linear-gradient(180deg, #6cb3fa, #0058d0)`, every button in the entire system changes — from the window close box to form submit buttons to action bar controls. You don't need to know where buttons are used. You just change the token.

This also means themes are additive. The default theme (tokens.css) provides base values. A theme override file only needs to redeclare the tokens it wants to change. Everything else falls back to the base.

### Principle 3: Everything Is Part-Driven

Components don't use CSS class names. They use **data attributes**:

```tsx
// In the component:
<button data-part="btn" data-variant="primary">Save</button>

// In the CSS:
[data-part="btn"] { ... }
[data-part="btn"][data-variant="primary"] { ... }
```

This breaks a long-standing web development convention, so it deserves explanation. Here's why we do it:

1. **Stable contract.** CSS class names get mangled by build tools (CSS Modules, Tailwind, etc.). Data attributes survive all transformations unchanged. A theme author can write `[data-part="btn"]` and it will work regardless of how the code was bundled.

2. **Self-documenting.** Open the browser inspector and you'll see `data-part="confirm-heading"` right in the DOM — not `.css-1a2b3c`. You immediately know what the element is and what CSS targets it.

3. **Theme-safe.** Themes target parts by name. The theme author doesn't need to know whether Btn.tsx uses `className="btn"` or `className={styles.button}`. The contract is the data attribute.

4. **No collisions.** Two widgets can both have a `<div data-part="card-title">` and the CSS works correctly because the selector matches the semantic role, not an implementation detail.

All part names are centralized in a single file (`packages/engine/src/parts.ts`) and imported as constants. You never hardcode a data-part string — always import from `PARTS`.

---

## Chapter 3: Architecture at a Glance

The visual system has four layers. Each one builds on the layer below:

```
┌─────────────────────────────────────────────────────┐
│  4. App Composition                                 │
│     DesktopShell + Contributions + App Windows      │
├─────────────────────────────────────────────────────┤
│  3. Widgets                                         │
│     React components using data-part attributes     │
├─────────────────────────────────────────────────────┤
│  2. Theme Layer (optional)                          │
│     CSS files that override tokens                  │
├─────────────────────────────────────────────────────┤
│  1. Base CSS                                        │
│     tokens.css + primitives.css + shell.css          │
└─────────────────────────────────────────────────────┘
```

**Layer 1** declares the design language — all the CSS custom properties (tokens) and the rules that consume them (primitives). This is always loaded.

**Layer 2** is optional. A theme file adds or overrides tokens to change the entire visual feel. No theme means you get the default classic Mac look.

**Layer 3** is where React components live. Each widget renders a tree of `data-part` attributes. The CSS from layers 1 and 2 styles them.

**Layer 4** is composition. The DesktopShell arranges windows, menus, and icons. Apps register themselves through a contribution system. The confirm-runtime composes widgets into multi-step operator workflows.

### Key Files

Here's where everything lives in the codebase. You'll reference these files constantly:

| File | What It Does |
|------|-------------|
| `packages/engine/src/theme/index.ts` | Entry point — imports all base CSS packs |
| `packages/engine/src/theme/HyperCardTheme.tsx` | The React scoping wrapper |
| `packages/engine/src/theme/desktop/tokens.css` | All ~90 CSS custom properties |
| `packages/engine/src/theme/desktop/primitives.css` | Component CSS rules (~300 lines) |
| `packages/engine/src/theme/desktop/shell.css` | Desktop chrome (windows, menus, icons) |
| `packages/engine/src/theme/desktop/animations.css` | Keyframe animations |
| `packages/engine/src/theme/classic.css` | "Classic" theme override |
| `packages/engine/src/theme/modern.css` | "Modern" (macOS-like) theme override |
| `packages/engine/src/theme/desktop/theme/macos1.css` | macOS System 1 desktop skin |
| `packages/engine/src/parts.ts` | All 104 data-part name constants |
| `packages/engine/src/components/widgets/` | All widget implementations |
| `packages/engine/src/components/shell/windowing/` | Desktop shell, windows, menus |

### How the Pieces Connect

Let's trace what happens when a button renders in the system:

```
1. Your code:          <Btn variant="primary">Save</Btn>

2. Btn.tsx renders:    <button data-part="btn" data-variant="primary">Save</button>

3. HyperCardTheme      wraps everything in <div data-widget="hypercard">
   (somewhere above     which activates...
    in the tree)

4. tokens.css:         [data-widget="hypercard"] { --hc-btn-bg: #fff; ... }
                       ↑ declares default button tokens

5. primitives.css:     [data-part="btn"] { background: var(--hc-btn-bg); ... }
                       ↑ applies tokens to the button

6. If a theme is       [data-widget="hypercard"].theme-modern { --hc-btn-bg: #e8ecf4; }
   active:             ↑ overrides the token, and the primitive rule
                         automatically picks up the new value
```

This trace captures the fundamental flow. Every visual element in the system follows exactly this pattern.

---

## Part II: The CSS Foundation

---

## Chapter 4: Tokens: The Design Language

Tokens are CSS custom properties that encode every visual decision in the system. They are the single source of truth. If you want to know what color a button is, you look at `--hc-btn-bg`. If you want to change it, you override that token. You never go hunting through component CSS for hardcoded values.

### Where Tokens Live

**File: `packages/engine/src/theme/desktop/tokens.css`**

All tokens are declared inside a single `[data-widget="hypercard"]` rule block. Here's the opening:

```css
/* ─── HyperCard Engine ─ Base Tokens ──────────────────────────────────── */

[data-widget="hypercard"] {
  /* ── Layout ── */
  --hc-width: 100%;
  --hc-max-width: 96vw;
  --hc-height: 92vh;
  --hc-font-family: "Geneva", "Chicago", "Monaco", monospace;
  --hc-font-size: 11px;
  --hc-border-radius: 0px;

  /* ── Color palette ── */
  --hc-color-bg: #fff;
  --hc-color-fg: #000;
  --hc-color-border: #000;
  --hc-color-muted: #777;
  --hc-color-accent: #000;
  /* ... ~90 tokens total */
}
```

Because the selector is `[data-widget="hypercard"]`, these tokens only activate inside the scoping root. They can't interfere with anything else on the page.

### Naming Convention

All tokens start with `--hc-` (HyperCard). The rest follows a consistent pattern:

```
--hc-{scope}-{property}
--hc-{scope}-{variant}-{property}
```

Let's look at real examples to see the pattern:

| Token | Scope | Variant | Property | Meaning |
|-------|-------|---------|----------|---------|
| `--hc-color-bg` | color | — | bg | The page background color |
| `--hc-btn-primary-bg` | btn | primary | bg | Primary button's background |
| `--hc-confirm-heading-size` | confirm | heading | size | Font size for confirm section headings |
| `--hc-window-title-focused-bg` | window | title-focused | bg | Focused window title bar background |

This naming is important because it lets you *predict* token names without looking them up. Need the danger button's text color? It's `--hc-btn-danger-fg`. Need the dropzone's hover background? It's `--hc-confirm-dropzone-hover-bg`.

### Token Categories

The ~90 tokens break down into these categories:

**Layout** — The global typography and geometry:
```css
--hc-font-family: "Geneva", "Chicago", "Monaco", monospace;
--hc-font-size: 11px;
--hc-border-radius: 0px;
```

These three tokens define an enormous amount of the visual character. Change the font to `'Inter', 'SF Pro', sans-serif`, the size to `13px`, and the radius to `10px`, and you've gone from System 7 to modern macOS in three lines.

**Colors** — 18 tokens covering the full semantic palette:
```css
--hc-color-bg: #fff;           /* Page/container background */
--hc-color-fg: #000;           /* Primary text */
--hc-color-border: #000;       /* Borders */
--hc-color-muted: #777;        /* Secondary/caption text */
--hc-color-accent: #000;       /* Accent/highlight color */
--hc-color-error: #a00;        /* Error state */
--hc-color-warning: #960;      /* Warning state */
--hc-color-success: #060;      /* Success state */
--hc-color-desktop-bg: #bfc8d8; /* Desktop background */
/* ... and row colors, tab colors, link colors, highlight, etc. */
```

**Buttons** — 12 tokens covering every button state and variant:
```css
--hc-btn-bg: #fff;
--hc-btn-fg: #000;
--hc-btn-border: 2px solid #000;
--hc-btn-padding: 3px 10px;
--hc-btn-shadow: 1px 1px 0 #000;
--hc-btn-hover-bg: #f0f0f0;
--hc-btn-active-bg: #000;
--hc-btn-active-fg: #fff;
--hc-btn-primary-bg: #000;
--hc-btn-primary-fg: #fff;
--hc-btn-danger-border: 2px solid #a00;
--hc-btn-danger-fg: #a00;
--hc-btn-danger-bg: #fff;
```

Notice how the default theme's buttons are pure black and white with a hard shadow — classic Mac. The `theme-modern` override changes just a few of these to get a completely different feel.

**Windows** — 8 tokens for the windowing chrome:
```css
--hc-window-shadow: 3px 3px 0 #000;
--hc-window-border-radius: 3px;
--hc-window-title-bg: #fff;
--hc-window-title-focused-bg: #fff;
--hc-window-title-stripe-fg: var(--hc-color-fg);
--hc-window-title-stripe-bg: var(--hc-color-bg);
--hc-window-body-bg: #fff;
--hc-window-body-padding: 0;
```

The stripe tokens deserve a callout: focused windows in classic Mac show a pattern of horizontal lines in the title bar. The stripe tokens control the colors of those bands.

**Confirm Widgets** — 13 tokens for the plz-confirm operator widgets:
```css
--hc-confirm-section-gap: 10px;
--hc-confirm-widget-gap: 8px;
--hc-confirm-focus-ring: 2px solid var(--hc-color-fg);
--hc-confirm-focus-offset: 1px;
--hc-confirm-selected-bg: var(--hc-color-fg);
--hc-confirm-selected-fg: var(--hc-color-bg);
--hc-confirm-disabled-opacity: 0.45;
--hc-confirm-dropzone-border: 2px dashed var(--hc-color-border);
--hc-confirm-dropzone-hover-bg: var(--hc-color-highlight);
--hc-confirm-heading-size: 13px;
--hc-confirm-body-size: 12px;
--hc-confirm-caption-size: 10px;
--hc-confirm-progress-fg: var(--hc-color-muted);
```

Notice how some confirm tokens reference other tokens with `var()`. The selected state background (`--hc-confirm-selected-bg`) defaults to `var(--hc-color-fg)` — meaning selected items are fully inverted (black background, white text). When a theme changes `--hc-color-fg` to dark blue, the selection treatment automatically follows.

**Patterns** — SVG data URIs used for dithered textures:
```css
--hc-pattern-stripe: url("data:image/svg+xml,...");   /* 2x2 checker for stripes */
--hc-pattern-desktop: url("data:image/svg+xml,...");   /* 4x4 dither for desktop bg */
```

These give the classic Mac "grainy" feel. The progress bar fill, for example, uses `--hc-pattern-stripe` instead of a solid color.

### Responsive Breakpoints

The tokens file includes responsive overrides at the bottom:

```css
@media (min-width: 1200px) {
  [data-widget="hypercard"] {
    --hc-max-width: 1140px;
    --hc-height: 94vh;
  }
}
@media (min-width: 1600px) {
  [data-widget="hypercard"] {
    --hc-max-width: 1480px;
    --hc-height: 95vh;
  }
}
@media (max-width: 768px) {
  [data-widget="hypercard"] {
    --hc-max-width: 100%;
    --hc-height: 100vh;
    margin: 0;
  }
}
```

This means the desktop shell grows and shrinks with the viewport, but individual widgets don't need to know about responsive design — they reference tokens and the tokens handle it.

The full token catalogue is in [Chapter 20](#chapter-20-complete-token-catalogue).

---

## Chapter 5: Data-Parts: The Attribute System

This chapter explains the attribute system that replaces CSS classes throughout go-go-os. If you're coming from a codebase that uses CSS Modules, Tailwind, or styled-components, this will feel different — but once you understand it, it's remarkably simple and powerful.

### The PARTS Constant

Every data-part string used anywhere in the system is registered in a single file:

**File: `packages/engine/src/parts.ts`**

```ts
export const PARTS = {
  // Primitives
  btn: 'btn',
  chip: 'chip',
  toast: 'toast',
  // Window chrome
  windowFrame: 'window-frame',
  titleBar: 'title-bar',
  closeBox: 'close-box',
  // ... 104 entries total
  // Confirm widgets
  confirmSection: 'confirm-section',
  confirmHeading: 'confirm-heading',
  confirmDropzone: 'confirm-dropzone',
  // ...
} as const;

export type PartName = (typeof PARTS)[keyof typeof PARTS];
```

The naming convention is: camelCase keys in TypeScript, kebab-case values in the DOM. So `PARTS.confirmHeading` produces `data-part="confirm-heading"` in the rendered HTML.

**Always import from PARTS.** Never hardcode a string:

```tsx
// Correct — type-safe, refactorable, grep-friendly:
import { PARTS } from '../../parts';
<div data-part={PARTS.confirmHeading}>{title}</div>

// Wrong — invisible to TypeScript, easy to typo:
<div data-part="confirm-heading">{title}</div>
```

### The Four Data Attributes

go-go-os uses four data attributes, each with a specific role:

| Attribute | What It Expresses | Example Values | Set By |
|-----------|------------------|----------------|--------|
| `data-widget` | Root scoping | Always `"hypercard"` | `HyperCardTheme` |
| `data-part` | What the element *is* | `"btn"`, `"table-row"`, `"windowing-window"` | Widget components |
| `data-state` | What the element is *doing right now* | `"active"`, `"selected"`, `"focused"`, `"open"`, `"disabled"`, `"drag-over"` | Widget components |
| `data-variant` | What *kind* of element it is (permanent) | `"primary"`, `"danger"`, `"dialog"`, `"dark"` | Widget components |

The distinction between `data-state` and `data-variant` is important:

- **State** is dynamic. A button might be `data-state="active"` when pressed and have no state attribute when idle. A list item might be `data-state="selected"` when the user picks it. States change during user interaction.

- **Variant** is permanent for the lifetime of the component. A button with `data-variant="primary"` is always a primary button. It doesn't become primary based on user action — it was rendered that way.

There are also two less common attributes:
- `data-role` — semantic role like `"user"` or `"ai"` (used in chat messages)
- `data-layout` — layout mode like `"grid"` or `"absolute"` (used in the desktop icon layer)

### How CSS Targets Parts

CSS rules use attribute selectors. Here's the specificity hierarchy from lowest to highest:

```css
/* 1. Base token declaration — activates all tokens */
[data-widget="hypercard"] { --hc-color-bg: #fff; ... }

/* 2. Part rule — component baseline */
[data-part="btn"] { background: var(--hc-btn-bg); ... }

/* 3. Pseudo-class modifier — hover, focus, disabled */
[data-part="btn"]:hover { background: var(--hc-btn-hover-bg); }
[data-part="btn"]:focus-visible { outline: ...; }
[data-part="btn"]:disabled { opacity: 0.45; }

/* 4. State modifier — dynamic states */
[data-part="btn"][data-state="active"] {
  background: var(--hc-btn-active-bg);
  color: var(--hc-btn-active-fg);
}

/* 5. Variant modifier — permanent kinds */
[data-part="btn"][data-variant="primary"] {
  background: var(--hc-btn-primary-bg);
  color: var(--hc-btn-primary-fg);
}

/* 6. Theme override — theme-specific part styling */
[data-widget="hypercard"].theme-modern [data-part="btn"] { ... }

/* 7. Contextual rule — parent part scopes child part */
[data-part="windowing-window-title-bar"][data-state="focused"]
  [data-part="windowing-window-title"] { font-weight: bold; }
```

This hierarchy is deliberate. A theme override (level 6) beats any base rule (levels 2-5) because the `.theme-*` class adds specificity. A contextual rule (level 7) lets parent state affect child rendering without JavaScript.

---

## Chapter 6: Primitives: Component CSS Rules

Primitives are the CSS rules in `primitives.css` that target `data-part` selectors and consume tokens. They are the bridge between the design language (tokens) and the rendered DOM (parts).

### File: `packages/engine/src/theme/desktop/primitives.css`

This file contains roughly 300 lines of CSS organized by component. Let's walk through several real examples to understand the patterns.

### Buttons

The button primitive is the most instructive example because it shows all the patterns in one place:

```css
/* ─── Buttons ── */
[data-part="btn"] {
  font-family: var(--hc-font-family);
  background: var(--hc-btn-bg);
  color: var(--hc-btn-fg);
  border: var(--hc-btn-border);
  padding: var(--hc-btn-padding);
  cursor: pointer;
  font-size: 11px;
  border-radius: var(--hc-border-radius);
  box-shadow: var(--hc-btn-shadow);
  user-select: none;
  white-space: nowrap;
}
[data-part="btn"]:hover { background: var(--hc-btn-hover-bg); }
[data-part="btn"][data-state="active"] {
  background: var(--hc-btn-active-bg);
  color: var(--hc-btn-active-fg);
}
[data-part="btn"][data-variant="primary"] {
  background: var(--hc-btn-primary-bg);
  color: var(--hc-btn-primary-fg);
}
[data-part="btn"][data-variant="danger"] {
  background: var(--hc-btn-danger-bg);
  color: var(--hc-btn-danger-fg);
  border: var(--hc-btn-danger-border);
}
```

Notice:
- **Every color, spacing, and border references a token.** No raw values for visual properties.
- **The base rule sets the default appearance.** Hover, state, and variant rules modify only what changes.
- **Structural properties** like `cursor`, `user-select`, and `white-space` are hardcoded because they aren't theme-dependent.

There's also a special "default button" treatment (the Mac convention of a thick ring around the primary action):

```css
[data-part="btn"][data-state="default"] {
  outline: 3px solid var(--hc-color-border);
  outline-offset: 2px;
  border-radius: 10px;
}
```

### Data Tables

Tables demonstrate zebra-striped rows and semantic state colors:

```css
[data-part="table-row"]:nth-child(odd) {
  background: var(--hc-color-row-odd);
}
[data-part="table-row"]:nth-child(even) {
  background: var(--hc-color-row-even);
}
[data-part="table-row"]:hover {
  background: var(--hc-color-row-hover);
}
[data-part="table-cell"][data-state="error"] {
  color: var(--hc-color-error);
  font-weight: bold;
}
[data-part="table-cell"][data-state="warning"] {
  color: var(--hc-color-warning);
  font-weight: bold;
}
```

Themes can change all the row colors by overriding three tokens: `--hc-color-row-even`, `--hc-color-row-odd`, and `--hc-color-row-hover`.

### The Shared Confirm Widget Rules

The confirm widgets (used for plz-confirm operator workflows) share several cross-cutting concerns. Instead of duplicating rules, they're grouped:

```css
/* Shared focus ring for all interactive confirm elements */
[data-part="list-box-item"]:focus-visible,
[data-part="table-row"]:focus-visible,
[data-part="confirm-image-card"]:focus-visible,
[data-part="confirm-grid-cell"]:focus-visible,
[data-part="confirm-rating-option"]:focus-visible {
  outline: var(--hc-confirm-focus-ring);
  outline-offset: var(--hc-confirm-focus-offset);
  z-index: 1;
}

/* Shared disabled treatment */
[data-part="list-box-item"]:disabled,
[data-part="table-row"]:disabled,
[data-part="confirm-image-card"]:disabled,
[data-part="confirm-grid-cell"]:disabled,
[data-part="confirm-rating-option"]:disabled,
[data-part="btn"]:disabled {
  opacity: var(--hc-confirm-disabled-opacity);
  cursor: default;
  pointer-events: none;
}
```

This means every interactive element in the confirm system has the same focus ring and the same disabled dimming. A theme that changes `--hc-confirm-focus-ring` or `--hc-confirm-disabled-opacity` affects all of them at once.

### The Type Scale

The system uses a deliberate type hierarchy. When building widgets, stick to these sizes:

| Size | Token | Used For |
|------|-------|----------|
| 10px | `--hc-confirm-caption-size` | Captions, progress text, metadata |
| 11px | `--hc-font-size` (base) | Most body text, list items, table rows, buttons |
| 12px | `--hc-field-font-size` / `--hc-confirm-body-size` | Field values, descriptions |
| 13px | `--hc-confirm-heading-size` | Section headings |
| 14px | (hardcoded in card-title) | Card titles |

### The Spacing Scale

Spacing follows a tight 2px grid: `2px`, `4px`, `6px`, `8px`, `10px`, `12px`. Larger spacings like `16px` are used for padding major containers (alert dialogs, detail views).

---

## Chapter 7: Shell: The Desktop Chrome

**File: `packages/engine/src/theme/desktop/shell.css`**

The shell CSS styles the desktop environment itself: the window frames, title bars, close buttons, menu bar, icon layer, and resize handles. Shell rules consume the same tokens as everything else, which is why changing `--hc-color-fg` also changes the menu text and window borders — it's all one system.

### Windows

Window chrome is the most complex part of the shell CSS. The key parts:

```css
[data-part="windowing-window"] {
  position: absolute;
  border: 2px solid var(--hc-color-border);
  border-radius: var(--hc-window-border-radius);
  box-shadow: var(--hc-window-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

The title bar uses the classic Mac horizontal stripe pattern on focused windows:

```css
[data-part="windowing-window-title-bar"][data-state="focused"]::before,
[data-part="windowing-window-title-bar"][data-state="focused"]::after {
  content: '';
  position: absolute;
  left: 26px; right: 4px;
  height: 7px;
  background: repeating-linear-gradient(
    to bottom,
    var(--hc-window-title-stripe-fg) 0px,
    var(--hc-window-title-stripe-fg) 1px,
    var(--hc-window-title-stripe-bg) 1px,
    var(--hc-window-title-stripe-bg) 2px
  );
}
```

If your theme doesn't want stripes (because modern macOS doesn't have them), you can disable them:

```css
[data-widget="hypercard"].theme-bigsur
  [data-part="windowing-window-title-bar"][data-state="focused"]::before,
[data-widget="hypercard"].theme-bigsur
  [data-part="windowing-window-title-bar"][data-state="focused"]::after {
  background: none;
}
```

### Desktop Icons

Icons on the desktop sit in the icon layer and support selected state (inverted colors, classic Mac style):

```css
[data-part="windowing-icon"][data-state="selected"]
  [data-part="windowing-icon-label"] {
  background: var(--hc-icon-selected-bg);
  color: var(--hc-icon-selected-fg);
}
```

### Scrollbars

The shell even customizes scrollbar appearance for a consistent retro feel:

```css
[data-part="windowing-desktop-shell"] ::-webkit-scrollbar { width: 16px; }
[data-part="windowing-desktop-shell"] ::-webkit-scrollbar-track {
  background: var(--hc-color-bg);
  border-left: 1px solid var(--hc-color-border);
}
[data-part="windowing-desktop-shell"] ::-webkit-scrollbar-thumb {
  background: var(--hc-color-bg);
  border: 1px solid var(--hc-color-border);
}
```

---

## Part III: Creating Themes

---

## Chapter 8: How Themes Work

A theme is a CSS file that overrides tokens. That's it. There's no JavaScript API, no theme provider object, no configuration file. You write a CSS file, import it, and pass the theme's class name to `HyperCardTheme`.

### The Mechanism

The base tokens are declared on `[data-widget="hypercard"]`:

```css
[data-widget="hypercard"] {
  --hc-color-bg: #fff;
  --hc-btn-bg: #fff;
  /* ... */
}
```

A theme overrides these by adding a class selector that increases specificity:

```css
[data-widget="hypercard"].theme-modern {
  --hc-color-bg: #fafafa;
  --hc-btn-bg: #e8ecf4;
  /* ... */
}
```

Because `.theme-modern` has higher specificity than the bare attribute selector, the theme values win. All the primitive rules that reference `var(--hc-btn-bg)` now resolve to the theme's value.

### The Entry Module Pattern

Each theme has a small TypeScript entry module that imports the CSS and exports a constant:

```ts
// packages/engine/src/desktop-theme-macos1.ts
import './theme';                             // base theme CSS
import './theme/desktop/theme/macos1.css';    // theme override CSS

export const DESKTOP_THEME_MACOS1 = 'theme-macos1';
```

This gives consuming code a type-safe way to reference the theme:

```tsx
import { DESKTOP_THEME_MACOS1 } from '@hypercard/engine/desktop-theme-macos1';

<HyperCardTheme theme={DESKTOP_THEME_MACOS1}>
  {children}
</HyperCardTheme>
```

### What a Theme Can Do

A theme can:

1. **Override any token.** Change colors, fonts, spacing, shadows, borders.
2. **Add part-level rules.** Style specific components in ways that tokens can't express (like making the close button circular).
3. **Disable features.** Set `background: none` on pseudo-elements to remove stripes, patterns, or shadows.
4. **Add new textures.** Override `--hc-pattern-desktop` with a different SVG data URI.

A theme **should not**:

1. Add new data-part selectors. If you need a new part, add it to `parts.ts` — that's a widget change, not a theme change.
2. Use `!important`. The specificity cascade is designed to work without it.
3. Override structural layout (grid templates, flex directions). Themes change visual appearance, not layout.

---

## Chapter 9: Your First Theme: macOS Aqua

Let's build a complete theme that evokes the macOS Aqua era (2001-2006) — Lucida Grande font, gel buttons, soft gradients, and that distinctive blue desktop.

### Step 1: Create the CSS File

Create `packages/engine/src/theme/desktop/theme/macos-aqua.css`:

```css
/* ─── macOS Aqua Theme ─ Layer on top of theme/index packs ─── */

[data-widget="hypercard"].theme-macos-aqua {
  /* Typography — Lucida Grande was the Aqua system font */
  --hc-font-family: 'Lucida Grande', 'Helvetica Neue', 'Arial', sans-serif;
  --hc-font-size: 12px;
  --hc-border-radius: 5px;

  /* Color palette — warm grays with blue accents */
  --hc-color-bg: #ececec;
  --hc-color-fg: #1a1a1a;
  --hc-color-border: #8e8e93;
  --hc-color-muted: #6e6e73;
  --hc-color-accent: #0058d0;
  --hc-color-alt: #f5f5f7;
  --hc-color-highlight: #b4d7ff;
  --hc-color-desktop-bg: #3a6ea5;

  /* Row zebra */
  --hc-color-row-even: #f0f0f5;
  --hc-color-row-odd: #fff;
  --hc-color-row-hover: #d4e5fa;

  /* Buttons — Aqua gel style with gradients */
  --hc-btn-bg: linear-gradient(180deg, #fff 0%, #e0e0e0 100%);
  --hc-btn-fg: #1a1a1a;
  --hc-btn-border: 1px solid #8e8e93;
  --hc-btn-padding: 4px 14px;
  --hc-btn-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  --hc-btn-hover-bg: linear-gradient(180deg, #f0f0f0 0%, #d5d5d5 100%);
  --hc-btn-active-bg: #0058d0;
  --hc-btn-active-fg: #fff;
  --hc-btn-primary-bg: linear-gradient(180deg, #6cb3fa 0%, #0058d0 100%);
  --hc-btn-primary-fg: #fff;

  /* Fields */
  --hc-field-bg: #fff;
  --hc-field-border: 1px solid #8e8e93;
  --hc-field-padding: 4px 8px;

  /* Windows — softer shadows, matching Aqua chrome */
  --hc-window-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  --hc-window-border-radius: 5px;
  --hc-window-title-bg: linear-gradient(180deg, #e8e8e8 0%, #c8c8c8 100%);
  --hc-window-title-focused-bg: linear-gradient(180deg, #ddd 0%, #b8b8b8 100%);
  --hc-window-body-bg: #fff;

  /* Toast */
  --hc-toast-bg: rgba(40, 40, 40, 0.9);
  --hc-toast-fg: #fff;
  --hc-toast-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
```

**Checkpoint:** At this point, you have a theme CSS file that overrides ~30 tokens. The key visual changes:
- Serif-proportional font instead of monospace
- Rounded corners (5px)
- Gradient buttons instead of flat
- Soft drop shadows instead of hard pixel shadows
- Blue-accented desktop

### Step 2: Create the Entry Module

Create `packages/engine/src/desktop-theme-macos-aqua.ts`:

```ts
import './theme';
import './theme/desktop/theme/macos-aqua.css';

export const DESKTOP_THEME_MACOS_AQUA = 'theme-macos-aqua';
```

### Step 3: Add Part-Level Overrides

Some visual changes can't be expressed through tokens alone. For Aqua, we want the close button to look like a round traffic light and the title bar stripes removed:

Add these rules after the token block in `macos-aqua.css`:

```css
/* Rounded close button (Aqua red button) */
[data-widget="hypercard"].theme-macos-aqua [data-part="windowing-close-button"] {
  border-radius: 50%;
  background: #ff5f57;
  border-color: #e0443e;
  width: 12px;
  height: 12px;
}

/* Remove classic title bar stripes */
[data-widget="hypercard"].theme-macos-aqua
  [data-part="windowing-window-title-bar"][data-state="focused"]::before,
[data-widget="hypercard"].theme-macos-aqua
  [data-part="windowing-window-title-bar"][data-state="focused"]::after {
  background: none;
}
```

### Step 4: Preview in Storybook

The fastest way to see your theme is in Storybook. Start it:

```bash
cd go-go-os-frontend/apps/inventory
npx storybook dev -p 6006 --config-dir ../../.storybook --no-open
```

Then create a quick test story or use the theme decorator in an existing one:

```tsx
import { HyperCardTheme } from '@hypercard/engine';
import '../../../packages/engine/src/theme/desktop/theme/macos-aqua.css';

export const AquaThemed: Story = {
  decorators: [
    (Story) => (
      <HyperCardTheme theme="theme-macos-aqua">
        <Story />
      </HyperCardTheme>
    ),
  ],
};
```

**Checkpoint:** Open Storybook, navigate to any widget story, and add the `?args=` parameter or use the decorator. You should see rounded corners, gradient buttons, and the Lucida Grande font. If the buttons still look flat, make sure the CSS file is being imported (check the browser's Network tab).

### Step 5: Use in an App

```tsx
import { DesktopShell } from '@hypercard/engine';
import '@hypercard/engine/theme';
import './theme/desktop/theme/macos-aqua.css';

function App() {
  return <DesktopShell stack={myStack} themeClass="theme-macos-aqua" />;
}
```

Or use the entry module:

```tsx
import { DESKTOP_THEME_MACOS_AQUA } from '@hypercard/engine/desktop-theme-macos-aqua';

function App() {
  return <DesktopShell stack={myStack} themeClass={DESKTOP_THEME_MACOS_AQUA} />;
}
```

---

## Chapter 10: Studying the Existing Themes

The best way to understand how themes work in practice is to read the ones that already exist. Each one demonstrates a different approach to overriding the visual system.

### Default Theme (no class)

The base system. This is what you get when you use `HyperCardTheme` without a `theme` prop. It's defined entirely in `tokens.css`.

**Visual character:** Classic Mac HyperCard. Geneva/Chicago monospace at 11px. Zero border radius — sharp corners everywhere. Pure black on white with `#777` muted text. Buttons have `2px solid #000` borders and `1px 1px 0 #000` hard shadows. Windows cast `3px 3px 0 #000` shadows. Focused title bars show horizontal stripe patterns. The desktop is a gray dithered checkerboard. Selected items are fully inverted (black background, white text).

**Key tokens:** All the defaults in `tokens.css`.

### `theme-classic` (15 lines)

**File: `packages/engine/src/theme/classic.css`**

```css
[data-widget="hypercard"].theme-classic {
  --hc-font-family: 'Chicago', 'Geneva', 'Helvetica', monospace;
  --hc-border-radius: 0;
  --hc-color-bg: #fff;
  --hc-color-fg: #000;
  --hc-color-border: #000;
  --hc-color-accent: #000;
  --hc-color-muted: #555;
  --hc-btn-bg: #ddd;
  --hc-btn-hover-bg: #ccc;

  image-rendering: pixelated;
}
```

This theme barely changes anything — just uses gray buttons instead of white, slightly darker muted text, and adds `image-rendering: pixelated` for that crunchy retro feel. It demonstrates that a theme can be very small and still create a noticeably different impression.

Note how `image-rendering: pixelated` is a regular CSS property set directly on the scoping root, not a token. That's fine — properties that aren't intended to be further overridden can be set directly.

### `theme-modern` (19 lines)

**File: `packages/engine/src/theme/modern.css`**

```css
[data-widget="hypercard"].theme-modern {
  --hc-font-family: 'Inter', 'SF Pro', 'Helvetica Neue', sans-serif;
  --hc-border-radius: 6px;
  --hc-color-bg: #fafafa;
  --hc-color-fg: #1a1a2e;
  --hc-color-border: #ccc;
  --hc-color-accent: #0a84ff;
  --hc-color-muted: #888;
  --hc-color-row-even: #f0f4ff;
  --hc-color-row-hover: #e0e8ff;
  --hc-btn-bg: #e8ecf4;
  --hc-btn-hover-bg: #d4daf0;
  --hc-btn-border: 1px solid #bbb;
  --hc-btn-primary-bg: #0a84ff;
  --hc-btn-danger-bg: #ff3b30;
  --hc-toast-bg: #1a1a2e;
}
```

This is the "jump to modern macOS" theme. Three tokens do most of the work:
- `--hc-font-family` → sans-serif (SF Pro / Inter)
- `--hc-border-radius` → 6px (rounded corners everywhere)
- `--hc-color-border` → `#ccc` (lighter borders)

These three changes alone transform the entire feel from retro to contemporary. The remaining overrides adjust specific colors for consistency. This theme shows the power of the token system: 16 token changes produce a completely different visual identity.

### `theme-macos1` (desktop skin)

**File: `packages/engine/src/theme/desktop/theme/macos1.css`**

This theme lives in the `theme/` subdirectory because it's a desktop-level skin (it changes the desktop background rather than component-level tokens). It demonstrates the entry module pattern:

```ts
// packages/engine/src/desktop-theme-macos1.ts
import './theme';
import './theme/desktop/theme/macos1.css';

export const DESKTOP_THEME_MACOS1 = 'theme-macos1';
```

The CSS changes very little — mainly desktop and window chrome tokens — because it represents macOS System 1, which is visually close to the default HyperCard look.

---

## Chapter 11: Advanced Theme Techniques

### Runtime Token Overrides with `themeVars`

The `HyperCardTheme` component accepts `themeVars` — a record of CSS variable overrides applied as inline styles:

```tsx
<HyperCardTheme themeVars={{
  '--hc-color-bg': darkMode ? '#1a1a2e' : '#fff',
  '--hc-color-fg': darkMode ? '#e0e0e0' : '#000',
}}>
  {children}
</HyperCardTheme>
```

Inline styles have higher specificity than any stylesheet rule, so these overrides win over both base tokens and theme tokens. Use this for:
- Dark mode toggles
- User-configurable accent colors
- Per-window theming (a window could have different background colors)

### Combining Themes

You can layer a theme file with `themeVars`:

```tsx
<HyperCardTheme theme="theme-modern" themeVars={{
  '--hc-color-accent': '#ff6b35',   // custom accent on top of modern
}}>
```

### Recipe: macOS Big Sur / Monterey

Here's a complete recipe for approximating modern macOS (2020+). This combines token overrides with part-level rules:

```css
[data-widget="hypercard"].theme-bigsur {
  --hc-font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  --hc-font-size: 13px;
  --hc-border-radius: 10px;

  --hc-color-bg: #f5f5f7;
  --hc-color-fg: #1d1d1f;
  --hc-color-border: rgba(0, 0, 0, 0.12);
  --hc-color-muted: #86868b;
  --hc-color-accent: #0071e3;
  --hc-color-alt: #fbfbfd;
  --hc-color-row-hover: rgba(0, 113, 227, 0.08);
  --hc-color-desktop-bg: #c9c0d8;

  --hc-btn-bg: #fff;
  --hc-btn-fg: #1d1d1f;
  --hc-btn-border: 1px solid rgba(0, 0, 0, 0.12);
  --hc-btn-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.1);
  --hc-btn-hover-bg: #f2f2f7;
  --hc-btn-primary-bg: #0071e3;
  --hc-btn-primary-fg: #fff;
  --hc-btn-active-bg: #0071e3;
  --hc-btn-active-fg: #fff;

  --hc-field-border: 1px solid rgba(0, 0, 0, 0.15);

  --hc-window-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  --hc-window-border-radius: 10px;
  --hc-window-title-bg: rgba(246, 246, 246, 0.85);
  --hc-window-title-focused-bg: rgba(236, 236, 236, 0.95);
  --hc-window-body-bg: #fff;

  --hc-toast-bg: rgba(50, 50, 50, 0.85);
  --hc-toast-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Disable the classic title bar stripes */
[data-widget="hypercard"].theme-bigsur
  [data-part="windowing-window-title-bar"][data-state="focused"]::before,
[data-widget="hypercard"].theme-bigsur
  [data-part="windowing-window-title-bar"][data-state="focused"]::after {
  background: none;
}

/* Traffic light close button */
[data-widget="hypercard"].theme-bigsur [data-part="windowing-close-button"] {
  border-radius: 50%;
  background: #ff5f57;
  border: none;
  width: 12px;
  height: 12px;
}

[data-widget="hypercard"].theme-bigsur [data-part="windowing-close-button"]:hover {
  background: #e0443e;
}
```

The key differences from the Aqua theme:
- Uses `rgba()` borders instead of solid colors (translucent, modern feel)
- `10px` border radius (Big Sur's more rounded aesthetic)
- Very soft shadows (`0 8px 32px`) instead of hard pixel shadows
- `-apple-system` font stack (uses native SF Pro on Mac)
- Semi-transparent title bars (the `0.85` opacity creates a subtle frosted effect)

---

## Part IV: Building Widgets

---

## Chapter 12: Anatomy of a Widget

Before building your own widget, let's dissect two real widgets to understand the patterns at different complexity levels.

### The Simplest Widget: `Toast`

**File: `packages/engine/src/components/widgets/Toast.tsx`** (16 lines)

```tsx
import { useEffect } from 'react';

export interface ToastProps {
  message: string;
  onDone: () => void;
  duration?: number;
}

export function Toast({ message, onDone, duration = 1800 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return <div data-part="toast">{message}</div>;
}
```

That's the entire widget. Note:

1. **One `data-part` attribute** — `"toast"`. This is the contract with the CSS.
2. **No styling in the component** — the `[data-part="toast"]` rule in `primitives.css` handles everything: position, background, color, font, padding, z-index, box-shadow.
3. **Props are semantic** — `message`, `onDone`, `duration`. The component knows nothing about colors or positioning.
4. **Standard React patterns** — `useEffect` for the auto-dismiss timer, cleanup on unmount.

This is the ideal to strive for: the component is purely about behavior and structure, the CSS is purely about appearance.

### The Canonical Widget: `Btn`

**File: `packages/engine/src/components/widgets/Btn.tsx`** (24 lines)

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  active?: boolean;
  /** Visual emphasis for the default/primary action (draws outer ring). */
  isDefault?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}

export function Btn({ children, active, isDefault, variant, style, ...rest }: BtnProps) {
  const state = isDefault ? 'default' : active ? 'active' : undefined;
  return (
    <button
      data-part="btn"
      data-state={state}
      data-variant={variant !== 'default' ? variant : undefined}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}
```

This shows the full attribute pattern:

1. **`data-part="btn"`** — Identity. CSS uses this to apply the base button appearance.
2. **`data-state`** — Dynamic state computed from props. Can be `"default"` (ring), `"active"` (inverted), or `undefined` (normal). Note how `undefined` means "no state attribute in the DOM."
3. **`data-variant`** — The permanent kind. Can be `"primary"` or `"danger"`. The `default` variant maps to `undefined` (no attribute) because it's the base case.
4. **Extends `ButtonHTMLAttributes`** — All native button props pass through via `...rest`. This means consumers can add `onClick`, `disabled`, `aria-*`, `title`, etc. without the component needing to know about them.
5. **`style` passed through** — For layout purposes (positioning, sizing) consumers can add inline styles without conflicting with the CSS system.

### A Medium-Complexity Widget: `ProgressBar`

**File: `packages/engine/src/components/widgets/ProgressBar.tsx`** (28 lines)

```tsx
import type { CSSProperties } from 'react';
import { PARTS } from '../../parts';

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  width?: number | string;
  label?: string;
}

export function ProgressBar({ value, width, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const outerStyle: CSSProperties | undefined = width != null ? { width } : undefined;

  return (
    <div
      data-part={PARTS.progressBar}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={outerStyle}
    >
      <div data-part={PARTS.progressBarFill} style={{ width: `${clamped}%` }} />
    </div>
  );
}
```

New patterns shown here:

1. **Imports `PARTS`** — Uses `PARTS.progressBar` and `PARTS.progressBarFill` instead of strings. This is the recommended approach for all new widgets.
2. **Two parts** — a root container and a child fill element. This "root + children" pattern is universal for multi-element widgets.
3. **ARIA attributes** — `role="progressbar"` and `aria-*` for accessibility. Interactive widgets should always include appropriate ARIA.
4. **Inline style for dynamic values** — The fill's width is a percentage that changes, so it's an inline style. This is the correct place for inline styles: dynamic layout properties that depend on data. Colors, borders, fonts — those stay in CSS.
5. **Input validation** — The value is clamped to 0-100. Widgets should be defensive about their inputs.

### The CSS Side

For reference, here's the progress bar CSS in `primitives.css`:

```css
[data-part="progress-bar"] {
  height: var(--hc-progress-height);
  border: var(--hc-progress-border);
  background: var(--hc-color-bg);
  position: relative;
  overflow: hidden;
}
[data-part="progress-bar-fill"] {
  height: 100%;
  background-image: var(--hc-pattern-stripe);
  background-repeat: repeat;
  image-rendering: pixelated;
  transition: width 0.3s ease;
}
```

The fill uses the dithered stripe pattern — when a theme changes `--hc-pattern-stripe`, the progress bar automatically gets the new texture.

---

## Chapter 13: Your First Widget: StatusBadge

Let's build a complete widget from scratch: a `StatusBadge` that shows a colored dot and label for system health (healthy, warning, error, offline). We'll go through every step.

### Step 1: Register the Part Names

Open `packages/engine/src/parts.ts` and add three new entries:

```ts
export const PARTS = {
  // ... existing parts ...
  // StatusBadge
  statusBadge: 'status-badge',
  statusBadgeDot: 'status-badge-dot',
  statusBadgeLabel: 'status-badge-label',
} as const;
```

We need three parts: the root container, the colored dot, and the text label. Each gets its own part so themes can style them independently.

### Step 2: Write the Component

Create `packages/engine/src/components/widgets/StatusBadge.tsx`:

```tsx
import { PARTS } from '../../parts';

export type StatusBadgeLevel = 'healthy' | 'warning' | 'error' | 'offline';

export interface StatusBadgeProps {
  level: StatusBadgeLevel;
  label?: string;
  /** Hides the text label, showing only the dot */
  compact?: boolean;
}

export function StatusBadge({ level, label, compact }: StatusBadgeProps) {
  const resolvedLabel = label ?? level;

  return (
    <span data-part={PARTS.statusBadge} data-state={level}>
      <span data-part={PARTS.statusBadgeDot} />
      {!compact && (
        <span data-part={PARTS.statusBadgeLabel}>{resolvedLabel}</span>
      )}
    </span>
  );
}
```

Let's break down the decisions:

- **`data-state={level}`** — The health level is a state, not a variant, because it could change dynamically (a server could go from healthy to error). State-driven styling means the CSS adapts automatically.
- **Default label** — If no `label` prop is given, we show the level name itself. This prevents empty badges.
- **`<span>` root** — StatusBadge is an inline element that sits alongside text. Using `span` instead of `div` lets it flow in paragraphs, table cells, or status bars.

### Step 3: Add CSS Rules

Add to `packages/engine/src/theme/desktop/primitives.css`:

```css
/* ─── StatusBadge ── */
[data-part="status-badge"] {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--hc-font-family);
  font-size: 10px;
}

[data-part="status-badge-dot"] {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid var(--hc-color-border);
  background: var(--hc-color-muted);
  flex-shrink: 0;
}

[data-part="status-badge-label"] {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* State-driven dot colors */
[data-part="status-badge"][data-state="healthy"] [data-part="status-badge-dot"] {
  background: var(--hc-color-success);
  border-color: var(--hc-color-success);
}

[data-part="status-badge"][data-state="warning"] [data-part="status-badge-dot"] {
  background: var(--hc-color-warning);
  border-color: var(--hc-color-warning);
}

[data-part="status-badge"][data-state="error"] [data-part="status-badge-dot"] {
  background: var(--hc-color-error);
  border-color: var(--hc-color-error);
}

[data-part="status-badge"][data-state="offline"] [data-part="status-badge-dot"] {
  background: transparent;
}
```

Key decisions in the CSS:

- **`10px` font size** — This is the caption tier in the type scale, appropriate for a small status indicator.
- **State selectors on the root affect the child** — `[data-part="status-badge"][data-state="error"] [data-part="status-badge-dot"]` targets the dot inside an error-state badge. This is the standard pattern for state-driven child styling.
- **All colors reference tokens** — `var(--hc-color-success)`, `var(--hc-color-error)`, etc. A theme that changes these semantic color tokens will automatically change the badge dot colors.
- **Offline state is transparent** — An empty circle communicates "disconnected."

### Step 4: Export the Component

Add to `packages/engine/src/components/widgets/index.ts`:

```ts
export { StatusBadge, type StatusBadgeProps, type StatusBadgeLevel } from './StatusBadge';
```

### Step 5: Write Storybook Stories

Create `packages/engine/src/components/widgets/StatusBadge.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './StatusBadge';

const meta = {
  title: 'Engine/Widgets/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'select',
      options: ['healthy', 'warning', 'error', 'offline'],
    },
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// One story per visual state
export const Healthy: Story = { args: { level: 'healthy' } };
export const Warning: Story = { args: { level: 'warning', label: 'Degraded' } };
export const Error: Story = { args: { level: 'error', label: 'Down' } };
export const Offline: Story = { args: { level: 'offline' } };
export const Compact: Story = { args: { level: 'healthy', compact: true } };

// Composite story showing all states together
export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <StatusBadge level="healthy" />
      <StatusBadge level="warning" label="Degraded" />
      <StatusBadge level="error" label="Down" />
      <StatusBadge level="offline" />
    </div>
  ),
};
```

**Checkpoint:** Run `npm run storybook:check` from the repo root. It should pass. Open Storybook and navigate to `Engine/Widgets/StatusBadge`. You should see all six stories. Click through them. The dot should change color based on the level. The compact story should show only the dot.

### Step 6: Verify Theme Compatibility

Open the `AllStates` story in Storybook. Now wrap it with different themes to make sure the semantic color tokens produce good results across all visual identities:

- **Default:** Green dot, amber dot, red dot, empty circle — all on white background
- **theme-modern:** Same colors work because `--hc-color-success/warning/error` are semantic and don't change dramatically between themes
- **theme-classic:** Same, possibly with pixelated rendering

If a theme overrides `--hc-color-success` to a different green, the badge automatically matches. That's the system working as intended.

---

## Chapter 14: Widget Patterns & Recipes

This chapter catalogues the common patterns used across the existing 30+ widgets. When building a new widget, start from the closest pattern.

### Pattern: Button-Like Interactive Element

Used by: `Btn`, `GridBoard` cells, `RatingPicker` options, `ImageChoiceGrid` cards

This is the pattern for any clickable surface that needs hover, active, focus, and disabled states:

```tsx
<button
  type="button"
  data-part={PARTS.myClickableItem}
  data-state={isSelected ? 'active' : undefined}
  disabled={isDisabled}
  onClick={() => onSelect(id)}
>
  {label}
</button>
```

The corresponding CSS template:

```css
[data-part="my-clickable-item"] {
  font-family: var(--hc-font-family);
  font-size: 11px;
  border: var(--hc-btn-border);
  background: var(--hc-btn-bg);
  color: var(--hc-btn-fg);
  box-shadow: var(--hc-btn-shadow);
  padding: var(--hc-btn-padding);
  cursor: pointer;
  appearance: none;
}

[data-part="my-clickable-item"]:hover {
  background: var(--hc-btn-hover-bg);
}

[data-part="my-clickable-item"][data-state="active"] {
  background: var(--hc-btn-active-bg);
  color: var(--hc-btn-active-fg);
}

[data-part="my-clickable-item"]:focus-visible {
  outline: var(--hc-confirm-focus-ring);
  outline-offset: var(--hc-confirm-focus-offset);
  z-index: 1;
}

[data-part="my-clickable-item"]:disabled {
  opacity: var(--hc-confirm-disabled-opacity);
  cursor: default;
  pointer-events: none;
}
```

The `appearance: none` reset is important — it strips native browser button styling, giving you full control. The `z-index: 1` on focus-visible ensures the focus ring isn't clipped by adjacent elements.

### Pattern: Selection List

Used by: `SelectableList`, `ListBox`

For single/multi select lists. The key insight is that list items are `<button>` elements, not `<li>` — this gives you free keyboard accessibility and click handling:

```tsx
<div data-part={PARTS.listBox} role="listbox" tabIndex={0}
     aria-multiselectable={isMulti ? true : undefined}>
  {items.map(item => (
    <button
      key={item.id}
      type="button"
      data-part={PARTS.listBoxItem}
      data-state={selected.includes(item.id) ? 'selected' : undefined}
      role="option"
      aria-selected={selected.includes(item.id)}
      disabled={item.disabled}
      onClick={() => toggle(item.id)}
    >
      {item.label}
    </button>
  ))}
</div>
```

CSS uses the inverted selection treatment:

```css
[data-part="list-box-item"][data-state="selected"] {
  background: var(--hc-listbox-selected-bg);
  color: var(--hc-listbox-selected-fg);
}
```

In the default theme, this is black-on-white → white-on-black. In modern themes, it might be blue-on-white.

### Pattern: Confirm Widget Body + Action Bar

Used by: All confirm-runtime widget compositions

Every operator workflow pairs an interactive widget with an action bar at the bottom:

```tsx
<div data-part={PARTS.confirmWidgetBody}>
  {/* Your interactive widget here */}
  <MyWidget value={value} onChange={setValue} />

  <RequestActionBar
    primaryLabel="Submit"
    primaryDisabled={!isValid}
    commentEnabled
    onPrimary={(comment) => submit({ value, comment })}
  />
</div>
```

The `confirm-widget-body` part provides `display: grid` with `--hc-confirm-widget-gap` spacing. The `confirm-action-bar` inside `RequestActionBar` adds a `border-top` separator and right-aligned buttons.

### Pattern: Section Layout

Used by: `ConfirmRequestWindowHost` (script mode)

For multi-step flows with title, description, progress, and content:

```tsx
<div data-part={PARTS.confirmSection}>
  <div data-part={PARTS.confirmHeading}>{title}</div>
  <div data-part={PARTS.confirmDescription}>{description}</div>
  <div data-part={PARTS.confirmProgress}>Step {current} of {total}</div>
  {/* widget content */}
</div>
```

The typography hierarchy is:
- **confirmHeading**: 13px bold — for titles
- **confirmDescription**: 12px normal — for explanatory text
- **confirmProgress**: 10px muted — for step indicators, captions, metadata

### Pattern: Display Panel (Read-Only Context)

Used by: `ConfirmRequestWindowHost` (script display sections)

For showing operator context or read-only information alongside interactive content:

```tsx
<div data-part={PARTS.confirmDisplay}>
  <div data-part={PARTS.confirmDisplayTitle}>{sectionTitle}</div>
  <pre data-part={PARTS.confirmDisplayContent}>{content}</pre>
</div>
```

The display panel uses `--hc-color-alt` background and uppercase muted title treatment to visually separate it from interactive content. A `<pre>` tag preserves formatting for code, logs, or structured text.

### Pattern: Dropzone / Upload Area

Used by: `FilePickerDropzone`

For drag-and-drop file areas with visual feedback:

```tsx
<div
  data-part={PARTS.confirmDropzone}
  data-state={isDragging ? 'drag-over' : undefined}
  onDragEnter={handleDragEnter}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  onClick={openFilePicker}
>
  Drag files here or choose from disk
</div>
```

The CSS uses `--hc-confirm-dropzone-border` (dashed) for the resting state and `--hc-confirm-dropzone-hover-bg` plus solid border when `data-state="drag-over"`. The transition from dashed to solid border provides clear visual feedback during drag operations.

---

## Chapter 15: Complex Widgets: Selection, Search, Keyboard

This chapter examines `SelectableList` — one of the most feature-rich widgets — to show how selection state, search filtering, and keyboard navigation work together.

### The Component Structure

**File: `packages/engine/src/components/widgets/SelectableList.tsx`**

The component has these responsibilities:

1. **Normalize items** — Accepts either plain strings or rich `SelectableListItem` objects
2. **Search filtering** — Filters visible items based on a search query
3. **Selection state** — Tracks selected items in `single` or `multiple` mode
4. **Keyboard navigation** — ArrowUp/Down to move focus, Enter/Space to select

### Selection Logic

The selection helper is a pure function, extracted for reuse:

```tsx
export function nextSelection(
  current: string[],
  id: string,
  mode: SelectableListSelectionMode,
  disabled?: boolean,
): string[] {
  if (disabled) return current;
  if (mode === 'single') return [id];
  return current.includes(id)
    ? current.filter((value) => value !== id)
    : [...current, id];
}
```

Single mode always replaces the selection. Multi mode toggles (add if not present, remove if present). Disabled items are ignored. This function is exported so other components and tests can use it.

### Search

Search is controlled/uncontrolled:

```tsx
const [internalSearch, setInternalSearch] = useState('');
const resolvedSearch = searchText ?? internalSearch;  // prop wins if provided
```

The actual filtering joins all searchable fields and does a case-insensitive includes:

```tsx
function itemMatchesSearch(item: SelectableListItem, normalizedSearch: string): boolean {
  if (!normalizedSearch) return true;
  const haystacks = [item.label, item.description ?? '', item.meta ?? '', ...(item.keywords ?? '')]
    .join(' ')
    .toLowerCase();
  return haystacks.includes(normalizedSearch);
}
```

### Keyboard Navigation

The component maintains an `activeIndex` (visual focus) separate from the selection:

```tsx
const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setActiveIndex((current) => Math.min(current + 1, visibleItems.length - 1));
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    setActiveIndex((current) => Math.max(current - 1, 0));
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const activeItem = visibleItems[activeIndex];
    if (!activeItem) return;
    const next = nextSelection(selectedIds, activeItem.id, mode, activeItem.disabled);
    onSelectionChange(next);
    if (event.key === 'Enter') onSubmit?.(next);
  }
};
```

The active item gets `data-state="active"` (highlighted but not selected), while selected items get `data-state="selected"` (inverted). This distinction lets the CSS show two different visual treatments — a highlight for "I'm looking at this" vs. a selection for "I've chosen this."

### The Render

```tsx
<div data-part={PARTS.confirmWidgetBody}>
  {searchable && (
    <input
      data-part={PARTS.fieldInput}
      type="text"
      value={resolvedSearch}
      placeholder={searchPlaceholder ?? 'Search...'}
      onChange={(event) => setSearch(event.target.value)}
    />
  )}
  <div data-part={PARTS.listBox} role="listbox" tabIndex={0}
       onKeyDown={handleKeyDown} style={style}>
    {visibleItems.map((item, index) => {
      const selected = selectedIds.includes(item.id);
      const active = index === activeIndex;
      return (
        <button
          key={item.id}
          type="button"
          data-part={PARTS.listBoxItem}
          data-state={selected ? 'selected' : active ? 'active' : undefined}
          role="option"
          aria-selected={selected}
          disabled={item.disabled}
          onClick={() => handlePick(item)}
          style={{
            width: '100%',
            textAlign: 'left',
            display: 'grid',
            gridTemplateColumns: item.icon ? 'auto 1fr auto' : '1fr auto',
            gap: 6,
          }}
        >
          {item.icon && <span>{item.icon}</span>}
          <span>
            <span>{item.label}</span>
            {item.description && (
              <span data-part={PARTS.confirmProgress} style={{ display: 'block' }}>
                {item.description}
              </span>
            )}
          </span>
          {item.meta && <span data-part={PARTS.chip}>{item.meta}</span>}
        </button>
      );
    })}
  </div>
</div>
```

Notice how the items reuse existing parts: `PARTS.listBoxItem` for the items, `PARTS.fieldInput` for the search field, `PARTS.confirmProgress` for descriptions, `PARTS.chip` for metadata badges. This means the existing CSS rules style them automatically — no new CSS needed for these elements.

The inline styles here are for layout (`gridTemplateColumns`, `gap`). The visual appearance (colors, borders, selection treatment) comes from the shared CSS rules.

---

## Part V: Composing Applications

---

## Chapter 16: The Desktop Shell & Contributions

The Desktop Shell is the top-level composition layer. It arranges the menu bar, desktop icons, and window layer into a complete macOS-like environment.

### The Contribution System

Apps don't hardcode their presence in the shell. Instead, they declare **contributions** — a composable set of icons, menu items, commands, and content adapters:

```tsx
const contributions: DesktopContribution[] = [{
  id: 'my-app',
  icons: [{
    id: 'my-tool',
    label: 'My Tool',
    icon: '🔧',
  }],
  commands: [{
    id: 'my-app.open',
    priority: 100,
    matches: (id) => id === 'icon.open.my-tool',
    run: (_, ctx) => {
      ctx.dispatch(openWindow({
        id: 'window:my-tool',
        title: 'My Tool',
        icon: '🔧',
        bounds: { x: 100, y: 50, w: 400, h: 300 },
        content: { kind: 'app', appKey: 'my-tool' },
      }));
      return 'handled';
    },
  }],
}];
```

The shell merges all contributions and delegates:
- **Icons** appear on the desktop. Double-clicking fires an `icon.open.{id}` command.
- **Commands** are matched by ID pattern. The first matching command with the highest priority wins.
- **Menus** can add items to the menu bar (File, Edit, View, or custom menus).
- **Startup windows** open automatically when the shell mounts.

### Rendering App Content

When a window has `content: { kind: 'app', appKey: 'my-tool' }`, the shell calls a render function to get the content:

```tsx
<DesktopShell
  stack={stack}
  contributions={contributions}
  renderAppWindow={(appKey) => {
    if (appKey === 'my-tool') return <MyAppWindow data={data} />;
    return null;
  }}
/>
```

Inside that window, you can use any combination of widgets, forms, tables, and layouts. The window chrome (title bar, close button, resize handle) is provided by the shell — your component only needs to render the body content.

### Building an App Window

App windows typically use the card pattern for structure:

```tsx
function MyAppWindow({ data }: { data: AppData }) {
  return (
    <div data-part={PARTS.card} style={{ padding: 12 }}>
      <div data-part={PARTS.cardTitle}>Inventory Dashboard</div>
      <DataTable items={data.items} columns={columns} />
      <div data-part={PARTS.buttonGroup}>
        <Btn variant="primary" onClick={handleExport}>Export</Btn>
        <Btn onClick={handleRefresh}>Refresh</Btn>
      </div>
    </div>
  );
}
```

The `card` part provides `height: 100%` and `overflow: auto`, so content scrolls within the window bounds. The `cardTitle` part provides bold 14px text with bottom margin. The `buttonGroup` part provides a flex row with gaps.

---

## Chapter 17: The Confirm Runtime: A Composition Case Study

The confirm-runtime package (`packages/confirm-runtime/`) is the richest example of widget composition in the system. It demonstrates how to build complex, multi-step operator workflows by orchestrating simple widgets.

### The Composition Host

**File: `packages/confirm-runtime/src/components/ConfirmRequestWindowHost.tsx`**

This single component handles rendering for every confirm request type. It dispatches by widget type:

```
ConfirmRequestWindowHost
├── Simple mode (widgetType = confirm/select/form/table/image/upload/rating/grid)
│   └── renderWidget(widgetType, payload, 'response')
│       ├── Widget component (e.g., SelectableList)
│       └── RequestActionBar
│
└── Script mode (widgetType = 'script')
    └── confirm-section layout
        ├── confirm-heading (title)
        ├── confirm-description (description)
        ├── confirm-progress (Step N of M)
        ├── Back button (optional)
        ├── Display sections (read-only context)
        └── Interactive section (exactly one → renderWidget)
```

### Widget Type Mapping

Each confirm widget type maps to a specific engine widget:

| Widget Type | Engine Component | Support Component |
|-------------|-----------------|-------------------|
| `confirm` | — | `RequestActionBar` (Approve/Reject) |
| `select` | `SelectableList` | `RequestActionBar` |
| `form` | `SchemaFormRenderer` | (built-in submit) |
| `table` | `SelectableDataTable` | `RequestActionBar` |
| `image` | `ImageChoiceGrid` | `RequestActionBar` |
| `upload` | `FilePickerDropzone` | `RequestActionBar` |
| `rating` | `RatingPicker` | `RequestActionBar` |
| `grid` | `GridBoard` | `RequestActionBar` |

### Script Mode: Multi-Step Flows

Script mode is where composition gets interesting. A script defines a sequence of sections, each with display content and/or an interactive widget. The host renders the current section with full layout:

```tsx
<div data-part={PARTS.confirmSection}>
  <div data-part={PARTS.confirmHeading}>{view.title}</div>
  {view.description && (
    <div data-part={PARTS.confirmDescription}>{view.description}</div>
  )}
  {view.progress && (
    <div data-part={PARTS.confirmProgress}>
      Step {view.progress.current} of {view.progress.total}
    </div>
  )}
  {view.allowBack && <Btn onClick={handleBack}>← Back</Btn>}

  {/* Display sections — read-only context */}
  {displaySections.map(section => (
    <div key={section.key} data-part={PARTS.confirmDisplay}>
      <div data-part={PARTS.confirmDisplayTitle}>{section.title}</div>
      <pre data-part={PARTS.confirmDisplayContent}>{section.content}</pre>
    </div>
  ))}

  {/* Interactive section — exactly one */}
  {interactiveSection && renderWidget(interactiveSection.type, interactiveSection, 'script')}
</div>
```

The visual result: a heading, description, step counter, optional back button, any number of gray read-only panels, and one interactive widget at the bottom. The entire layout is driven by the section parts, the typography hierarchy, and the confirm tokens. No custom CSS needed.

This is the payoff of the entire system: complex multi-step operator workflows rendered through simple composition of parts and tokens.

---

## Part VI: Storybook & Quality

---

## Chapter 18: Writing Stories

Storybook is the primary development, testing, and review tool. Every widget and shell component has stories. Here's how to write them correctly.

### Running Storybook

```bash
# From the monorepo root:
cd go-go-os-frontend/apps/inventory
npx storybook dev -p 6006 --config-dir ../../.storybook --no-open
```

Or using tmux for background operation:

```bash
tmux new-session -d -s storybook -c go-go-os-frontend/apps/inventory \
  "npx storybook dev -p 6006 --config-dir ../../.storybook --no-open"
```

### Taxonomy Rules

Story titles must follow a strict taxonomy enforced by `scripts/storybook/check-taxonomy.mjs`. The rules:

| Source Directory | Required Title Prefix |
|------------------|-----------------------|
| `packages/engine/src/components/widgets/` | `Engine/Widgets/` |
| `packages/engine/src/components/shell/` | `Engine/Shell/` |
| `packages/engine/src/plugin-runtime/` | `Engine/PluginRuntime/` |
| `apps/inventory/src/` | `Apps/Inventory/` |
| `apps/todo/src/` | `Apps/Todo/` |

Legacy prefixes like `Packages/`, `Widgets/`, `Shell/`, or `Pages/` are forbidden.

### Story File Placement

- **Widget stories**: Colocated with the component. `Btn.tsx` → `Btn.stories.tsx`.
- **App stories**: Under `src/app/stories/` or `src/features/<feature>/stories/`.

### Story File Naming

| Pattern | Use Case |
|---------|----------|
| `MyWidget.stories.tsx` | Standard component stories |
| `MyWidget.contract.stories.tsx` | Logic/contract verification |
| `MyWidget.workspace.stories.tsx` | Complex multi-window scenarios |

### The Story Template

Here's the standard template. Let's use a real example — the `RatingPicker` stories:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RatingPicker } from './RatingPicker';

const meta = {
  title: 'Engine/Widgets/RatingPicker',  // Must match taxonomy
  component: RatingPicker,
  tags: ['autodocs'],                     // Auto-generated docs
  args: {
    scale: 5,
    style: 'numbers',
    value: 3,
  },
} satisfies Meta<typeof RatingPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Static variants — each demonstrates a different visual configuration
export const Numbers: Story = {};
export const Stars: Story = { args: { style: 'stars', value: 4 } };
export const Emoji: Story = { args: { style: 'emoji', scale: 7, value: 5 } };
export const Slider: Story = {
  args: { style: 'slider', scale: 10, value: 6, lowLabel: 'Poor', highLabel: 'Excellent' },
};

// Interactive variant — uses hooks for real state management
export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState(3);
    return (
      <div style={{ display: 'grid', gap: 8, width: 320 }}>
        <RatingPicker scale={5} style="stars" value={value} onChange={setValue}
                      lowLabel="Low" highLabel="High" />
        <div data-part="field-value">Current: {value}</div>
      </div>
    );
  },
};
```

The pattern:
1. **`meta`** block declares title, component, tags, and default args
2. **Static stories** show each visual variant with minimal args
3. **Interactive stories** use `render()` with hooks to demonstrate real state management
4. **Debug output** uses `data-part="field-value"` to show current state (styled by the system)

### The Theme Decorator

Every story is automatically wrapped with `HyperCardTheme` by the global Storybook decorator in `.storybook/preview.ts`:

```ts
decorators: [
  (Story) => React.createElement(HyperCardTheme, null, React.createElement(Story))
],
```

This means `data-widget="hypercard"` is always present. All tokens and part rules activate automatically. You don't need to wrap your stories in `HyperCardTheme` unless you want a specific theme:

```tsx
export const ModernThemed: Story = {
  decorators: [
    (Story) => (
      <HyperCardTheme theme="theme-modern">
        <Story />
      </HyperCardTheme>
    ),
  ],
};
```

### Fullscreen Stories

For shell components or full-desktop scenarios:

```tsx
const meta = {
  title: 'Engine/Shell/Windowing/DesktopShell',
  component: DesktopShellStory,
  parameters: {
    layout: 'fullscreen',  // overrides the default 'centered' layout
  },
} satisfies Meta<typeof DesktopShellStory>;
```

### Redux Provider Pattern

Components that need Redux (DesktopShell, windowing) must wrap with a Provider:

```tsx
import { Provider } from 'react-redux';
import { createAppStore } from '../../../app/createAppStore';

const { createStore } = createAppStore({});

function StoryWrapper(props: MyComponentProps) {
  const store = createStore();
  return (
    <Provider store={store}>
      <MyComponent {...props} />
    </Provider>
  );
}
```

---

## Chapter 19: Validation & Theme Compatibility

### Running the Taxonomy Check

```bash
npm run storybook:check
```

This runs `scripts/storybook/check-taxonomy.mjs` which scans all `*.stories.ts(x)` files and validates:
- All story titles start with `Apps/` or `Engine/`
- Engine stories use the correct sub-prefix (`Shell/`, `Widgets/`, `PluginRuntime/`)
- App stories live under `src/app/stories/` or `src/features/**/stories/`
- No legacy top-level names

If it fails, you'll see specific errors pointing to the offending file and title. Fix them before committing.

### Theme Compatibility Testing

Every widget should look correct across all themes. When building a new widget:

1. Open the widget's Storybook stories
2. View them in the default theme (no decorator)
3. Add a `theme-modern` decorator and verify rounded corners, lighter borders, and sans-serif font look right
4. Add a `theme-classic` decorator and verify the pixelated rendering and gray buttons look right

The key question: **are all visual differences coming from token values, or is something hardcoded?** If you find yourself thinking "this looks wrong in modern theme," check if you're using a raw color value instead of a token reference.

### The Visual Consistency Checklist

Before any widget is considered complete:

- [ ] Spacing uses the 2/4/6/8/10/12px grid
- [ ] Typography uses the type scale (10/11/12/13/14px)
- [ ] Colors reference semantic tokens (`var(--hc-color-*)`)
- [ ] Interactive elements have `:hover` states
- [ ] Interactive elements have `:focus-visible` with the focus ring tokens
- [ ] Disabled elements use the disabled opacity token
- [ ] Selected/active elements use inverted selection tokens
- [ ] All data-part strings use `PARTS` constants
- [ ] Stories pass taxonomy check
- [ ] Widget renders correctly in default, modern, and classic themes

---

## Part VII: Reference

---

## Chapter 20: Complete Token Catalogue

All CSS custom properties declared in `tokens.css`, grouped by scope. Default values are from the base theme (no theme class).

### Layout

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-width` | `100%` | Root container width |
| `--hc-max-width` | `96vw` | Root container max-width |
| `--hc-height` | `92vh` | Root container height |
| `--hc-font-family` | `"Geneva", "Chicago", "Monaco", monospace` | Global font stack |
| `--hc-font-size` | `11px` | Base font size |
| `--hc-border-radius` | `0px` | Global corner rounding |
| `--hc-ai-panel-width` | `270px` | AI sidebar width |
| `--hc-drawer-max-height` | `200px` | Drawer max height |

### Colors

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-color-bg` | `#fff` | Page/container background |
| `--hc-color-fg` | `#000` | Primary text color |
| `--hc-color-border` | `#000` | Border color |
| `--hc-color-muted` | `#777` | Secondary/caption text |
| `--hc-color-accent` | `#000` | Accent/highlight color |
| `--hc-color-alt` | `#f5f4ed` | Alternate background |
| `--hc-color-ai-bg` | `#f0efe8` | AI panel background |
| `--hc-color-row-even` | `#eee` | Table even row |
| `--hc-color-row-odd` | `#fff` | Table odd row |
| `--hc-color-row-hover` | `#e0e0e0` | Table row hover |
| `--hc-color-error` | `#a00` | Error state |
| `--hc-color-warning` | `#960` | Warning state |
| `--hc-color-success` | `#060` | Success state |
| `--hc-color-link` | `#006` | Link color |
| `--hc-color-highlight` | `#ffffcc` | Highlight / selection bg |
| `--hc-color-tab-bg` | `#ddd` | Tab bar background |
| `--hc-color-tab-inactive` | `#ccc` | Inactive tab |
| `--hc-color-desktop-bg` | `#bfc8d8` | Desktop background |
| `--hc-color-desktop-grid` | `rgba(255, 255, 255, 0.25)` | Desktop grid overlay |

### Buttons

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-btn-bg` | `#fff` | Button background |
| `--hc-btn-fg` | `#000` | Button text |
| `--hc-btn-border` | `2px solid #000` | Button border |
| `--hc-btn-padding` | `3px 10px` | Button padding |
| `--hc-btn-shadow` | `1px 1px 0 #000` | Button drop shadow |
| `--hc-btn-hover-bg` | `#f0f0f0` | Button hover |
| `--hc-btn-active-bg` | `#000` | Active (pressed) bg |
| `--hc-btn-active-fg` | `#fff` | Active (pressed) text |
| `--hc-btn-primary-bg` | `#000` | Primary button bg |
| `--hc-btn-primary-fg` | `#fff` | Primary button text |
| `--hc-btn-danger-border` | `2px solid #a00` | Danger button border |
| `--hc-btn-danger-fg` | `#a00` | Danger button text |
| `--hc-btn-danger-bg` | `#fff` | Danger button bg |

### Chips

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-chip-bg` | `#000` | Chip background |
| `--hc-chip-fg` | `#fff` | Chip text |
| `--hc-chip-border` | `none` | Chip border |
| `--hc-chip-padding` | `2px 8px` | Chip padding |

### Fields

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-field-bg` | `#fff` | Input background |
| `--hc-field-border` | `2px solid #000` | Input border |
| `--hc-field-padding` | `3px 6px` | Input padding |
| `--hc-field-font-size` | `12px` | Input text size |

### Toast

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-toast-bg` | `#000` | Toast background |
| `--hc-toast-fg` | `#fff` | Toast text |
| `--hc-toast-shadow` | `2px 2px 0 #000` | Toast shadow |

### Patterns

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-pattern-stripe` | SVG data URI (2x2 checker) | Stripe/dither pattern |
| `--hc-pattern-desktop` | SVG data URI (4x4 dither) | Desktop background pattern |

### Form Controls

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-check-size` | `14px` | Checkbox/radio size |
| `--hc-check-border` | `2px solid var(--hc-color-border)` | Checkbox/radio border |
| `--hc-check-bg` | `var(--hc-color-bg)` | Checkbox/radio background |
| `--hc-check-mark-color` | `var(--hc-color-fg)` | Check mark color |
| `--hc-listbox-selected-bg` | `var(--hc-color-fg)` | ListBox selected bg |
| `--hc-listbox-selected-fg` | `var(--hc-color-bg)` | ListBox selected text |

### Dropdowns & Menus

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-dropdown-shadow` | `1px 1px 0 var(--hc-color-border)` | Dropdown trigger shadow |
| `--hc-dropdown-panel-shadow` | `2px 2px 0 var(--hc-color-border)` | Dropdown panel shadow |
| `--hc-context-menu-shadow` | `2px 2px 0 var(--hc-color-border)` | Context menu shadow |
| `--hc-context-menu-min-width` | `170px` | Context menu min width |

### Dialogs

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-alert-shadow` | `3px 3px 0 var(--hc-color-border)` | Alert dialog shadow |
| `--hc-alert-border` | `3px solid var(--hc-color-border)` | Alert dialog border |
| `--hc-alert-max-width` | `300px` | Alert dialog max width |

### Progress & Tools

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-progress-height` | `16px` | Progress bar height |
| `--hc-progress-border` | `2px solid var(--hc-color-border)` | Progress bar border |
| `--hc-tool-size` | `27px` | Tool palette item size |
| `--hc-tool-columns` | `2` | Tool palette column count |
| `--hc-disclosure-arrow-size` | `10px` | Disclosure arrow size |

### Halo (Selection Handles)

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-halo-handle-size` | `20px` | Halo handle diameter |
| `--hc-halo-border` | `2px dashed #555` | Halo selection border |
| `--hc-halo-label-bg` | `#ff0` | Halo label background |

### Confirm Widgets

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-confirm-section-gap` | `10px` | Gap between sections |
| `--hc-confirm-widget-gap` | `8px` | Gap within widgets |
| `--hc-confirm-focus-ring` | `2px solid var(--hc-color-fg)` | Keyboard focus outline |
| `--hc-confirm-focus-offset` | `1px` | Focus outline offset |
| `--hc-confirm-selected-bg` | `var(--hc-color-fg)` | Selected item bg |
| `--hc-confirm-selected-fg` | `var(--hc-color-bg)` | Selected item text |
| `--hc-confirm-disabled-opacity` | `0.45` | Disabled dimming |
| `--hc-confirm-dropzone-border` | `2px dashed var(--hc-color-border)` | Upload dropzone border |
| `--hc-confirm-dropzone-hover-bg` | `var(--hc-color-highlight)` | Dropzone drag-over bg |
| `--hc-confirm-heading-size` | `13px` | Section heading |
| `--hc-confirm-body-size` | `12px` | Body text |
| `--hc-confirm-caption-size` | `10px` | Caption/muted text |
| `--hc-confirm-progress-fg` | `var(--hc-color-muted)` | Progress text color |

### Windows & Desktop Shell

| Token | Default | Purpose |
|-------|---------|---------|
| `--hc-desktop-menubar-height` | `28px` | Menu bar height |
| `--hc-desktop-menubar-z` | `1000` | Menu bar z-index |
| `--hc-window-shadow` | `3px 3px 0 #000` | Window shadow |
| `--hc-window-border-radius` | `3px` | Window corner rounding |
| `--hc-window-title-bg` | `#fff` | Title bar background |
| `--hc-window-title-focused-bg` | `#fff` | Focused title bar bg |
| `--hc-window-title-stripe-fg` | `var(--hc-color-fg)` | Title stripe dark band |
| `--hc-window-title-stripe-bg` | `var(--hc-color-bg)` | Title stripe light band |
| `--hc-window-body-bg` | `#fff` | Window body background |
| `--hc-window-body-padding` | `0` | Window body padding |
| `--hc-menu-hover-bg` | `var(--hc-color-fg)` | Menu item hover bg |
| `--hc-menu-hover-fg` | `var(--hc-color-bg)` | Menu item hover text |
| `--hc-icon-selected-bg` | `var(--hc-color-fg)` | Selected icon bg |
| `--hc-icon-selected-fg` | `var(--hc-color-bg)` | Selected icon text |

---

## Chapter 21: Complete Parts Catalogue

All 104 part names from `parts.ts`, organized by domain. The PARTS key is the TypeScript identifier; the data-part value is what appears in the DOM.

### Core UI

| PARTS key | data-part value | Used by |
|-----------|----------------|---------|
| `btn` | `btn` | Btn |
| `chip` | `chip` | Chip |
| `toast` | `toast` | Toast |

### Legacy Window Chrome

| PARTS key | data-part value |
|-----------|----------------|
| `windowFrame` | `window-frame` |
| `titleBar` | `title-bar` |
| `closeBox` | `close-box` |
| `titleText` | `title-text` |

### Tabs and Navigation

| PARTS key | data-part value |
|-----------|----------------|
| `tabBar` | `tab-bar` |
| `tab` | `tab` |
| `navBar` | `nav-bar` |
| `tabControl` | `tab-control` |

### Data Display

| PARTS key | data-part value | Used by |
|-----------|----------------|---------|
| `dataTable` | `data-table` | DataTable, SelectableDataTable |
| `tableHeader` | `table-header` | DataTable, SelectableDataTable |
| `tableRow` | `table-row` | DataTable, SelectableDataTable |
| `tableCell` | `table-cell` | DataTable |
| `tableEmpty` | `table-empty` | DataTable, SelectableList |
| `tableFooter` | `table-footer` | DataTable |
| `reportView` | `report-view` | ReportView |
| `reportRow` | `report-row` | ReportView |
| `statusBar` | `status-bar` | Various |

### Cards and Layout

| PARTS key | data-part value |
|-----------|----------------|
| `card` | `card` |
| `cardTitle` | `card-title` |
| `cardBody` | `card-body` |
| `cardToolbar` | `card-toolbar` |
| `menuGrid` | `menu-grid` |
| `contentArea` | `content-area` |

### Forms and Fields

| PARTS key | data-part value | Used by |
|-----------|----------------|---------|
| `fieldGrid` | `field-grid` | FieldRow |
| `fieldLabel` | `field-label` | FieldRow |
| `fieldValue` | `field-value` | FieldRow, story debug output |
| `fieldInput` | `field-input` | FormView, SelectableList, FilePickerDropzone |
| `fieldSelect` | `field-select` | FormView |
| `formView` | `form-view` | FormView |
| `detailView` | `detail-view` | DetailView |
| `buttonGroup` | `button-group` | Various |
| `filterBar` | `filter-bar` | FilterBar |

### Chat and AI

| PARTS key | data-part value |
|-----------|----------------|
| `chatView` | `chat-view` |
| `chatTimeline` | `chat-timeline` |
| `chatMessage` | `chat-message` |
| `chatComposer` | `chat-composer` |
| `chatInput` | `chat-input` |
| `chatSuggestions` | `chat-suggestions` |
| `aiPanel` | `ai-panel` |
| `aiPanelHeader` | `ai-panel-header` |

### Desktop Windowing Shell

| PARTS key | data-part value |
|-----------|----------------|
| `windowingDesktopShell` | `windowing-desktop-shell` |
| `windowingMenuBar` | `windowing-menu-bar` |
| `windowingMenuButton` | `windowing-menu-button` |
| `windowingMenuPanel` | `windowing-menu-panel` |
| `windowingMenuItem` | `windowing-menu-item` |
| `windowingMenuShortcut` | `windowing-menu-shortcut` |
| `windowingMenuSeparator` | `windowing-menu-separator` |
| `windowingIconLayer` | `windowing-icon-layer` |
| `windowingIcon` | `windowing-icon` |
| `windowingIconGlyph` | `windowing-icon-glyph` |
| `windowingIconLabel` | `windowing-icon-label` |
| `windowingWindowLayer` | `windowing-window-layer` |
| `windowingWindow` | `windowing-window` |
| `windowingWindowTitleBar` | `windowing-window-title-bar` |
| `windowingCloseButton` | `windowing-close-button` |
| `windowingWindowTitle` | `windowing-window-title` |
| `windowingWindowBody` | `windowing-window-body` |
| `windowingResizeHandle` | `windowing-resize-handle` |

### Form Controls

| PARTS key | data-part value | Used by |
|-----------|----------------|---------|
| `checkbox` | `checkbox` | Checkbox |
| `checkboxMark` | `checkbox-mark` | Checkbox |
| `radioButton` | `radio-button` | RadioButton |
| `radioButtonDot` | `radio-button-dot` | RadioButton |
| `listBox` | `list-box` | ListBox, SelectableList |
| `listBoxItem` | `list-box-item` | ListBox, SelectableList |

### Dropdown and Context Menus

| PARTS key | data-part value |
|-----------|----------------|
| `dropdownMenu` | `dropdown-menu` |
| `dropdownMenuTrigger` | `dropdown-menu-trigger` |
| `dropdownMenuPanel` | `dropdown-menu-panel` |
| `dropdownMenuItem` | `dropdown-menu-item` |
| `contextMenu` | `context-menu` |
| `contextMenuItem` | `context-menu-item` |
| `contextMenuSeparator` | `context-menu-separator` |

### Dialogs and Overlays

| PARTS key | data-part value | Used by |
|-----------|----------------|---------|
| `alertDialog` | `alert-dialog` | AlertDialog |
| `alertDialogIcon` | `alert-dialog-icon` | AlertDialog |
| `alertDialogMessage` | `alert-dialog-message` | AlertDialog |

### Tools and Progress

| PARTS key | data-part value | Used by |
|-----------|----------------|---------|
| `toolPalette` | `tool-palette` | ToolPalette |
| `toolPaletteItem` | `tool-palette-item` | ToolPalette |
| `progressBar` | `progress-bar` | ProgressBar |
| `progressBarFill` | `progress-bar-fill` | ProgressBar |

### Disclosure and Halo

| PARTS key | data-part value |
|-----------|----------------|
| `disclosureTriangle` | `disclosure-triangle` |
| `disclosureTriangleArrow` | `disclosure-triangle-arrow` |
| `disclosureTriangleContent` | `disclosure-triangle-content` |
| `haloTarget` | `halo-target` |
| `haloHandle` | `halo-handle` |
| `haloLabel` | `halo-label` |
| `haloBorder` | `halo-border` |

### Confirm Widgets

| PARTS key | data-part value | Purpose |
|-----------|----------------|---------|
| `confirmSection` | `confirm-section` | Section layout container |
| `confirmHeading` | `confirm-heading` | 13px bold title |
| `confirmDescription` | `confirm-description` | 12px description |
| `confirmProgress` | `confirm-progress` | 10px muted caption |
| `confirmDisplay` | `confirm-display` | Read-only context panel |
| `confirmDisplayTitle` | `confirm-display-title` | Panel title (uppercase, muted) |
| `confirmDisplayContent` | `confirm-display-content` | Panel body text (pre-wrap) |
| `confirmWidgetBody` | `confirm-widget-body` | Widget grid container |
| `confirmActionBar` | `confirm-action-bar` | Footer action area |
| `confirmActionButtons` | `confirm-action-buttons` | Button row (flex-end) |
| `confirmDropzone` | `confirm-dropzone` | File upload drop area |
| `confirmImageCard` | `confirm-image-card` | Image choice button |
| `confirmGridCell` | `confirm-grid-cell` | Grid board cell |
| `confirmRatingOption` | `confirm-rating-option` | Rating button |
| `confirmRatingLabels` | `confirm-rating-labels` | Low/high label row |
| `confirmFileList` | `confirm-file-list` | Uploaded file list |
| `confirmFileItem` | `confirm-file-item` | Single file row |

---

## Chapter 22: New Widget Checklist

Use this checklist every time you build a new widget. It's the condensed version of everything in this playbook.

### Design

- [ ] Decide which data-parts you need (one root + children)
- [ ] Decide which states the widget has (active, selected, disabled, drag-over, etc.)
- [ ] Decide which variants the widget has (primary, danger, compact, etc.)
- [ ] Map: state → `data-state` (dynamic), variant → `data-variant` (permanent)

### Implementation

- [ ] Register part names in `packages/engine/src/parts.ts`
- [ ] Create component in `packages/engine/src/components/widgets/`
- [ ] Import `PARTS` — never hardcode data-part strings
- [ ] Use `data-state` for dynamic states, `data-variant` for permanent kinds
- [ ] Use semantic HTML: `<button>` for clickable, `<ul>/<li>` for lists, ARIA roles
- [ ] No inline styles for colors, borders, shadows, or typography — use CSS
- [ ] Inline styles OK for layout dimensions, grid templates, and dynamic positioning
- [ ] Pass through native HTML attributes via `...rest` for composability

### CSS

- [ ] Add rules to `packages/engine/src/theme/desktop/primitives.css`
- [ ] Reference tokens (`var(--hc-*)`) — never use raw color/size values
- [ ] Add `:hover` state for interactive elements
- [ ] Add `:focus-visible` with `var(--hc-confirm-focus-ring)` for keyboard navigation
- [ ] Add `:disabled` with `var(--hc-confirm-disabled-opacity)` for disabled elements
- [ ] Add `[data-state="active"]` or `[data-state="selected"]` for selection
- [ ] Use the type scale: 10px caption, 11px body, 12px field, 13px heading
- [ ] Use the spacing scale: 2, 4, 6, 8, 10, 12px

### Export

- [ ] Add to `packages/engine/src/components/widgets/index.ts`
- [ ] Export both the component and its props/types

### Stories

- [ ] Create `*.stories.tsx` colocated with the component
- [ ] Set title to `Engine/Widgets/{ComponentName}`
- [ ] Include `tags: ['autodocs']`
- [ ] One story per visual state
- [ ] One interactive story with hooks if the widget is stateful
- [ ] One composite story showing the widget in context
- [ ] Run `npm run storybook:check` to validate taxonomy

### Theme Compatibility

- [ ] Verify in default theme (sharp corners, monospace, hard shadows)
- [ ] Verify in `theme-modern` (rounded corners, sans-serif, lighter borders)
- [ ] Verify in `theme-classic` (pixelated rendering, gray buttons)
- [ ] All visual differences come from token values, not hardcoded values or conditionals

---

## Chapter 23: Troubleshooting

### "My widget has no styling"

**Cause:** The widget isn't inside a `HyperCardTheme` wrapper, so `[data-widget="hypercard"]` isn't in the DOM and no tokens activate.

**Fix:** Ensure `HyperCardTheme` wraps your component. In Storybook, the global decorator handles this. In an app, either `DesktopShell` or an explicit `<HyperCardTheme>` wrapper is needed.

### "My theme overrides aren't taking effect"

**Cause 1:** The CSS file isn't being imported. Check the browser's Network tab for the file.

**Cause 2:** The class name doesn't match. The `theme` prop on `HyperCardTheme` must match the class in your CSS (e.g., `theme="theme-macos-aqua"` matches `.theme-macos-aqua`).

**Cause 3:** Specificity. Your theme selector needs the `.theme-*` class to beat the base `[data-widget="hypercard"]` selector. Make sure your rule is `[data-widget="hypercard"].theme-my-skin` (with the dot), not `[data-widget="hypercard"] .theme-my-skin` (with a space — that's a descendant selector).

### "storybook:check is failing"

**Cause:** Your story title doesn't match the taxonomy rules.

**Fix:** Check the error message — it tells you the expected prefix. Widget stories must be `Engine/Widgets/...`. App stories must be `Apps/{AppName}/...`. Shell stories must be `Engine/Shell/...`.

### "My data-part string isn't in PARTS"

**Fix:** Add it to `packages/engine/src/parts.ts`. Use camelCase for the key and kebab-case for the value. Remember to add it before the `} as const;` closing.

### "Focus ring isn't showing on my interactive element"

**Cause:** Your element might not be a native interactive element (`<button>`, `<input>`, `<a>`). `div` and `span` elements don't receive focus by default.

**Fix:** Either use a `<button>` (preferred for clickable elements) or add `tabIndex={0}` to make the element focusable. Then add `:focus-visible` CSS.

### "My widget looks right in default theme but wrong in modern theme"

**Cause:** You're using hardcoded values (e.g., `border: 2px solid #000`) instead of tokens (e.g., `border: var(--hc-btn-border)`).

**Fix:** Replace all raw color, border, shadow, and spacing values with token references. The token system is designed so that changing tokens changes everything — but only if everything uses tokens.

### "Inline styles are overriding my CSS"

**Cause:** Inline styles have higher specificity than stylesheet rules. If your component sets `style={{ background: '#fff' }}`, no CSS rule can override it.

**Fix:** Only use inline styles for layout properties (width, height, gridTemplateColumns, position, transform) and dynamic values. Never inline colors, fonts, borders, or shadows — those belong in CSS via tokens.

### "I need a visual change that tokens can't express"

**Solution:** Add a part-level rule in your theme CSS file. For example, if you need the close button to be circular (which no token controls), add:

```css
[data-widget="hypercard"].theme-my-skin [data-part="windowing-close-button"] {
  border-radius: 50%;
}
```

This is the correct escape hatch. Theme-specific part rules sit after the token block in your theme CSS file.

---

*This playbook is a living document. Update it when new patterns, tokens, or parts are introduced.*
