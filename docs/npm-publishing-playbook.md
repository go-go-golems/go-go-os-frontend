# npm Publishing Playbook

This repository publishes public `@go-go-golems/os-*` packages to npm through npm Trusted Publishing. The npmjs publish workflow is tokenless: it does not use `NODE_AUTH_TOKEN`, `NPM_TOKEN`, GitHub npm secrets, or Vault npm tokens.

## Current publishing model

- GitHub repository: `go-go-golems/go-go-os-frontend`
- Workflow file: `.github/workflows/publish-npm.yml`
- GitHub environment: `npm-production`
- npm trusted publisher for each public package:
  - provider: GitHub Actions
  - repository: `go-go-golems/go-go-os-frontend`
  - workflow filename: `publish-npm.yml`
  - environment: `npm-production`
- package publishing access: `Require two-factor authentication and disallow tokens`

The workflow publishes generated `dist/` directories. It typechecks selected packages, runs package tests when present, runs `build:dist`, performs a pack smoke test, and then publishes with npm's OIDC trusted publisher path.

## Package sets

Package ordering is defined in `scripts/packages/package-sets.mjs`. Use package sets instead of ad hoc lists when publishing multiple packages.

Common choices:

- `single`: publish exactly one package by package name or directory.
- `os-core`: publish `packages/os-core`.
- `first-wave`: publish the first package group.
- `shell-stack`: publish packages needed by the shell stack.
- `vm-stack`: publish packages needed by VM-related packages.
- `all`: publish every public package in dependency order.

## Before publishing

1. Decide whether this is a single-package release or a package-set release.
2. Bump package versions in the relevant `packages/*/package.json` files.
3. Run local validation when the checkout has dependencies installed:

   ```bash
   pnpm install --frozen-lockfile
   npm run typecheck -w packages/<package>
   npm run build:dist -w packages/<package>
   node scripts/packages/pack-smoke.mjs packages/<package>
   ```

   For package sets, run the equivalent loop or use the GitHub workflow's dry-run path.

4. Inspect generated package metadata when changing exports or dependencies:

   ```bash
   cat packages/<package>/dist/package.json
   ```

   Confirm there are no `workspace:*` dependencies and that exports point to runtime `.js` files and `.d.ts` declarations.

5. Commit and push to `main`.

## Publish under `next`

Use `next` to prove a real release without moving the default install target.

Single package example:

```bash
gh workflow run publish-npm.yml \
  --repo go-go-golems/go-go-os-frontend \
  --ref main \
  -f package_set=single \
  -f package_name=@go-go-golems/os-core \
  -f npm_tag=next \
  -f dry_run=false \
  -f skip_existing=true \
  -f confirm_latest_publish=''
```

Package-set example:

```bash
gh workflow run publish-npm.yml \
  --repo go-go-golems/go-go-os-frontend \
  --ref main \
  -f package_set=shell-stack \
  -f package_name='' \
  -f npm_tag=next \
  -f dry_run=false \
  -f skip_existing=true \
  -f confirm_latest_publish=''
```

Watch the run:

```bash
gh run watch <run-id> --repo go-go-golems/go-go-os-frontend --exit-status
```

Verify the published dist-tag:

```bash
npm view @go-go-golems/os-core dist-tags --json
```

## Publish or promote `latest`

A real `latest` publish through the workflow requires explicit confirmation:

```bash
gh workflow run publish-npm.yml \
  --repo go-go-golems/go-go-os-frontend \
  --ref main \
  -f package_set=single \
  -f package_name=@go-go-golems/os-core \
  -f npm_tag=latest \
  -f dry_run=false \
  -f skip_existing=true \
  -f confirm_latest_publish=CONFIRM_LATEST
```

If a version has already been published under `next`, prefer promoting after validation:

```bash
npm dist-tag add @go-go-golems/os-core@<version> latest
```

## Adding a new package

1. Add the package to `packages/` with public npm metadata.
2. Add it to `scripts/packages/package-sets.mjs` in dependency order.
3. Add or verify its `build:dist` script.
4. Publish the first version interactively if the package does not exist yet:

   ```bash
   npm publish packages/<package>/dist --access public --tag next --otp=<OTP>
   ```

5. Configure npm Trusted Publishing:

   ```bash
   npx -y npm@latest trust github @go-go-golems/<package> \
     --repo go-go-golems/go-go-os-frontend \
     --file publish-npm.yml \
     --env npm-production \
     --allow-publish
   ```

6. Set package publishing access to disallow tokens:

   ```bash
   npx -y npm@latest access set mfa=publish @go-go-golems/<package>
   ```

7. Publish the next version through GitHub Actions to verify the trusted path.

## Security rules

- Do not add `NODE_AUTH_TOKEN`, `NPM_TOKEN`, or Vault npm token reads to `.github/workflows/publish-npm.yml`.
- Keep `permissions.id-token: write` in the publish workflow.
- Keep the workflow filename and GitHub environment aligned with npm trusted publisher settings.
- Keep package publishing access set to `Require two-factor authentication and disallow tokens`.
- Use `next` for proof publishes and reserve `latest` for explicit promotion.

## Known failure modes

- `npm trust ... E404`: the package does not exist yet, or the npm account lacks package write access.
- `npm publish E404`: npm could not authorize the scoped package publish. Check package trust settings and package access.
- `npm publish EOTP`: the command is using interactive account authentication and needs a current 2FA code.
- `workspace:*` appears in `dist/package.json`: do not publish; fix `build-dist.mjs` or package metadata first.
- A package set publishes out of order: fix `scripts/packages/package-sets.mjs` before publishing again.
