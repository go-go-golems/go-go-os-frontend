# Tasks — OS-10-PHASE2-SHARED-PRIMITIVES

## Create Primitives

- [x] Create WidgetToolbar component + CSS + data-part
- [x] Create WidgetStatusBar component + CSS + data-part
- [x] Create ModalOverlay component + CSS + data-part
- [x] Create ProgressBar component + CSS + data-part
- [x] Create EmptyState component + CSS + data-part
- [x] Create SearchBar component + CSS + data-part
- [x] Create Separator component + CSS + data-part
- [x] Register all new primitives in parts.ts and index.ts
- [x] Add theme/primitives.css and import in theme/index.ts

## Migrate Widgets

- [x] Migrate toolbars (12 widgets) to WidgetToolbar
- [x] Migrate status bars (14 widgets) to WidgetStatusBar
- [x] Migrate modals (6 widgets, 7 instances) to ModalOverlay
- [x] Migrate progress bars (2 widgets, 4 instances) to ProgressBar
- [x] Migrate empty states (7 widgets, 10 instances) to EmptyState
- [x] Migrate search bars (1 widget) to SearchBar
- [x] Migrate separators (7 widgets, 13 instances) to Separator
- [ ] Remove orphaned per-widget CSS rules (deferred — requires visual testing)

## Skipped (intentionally)

- ModalOverlay: 3 widgets had no overlay pattern (most had none)
- ProgressBar: DeepResearch (indeterminate state), StreamLauncher (seekable)
- SearchBar: GameFinder (no icon), SteamLauncher (bare input)

## Verification

- [x] TypeScript check passes (no new errors, only pre-existing)
- [ ] All primitive stories render correctly (visual check pending)
- [ ] All migrated widget stories visually match before/after (visual check pending)
- [ ] Desktop integration story launches all 20 widgets (visual check pending)
- [x] Diary updated
- [x] Changelog updated
- [x] `docmgr doctor` passes
