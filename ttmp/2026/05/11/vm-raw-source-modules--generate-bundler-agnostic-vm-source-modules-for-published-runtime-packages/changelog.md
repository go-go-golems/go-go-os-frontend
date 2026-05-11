# Changelog

## 2026-05-11

- Initial workspace created


## 2026-05-11

Created Option A raw-source module fix ticket, design guide, strict diary, and implementation tasks.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/vm-raw-source-modules--generate-bundler-agnostic-vm-source-modules-for-published-runtime-packages/design-doc/01-bundler-agnostic-vm-source-modules-option-a-fix.md — design and implementation guide
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/vm-raw-source-modules--generate-bundler-agnostic-vm-source-modules-for-published-runtime-packages/reference/01-diary.md — initial diary
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/vm-raw-source-modules--generate-bundler-agnostic-vm-source-modules-for-published-runtime-packages/tasks.md — task checklist


## 2026-05-11

Implemented generator, generated VM source modules, replaced public runtime ?raw imports, and validated target package tests (commit 9246f3a).

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-kanban/src/runtimeRegistration.tsx — imports generated kanban prelude
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-scripting/src/plugin-runtime/runtimeService.ts — imports generated bootstrap source
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-ui-cards/src/runtimeRegistration.tsx — imports generated ui prelude
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/scripts/packages/generate-vm-source-modules.mjs — source module generator


## 2026-05-11

Published VM raw-source patch packages, removed the standalone demo Vite workaround, and validated stages 07-09 (package commit 0aacc8e, demo commit 23da0e9).

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/2026-05-11--npm-go-go-os-test/vite.config.ts — workaround removed after patch validation
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-kanban/package.json — published os-kanban@0.1.1
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-scripting/package.json — published os-scripting@0.1.1
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-ui-cards/package.json — published os-ui-cards@0.1.1


## 2026-05-11

Published README/documentation patch releases for VM packages with no-workaround bundler guidance and notify.show host chrome notes (commit aabda33).

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-kanban/README.md — public npm README now documents no Vite optimizeDeps workaround
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-scripting/README.md — public npm README now documents generated source modules and toast host pattern
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-ui-cards/README.md — public npm README now uses current notify.show action shape

