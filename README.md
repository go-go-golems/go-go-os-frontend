# go-go-os-frontend

`go-go-os-frontend` is the platform repository for shared desktop frontend packages used by the go-go-os desktop runtime.

It no longer owns:
- the inventory frontend app (`go-go-app-inventory/apps/inventory`)
- the launcher frontend bundle (`wesen-os/apps/os-launcher`)

## What Lives Here

- Frontend platform packages:
  - `packages/engine`
  - `packages/desktop-os`
  - `packages/confirm-runtime`
- Example/demo apps that exercise platform APIs:
  - `apps/todo`
  - `apps/crm`
  - `apps/book-tracker-debug`

## Repository Layout

```text
go-go-os-frontend/
  apps/
    todo/
    crm/
    book-tracker-debug/
  packages/
    engine/
    desktop-os/
    confirm-runtime/
```

## Frontend Quick Start

```bash
npm install
npm run build
npm run test
npm run storybook
```

## Backend Host Package

The backend host Go module was extracted to a dedicated repository:

- `github.com/go-go-golems/go-go-os-backend`
- package import: `github.com/go-go-golems/go-go-os-backend/pkg/backendhost`

## Ownership Boundary

Use this repo when you are:
- building shared desktop platform primitives
- updating shared Storybook/catalog tooling

Use other repos when you are:
- editing inventory app UX or reducers -> `go-go-app-inventory`
- editing launcher composition UI/bundling/smoke flow -> `wesen-os`
- extending backend app-host contracts (`backendhost`) -> `go-go-os-backend`
