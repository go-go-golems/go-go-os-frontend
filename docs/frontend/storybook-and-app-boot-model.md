# Storybook Ownership and App Boot Model

## Purpose

Clarify ownership boundaries for Storybook and runtime app bootstrapping in this monorepo so cleanup and refactor work can be done without cross-package confusion.

## Repository Model

The frontend is structured as:

- shared engine package: `packages/os-core`
- app packages: `apps/inventory`, `apps/todo`, `apps/crm`, `apps/book-tracker-debug`

The engine contains shared UI/runtime/store primitives. Apps compose domain reducers, stack definitions, and app-specific windows/features.

## Storybook Ownership

## Runtime location

Storybook is launched from root and delegated to inventory's Storybook runtime:

- root script: `npm run storybook`
- delegated script: `npm run storybook -w apps/inventory`

Config source:

- `.storybook/main.ts`
- `.storybook/preview.ts`

## Scope

Despite runtime dependencies being hosted in `apps/inventory`, Storybook config is **workspace-global**.

The configured story globs include:

- inventory stories
- todo stories
- book-tracker-debug stories
- crm stories
- engine stories

Because of this, Storybook should be treated as a shared frontend platform artifact, not an inventory-only tool.

## Alias ownership

`@go-go-golems/os-core` aliasing for Storybook is configured in:

- `.storybook/main.ts`

Application dev/build aliasing is configured by Vite helper:

- `tooling/vite/createHypercardViteConfig.ts`

Do not duplicate alias logic in ad-hoc places; use the shared helper where possible.

## App Boot Model

Each app follows the same boot contract:

1. `main.tsx` imports CSS and mounts React root.
2. Wrap app with Redux `Provider` using app store.
3. App root renders desktop shell and app-specific windows/cards.

Representative files:

- `apps/inventory/src/main.tsx`
- `apps/inventory/src/app/store.ts`
- `apps/inventory/src/App.tsx`

Shared store composition:

- engine factory: `packages/os-core/src/app/createAppStore.ts`
- app reducers passed in by each app store module

## Boundary Rules

To keep cleanup work low-risk and understandable:

1. Engine package owns shared primitives and generic infrastructure.
2. App packages own domain reducers, stack data, and app window behavior.
3. Storybook config is globally scoped and owned at repo root.
4. Changes to shared boot/store contracts should be done in engine first, then app adapters.
5. App-specific experiments should not leak into engine exports without explicit API intent.

## Operational Guidance

When adding stories:

1. Put reusable stories in `packages/os-core/src`.
2. Put app-specific behavior stories in the corresponding app.
3. Prefer package-aligned title prefixes (`Apps/*`, `Engine/*`) and feature-aligned story placement (`src/app/stories`, `src/features/**/stories`).
4. Prefer `createStoryHelpers` for card-page app stories.

When changing app boot behavior:

1. Keep `main.tsx` minimal (mount + provider + app).
2. Keep `store.ts` responsible for reducer composition.
3. Keep `App.tsx` focused on shell wiring and app window registration.

## Storybook Policy

For detailed contribution and taxonomy rules, see:

- `docs/frontend/storybook.md`

## Verification Snapshot (2026-02-17, HC-46)

This document was re-verified during HC-43 Phase 1 hard-cutover replay against current sources:

- Storybook config:
  - `.storybook/main.ts`
  - `.storybook/preview.ts`
- Root Storybook script:
  - `package.json` (`storybook` delegates to `apps/inventory` script)
- App boot entrypoints:
  - `apps/inventory/src/main.tsx`
  - `apps/todo/src/main.tsx`
  - `apps/crm/src/main.tsx`
  - `apps/book-tracker-debug/src/main.tsx`
- Vite app bootstrap helper:
  - `tooling/vite/createHypercardViteConfig.ts`
