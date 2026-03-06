# Changelog

## 2026-03-05

- Initial workspace created
- Added a shared Storybook frame helper for rich widgets in `packages/rich-widgets/src/storybook/frameDecorators.tsx`.
- Expanded story coverage for all 20 composite rich widgets; story count increased from 79 to 128 exported stories.
- Normalized Storybook taxonomy for the widgets that still used `Rich Widgets/...` titles.
- Validation:
  - `node ttmp/2026/03/05/OS-15-RICH-WIDGET-STORYBOOK-COVERAGE--rich-widget-storybook-coverage-redux-scenarios-and-cleanup-follow-through/scripts/audit-story-exports.mjs`
  - `npm run storybook:check`
  - `npm run test -w packages/rich-widgets`
- Recorded pre-existing typecheck baseline from `npm run typecheck -w packages/rich-widgets`:
  - workspace `rootDir` / file-list issues involving `packages/engine`
  - missing `@hypercard/desktop-os` type resolution in `packages/rich-widgets`
  - existing `Oscilloscope.tsx` setter-signature errors unrelated to the story changes
