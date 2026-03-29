# @go-go-golems/os-shell

OS-level launcher composition package for go-go-os frontend runtime integration.

## Boundary Rule

- `desktop-os` may import `@go-go-golems/os-core`.
- `@go-go-golems/os-core` must not import `desktop-os`.

This package owns launcher/app orchestration contracts (manifest, module registration, app window resolution, and single-store composition).
