---
Title: Diary
Ticket: vm-runtime-packages
Status: active
Topics:
    - frontend
    - react
    - npm
    - widgets
    - vm
    - quickjs
    - runtime
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/os-chat/package.json
      Note: publication candidate metadata
    - Path: packages/os-confirm/package.json
      Note: publication candidate metadata
    - Path: packages/os-kanban/package.json
      Note: runtime kanban package metadata
    - Path: packages/os-scripting/package.json
      Note: main VM package metadata
    - Path: packages/os-ui-cards/package.json
      Note: runtime UI package metadata
ExternalSources: []
Summary: Chronological implementation diary for publishing the QuickJS VM runtime package family and adding staged VM examples to the standalone demo app.
LastUpdated: 2026-05-11T17:15:00-04:00
WhatFor: Use this to understand what was changed, why it changed, what failed, and how to continue the VM package publication work.
WhenToUse: Before reviewing or continuing the vm-runtime-packages ticket.
---


# Diary

## Goal

This diary records the work to publish the browser-side QuickJS VM runtime package family and then teach its public APIs through staged examples in the standalone npm demo application.

## Step 1: Created the ticket and mapped the VM runtime package boundary

I created a dedicated docmgr ticket for the VM package publication and consumer examples, then mapped the runtime system from the package-level QuickJS core up through the React host and runtime DSL packages. The goal was to give a new intern enough architectural context to implement safely, not just a checklist of files to edit.

The investigation confirmed that the VM system is centered on `packages/os-scripting`, with `packages/os-ui-cards` and `packages/os-kanban` supplying concrete runtime packages and surface renderers. It also confirmed that the publication work spans multiple packages and that the standalone demo needs new examples after stage 06.

### Prompt Context

**User prompt (verbatim):** "publish the vm packages, then build more step by step pages in the demo application to showcase their use.

Create a new docmgr ticket for that, and Create  a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and the nupload to remarkable.


Then, create a set of tasks, and implement them one by one, committing at appropriat eintervals, and keeping a detailed diary"

**Assistant interpretation:** Create a new docmgr ticket for publishing the VM runtime package family, write a detailed intern-oriented design and implementation guide, upload the documentation bundle to reMarkable, then execute the package publication and demo-example implementation task by task with commits and diary updates.

**Inferred user intent:** Make the QuickJS VM/runtime subsystem as reusable and learnable as the already published shell/widgets/REPL packages, with strong documentation and a public standalone consumer proof.

**Commit (code):** pending at time of step.

### What I did

- Created docmgr ticket `vm-runtime-packages` in `go-go-os-frontend`.
- Added the design document:
  - `ttmp/2026/05/11/vm-runtime-packages--publish-vm-runtime-packages-and-build-staged-scripting-examples/design-doc/01-public-vm-runtime-packages-and-staged-consumer-examples.md`
- Added this diary:
  - `ttmp/2026/05/11/vm-runtime-packages--publish-vm-runtime-packages-and-build-staged-scripting-examples/reference/01-diary.md`
- Created a detailed task list in:
  - `ttmp/2026/05/11/vm-runtime-packages--publish-vm-runtime-packages-and-build-staged-scripting-examples/tasks.md`
- Inspected the package graph and current package metadata for:
  - `packages/os-chat/package.json`
  - `packages/os-confirm/package.json`
  - `packages/os-scripting/package.json`
  - `packages/os-ui-cards/package.json`
  - `packages/os-kanban/package.json`
- Gathered evidence from the runtime core, runtime service, bootstrap VM API, host bridge, package registries, and shell adapter points.
- Ran a baseline validation pass:

```bash
npm run typecheck -w packages/os-chat
npm run typecheck -w packages/os-confirm
npm run typecheck -w packages/os-scripting
npm run typecheck -w packages/os-ui-cards
npm run typecheck -w packages/os-kanban

npm test -w packages/os-chat
npm test -w packages/os-scripting
npm test -w packages/os-ui-cards
npm test -w packages/os-kanban

npm run build:dist -w packages/os-chat
npm run build:dist -w packages/os-confirm
npm run build:dist -w packages/os-scripting
npm run build:dist -w packages/os-ui-cards
npm run build:dist -w packages/os-kanban
```

### Why

- The VM runtime is a more complex consumer surface than the shell/widgets packages because it has VM-side APIs, host-side registries, Redux session state, runtime package installation, tree validation, event handling, and browser bundling constraints.
- A detailed design doc reduces the risk of publishing a package that is technically installable but hard for consumers to wire correctly.
- The baseline validation confirms that the package family works before publication metadata and README changes.

### What worked

- All baseline typecheck commands passed.
- `os-chat`, `os-scripting`, `os-ui-cards`, and `os-kanban` test suites passed.
- All five current `build:dist` commands passed before metadata changes.
- The existing `build-dist.mjs` script already copies `.vm.js` assets and rewrites `workspace:*` dependencies, which is exactly what this package wave needs.

### What didn't work

- N/A for the first planning and baseline-validation step.

### What I learned

- `os-scripting` is the main VM package, but it is not useful alone for a beginner consumer; `os-ui-cards` must be published with it so consumers can register the base `ui` runtime package and `ui.card.v1` renderer.
- `os-kanban` is a good advanced example because it proves runtime package dependencies: the Kanban runtime package depends on `ui`.
- The shell needs a runtime surface window adapter supplied by the consumer or a scripting integration package; the default shell adapters do not render VM surfaces.

### What was tricky to build

- The VM architecture crosses multiple layers that look similar at first: runtime packages are VM preludes, runtime surface types are host renderers, runtime bundles are user-authored source strings, and runtime surfaces are per-window renderable units.
- The implementation plan needs to keep these boundaries separate. Publishing `os-scripting` alone would not prove consumer usability, while folding scripting into `os-shell` would make the shell package heavier and blur the package layering.

### What warrants a second pair of eyes

- Review the public API surface of `os-scripting`; it currently exports low-level internals as well as consumer APIs.
- Review whether package README language is clear about stable beginner APIs versus advanced/internal service APIs.
- Review the demo examples to ensure they do not teach direct registry mutation or unvalidated action shapes.

### What should be done in the future

- Publish the VM package family after metadata/README updates and dist validation.
- Add staged demo examples 07-09.
- Add a later `wesen-os` migration ticket that consumes the public package family.

### Code review instructions

- Start with the design doc and ensure the architecture description matches source files.
- Review package metadata before publication.
- Validate with the baseline commands listed above.
- Confirm the demo remains a public npm consumer after package publication.

### Technical details

Core runtime files inspected:

```text
packages/os-scripting/src/plugin-runtime/quickJsSessionCore.ts
packages/os-scripting/src/plugin-runtime/runtimeService.ts
packages/os-scripting/src/plugin-runtime/stack-bootstrap.vm.js
packages/os-scripting/src/runtime-host/RuntimeSurfaceSessionHost.tsx
packages/os-scripting/src/runtime-packages/runtimePackageRegistry.ts
packages/os-scripting/src/runtime-packs/runtimeSurfaceTypeRegistry.tsx
packages/os-ui-cards/src/runtimeRegistration.tsx
packages/os-kanban/src/runtimeRegistration.tsx
```

Initial package publication candidates:

```text
@go-go-golems/os-chat@0.1.0
@go-go-golems/os-confirm@0.1.0
@go-go-golems/os-scripting@0.1.0
@go-go-golems/os-ui-cards@0.1.0
@go-go-golems/os-kanban@0.1.0
```
