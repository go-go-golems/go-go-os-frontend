# @hypercard/desktop-os

OS-level launcher composition package for go-go-os frontend runtime integration.

## Boundary Rule

- `desktop-os` may import `@hypercard/engine`.
- `@hypercard/engine` must not import `desktop-os`.

This package owns launcher/app orchestration contracts (manifest, module registration, app window resolution, and single-store composition).
