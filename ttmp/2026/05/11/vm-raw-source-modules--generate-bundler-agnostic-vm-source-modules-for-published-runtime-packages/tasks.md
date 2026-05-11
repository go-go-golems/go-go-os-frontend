# Tasks

## TODO

- [ ] 1. Add `scripts/packages/generate-vm-source-modules.mjs` with normal and `--check` modes.
- [ ] 2. Generate and commit `stackBootstrapSource.generated.ts`, `uiPackageSource.generated.ts`, and `kanbanPackageSource.generated.ts` from the `.vm.js` source files.
- [ ] 3. Replace runtime-critical `?raw` imports in `os-scripting`, `os-ui-cards`, and `os-kanban` with generated TypeScript module imports.
- [ ] 4. Add a root/package script for generating or checking VM source modules.
- [ ] 5. Run source validation for `os-scripting`, `os-ui-cards`, and `os-kanban`: typecheck, tests, and generator `--check`.
- [ ] 6. Bump `os-scripting`, `os-ui-cards`, and `os-kanban` to `0.1.1`.
- [ ] 7. Build dist artifacts for the three packages and inspect that runtime JS no longer imports `.vm.js?raw`.
- [ ] 8. Dry-run publish the three patch packages from `dist/`.
- [ ] 9. Publish `@go-go-golems/os-scripting@0.1.1`, `@go-go-golems/os-ui-cards@0.1.1`, and `@go-go-golems/os-kanban@0.1.1` to npm.
- [ ] 10. Update the standalone demo to consume the `0.1.1` patch packages.
- [ ] 11. Remove the demo Vite/Storybook `optimizeDeps` workaround for VM packages and update README wording.
- [ ] 12. Validate demo `npm ls`, `typecheck`, production build, Storybook build, dev server startup, and browser smoke for stages 07-09.
- [ ] 13. Update diary, changelog, file relations, and docmgr validation.
- [ ] 14. Upload the updated ticket bundle to reMarkable.
