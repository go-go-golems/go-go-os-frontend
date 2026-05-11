# vm-raw-source-modules

This ticket designs the Option A fix for published VM packages: generate TypeScript string modules from `.vm.js` source files so package runtime code no longer imports `.vm.js?raw` from `node_modules`.

Primary docs:

- `design-doc/01-bundler-agnostic-vm-source-modules-option-a-fix.md` — design and implementation guide.
- `reference/01-diary.md` — chronological diary.
- `tasks.md` — implementation checklist.
