# Storybook Maintainer Guide

## Purpose

Define the hard-cut Storybook organization rules for this monorepo so stories stay navigable, ownership-aligned, and easy to maintain.

## Ownership

Storybook is workspace-global and owned at repo root:

- config: `.storybook/main.ts`, `.storybook/preview.ts`
- root scripts: `package.json`
- runtime implementation dependency surface: `apps/inventory/package.json`

## Navigation Contract

Top-level Storybook tree must be owner-first:

- `Apps/*`
- `Engine/*`

Required app prefixes:

- `Apps/Inventory/*`
- `Apps/Todo/*`
- `Apps/Crm/*`
- `Apps/BookTrackerDebug/*`

Required package prefix:

- `Engine/*`

Legacy top-level groups are not allowed:

- `Widgets/*`, `Shell/*`, `Pages/*`, `Chat/*`, `Todo/*`, `CRM/*`, `BookTracker*`, `Plugin Runtime/*`

## Story Placement Contract

App stories must be in one of:

- `apps/<app>/src/app/stories/*.stories.tsx`
- `apps/<app>/src/features/**/stories/*.stories.tsx`

Engine stories must be in one of:

- `packages/os-core/src/components/**/*.stories.tsx`
- `packages/os-core/src/plugin-runtime/**/*.stories.tsx`

Flat app buckets such as `apps/<app>/src/stories/*` are deprecated and must not be reintroduced.

## Title Policy

Each story module must expose a canonical title matching ownership path.

Examples:

- `Apps/Inventory/FullApp`
- `Apps/Inventory/Chat/EventViewer`
- `Engine/Components/Shell/Windowing/DesktopShell`
- `Engine/PluginRuntime/RuntimeMutation`

## Large Story Files

Avoid monolith story modules. Split by scenario class when files grow:

- core/default flows
- widget/data-rich scenarios
- interaction/error/mobile edge cases

Current split examples:

- `packages/os-core/src/components/widgets/ChatWindow.stories.tsx`
- `packages/os-core/src/components/widgets/ChatWindow.widgets.stories.tsx`
- `packages/os-core/src/components/widgets/ChatWindow.interaction.stories.tsx`
- `packages/os-core/src/components/shell/windowing/DesktopPrimitives.stories.tsx`
- `packages/os-core/src/components/shell/windowing/DesktopPrimitives.workspace.stories.tsx`

## Addon Policy

Configured addons in `.storybook/main.ts` must match installed addons in `apps/inventory/package.json`.

If an addon is installed but unused, either:

1. wire it intentionally in config, or
2. remove the dependency.

## Guardrails

Run this before committing Storybook changes:

```bash
npm run storybook:check
npm run -w packages/os-core test
```

`storybook:check` is implemented in `scripts/storybook/check-taxonomy.mjs` and enforces:

- canonical title prefixes
- path/title ownership alignment
- placement rules
- legacy-title rejection

## PR Checklist

1. Does every new story land under `Apps/*` or `Engine/*`?
2. Is the story file under an allowed placement path?
3. Did you avoid introducing a new monolithic story file?
4. Does `npm run storybook:check` pass?
5. If addons changed, were config and dependencies updated together?
