# Changelog

## 2026-05-11

- Initial workspace created


## 2026-05-11

Created ticket and seeded npmjs Trusted Publishing CI/CD design, tasks, and diary.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-trusted-publishing-cicd--set-up-npmjs-trusted-publishing-ci-cd-for-public-packages/design-doc/01-npmjs-trusted-publishing-ci-cd-design.md — Initial CI/CD design
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-trusted-publishing-cicd--set-up-npmjs-trusted-publishing-ci-cd-for-public-packages/reference/01-diary.md — Initial diary
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-trusted-publishing-cicd--set-up-npmjs-trusted-publishing-ci-cd-for-public-packages/tasks.md — Initial task list


## 2026-05-11

Backfilled diary with npmjs package-side Trusted Publisher setup and verification.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-trusted-publishing-cicd--set-up-npmjs-trusted-publishing-ci-cd-for-public-packages/reference/01-diary.md — Backfilled Step 2 with package-side Trusted Publisher setup details


## 2026-05-11

Added publish-npm.yml and npmjs package-set publish helper for Trusted Publishing (commit e5e5fa2).

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/.github/workflows/publish-npm.yml — Workflow implementation
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/scripts/packages/package-sets.mjs — Package-set definitions
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/scripts/packages/publish-npm-package-set.mjs — Publish helper


## 2026-05-11

Ran the first single-package publish-npm dry-run; fixed setup-node/pnpm cache and Node/npm setup issues; successful run 25705092100.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/.github/workflows/publish-npm.yml — Workflow fixes for successful dry-run
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-trusted-publishing-cicd--set-up-npmjs-trusted-publishing-ci-cd-for-public-packages/reference/01-diary.md — Backfilled dry-run results and failures
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-trusted-publishing-cicd--set-up-npmjs-trusted-publishing-ci-cd-for-public-packages/tasks.md — Marked single-package dry-run task complete


## 2026-05-11

Committed pnpm-lock.yaml, restored frozen/cached CI installs, and published @go-go-golems/os-chat@0.1.1 through npm Trusted Publishing with provenance.

### Related Files

- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/.github/workflows/publish-npm.yml — Trusted publish workflow used for os-chat@0.1.1
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/packages/os-chat/package.json — Version bump to 0.1.1
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/pnpm-lock.yaml — Tracked lockfile for deterministic pnpm CI installs
- /home/manuel/workspaces/2026-05-11/npm-packages-go-go-os/go-go-os-frontend/ttmp/2026/05/11/npm-trusted-publishing-cicd--set-up-npmjs-trusted-publishing-ci-cd-for-public-packages/reference/01-diary.md — Step 5 release diary

