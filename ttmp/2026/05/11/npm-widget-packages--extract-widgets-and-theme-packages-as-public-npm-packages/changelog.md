# Changelog

## 2026-05-11

- Initial workspace created


## 2026-05-11

Created ticket, mapped current package/widget/theme architecture, documented TypeScript build blocker, and wrote the public npm extraction design guide plus diary.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-widget-packages--extract-widgets-and-theme-packages-as-public-npm-packages/design-doc/01-public-npm-packages-for-reusable-widgets-and-themes.md — primary analysis and implementation guide
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-widget-packages--extract-widgets-and-theme-packages-as-public-npm-packages/reference/01-diary.md — chronological investigation diary


## 2026-05-11

Validated ticket docs with docmgr doctor and uploaded the design bundle to reMarkable at /ai/2026/05/11/npm-widget-packages.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-widget-packages--extract-widgets-and-theme-packages-as-public-npm-packages/design-doc/01-public-npm-packages-for-reusable-widgets-and-themes.md — primary uploaded implementation guide
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-widget-packages--extract-widgets-and-theme-packages-as-public-npm-packages/index.md — ticket index included in uploaded bundle
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-widget-packages--extract-widgets-and-theme-packages-as-public-npm-packages/reference/01-diary.md — uploaded investigation diary


## 2026-05-11

Recorded that the @go-go-golems npm organization has been created and the user is the owner, clearing the package-scope prerequisite for public publishing.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-widget-packages--extract-widgets-and-theme-packages-as-public-npm-packages/reference/01-diary.md — Step 2 records npm organization ownership confirmation


## 2026-05-11

Verified local npm CLI auth: npm user wesen3000 is an owner of the go-go-golems organization.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-widget-packages--extract-widgets-and-theme-packages-as-public-npm-packages/reference/01-diary.md — Step 3 records npm CLI login and organization owner verification


## 2026-05-11

Prepared first-wave public npm packages, validated build/dist and standalone tarball smoke test, and reached npm OTP gate for real publish.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/.npmrc — repo-local npmjs scoped registry config for @go-go-golems
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/package.json — added TypeScript dev dependency via pnpm
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-core/package.json — public npm metadata for core package
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-repl/package.json — public npm metadata for repl package
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-widgets/package.json — public npm metadata and optional shell peer for widgets package
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/pnpm-lock.yaml — pnpm lockfile created/updated for package build dependencies
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-widget-packages--extract-widgets-and-theme-packages-as-public-npm-packages/reference/01-diary.md — Step 4 records package prep


## 2026-05-11

Checked 1Password CLI for the npm OTP; found the Npmjs login item but it has no OTP field, so publishing still requires a manual OTP or adding TOTP to the item.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-widget-packages--extract-widgets-and-theme-packages-as-public-npm-packages/reference/01-diary.md — Step 5 records 1Password OTP check and remaining publish blocker


## 2026-05-11

Tried publishing with the NPM_TOKEN from .envrc via temporary npm config; npm still required OTP, so the token does not bypass publish-time 2FA.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-widget-packages--extract-widgets-and-theme-packages-as-public-npm-packages/reference/01-diary.md — Step 6 records token-based publish attempt and OTP result


## 2026-05-11

Published @go-go-golems/os-core, os-repl, and os-widgets at 0.1.0 to npmjs and validated registry installation with a standalone Vite/React smoke build.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-core/package.json — published public package metadata for @go-go-golems/os-core@0.1.0
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-repl/package.json — published public package metadata for @go-go-golems/os-repl@0.1.0
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-widgets/package.json — published public package metadata for @go-go-golems/os-widgets@0.1.0
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-widget-packages--extract-widgets-and-theme-packages-as-public-npm-packages/reference/01-diary.md — Step 7 records successful publish and registry smoke validation


## 2026-05-11

Added package READMEs, verified dist/ copies them, and prepared patch release 0.1.1 for os-core, os-repl, and os-widgets.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-core/README.md — public npm package onboarding for os-core
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-repl/README.md — public npm package onboarding for os-repl
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-widgets/README.md — public npm package onboarding for os-widgets
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-widget-packages--extract-widgets-and-theme-packages-as-public-npm-packages/reference/01-diary.md — Step 8 README and patch release prep


## 2026-05-11

Fixed os-repl input focus after submit, added a package-local repro and regression test, then published os-repl@0.1.5 and os-widgets@0.1.2.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-repl/repro/focus/src/main.tsx — package-local browser repro
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-repl/src/MacRepl.test.tsx — focus regression test
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-repl/src/ReplInputLine.tsx — uses aria-disabled instead of disabled so submit does not blur the input
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-widgets/package.json — patch bump to consume fixed os-repl

