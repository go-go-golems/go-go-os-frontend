---
Title: npm Trusted Publishing Release Runbook
Ticket: npm-trusted-publishing-cicd
Status: active
Topics:
    - npm
    - go-go-os
    - frontend
DocType: playbook
Intent: long-term
Owners: []
RelatedFiles:
    - Path: .github/workflows/publish-npm.yml
      Note: Workflow invoked by the release runbook
    - Path: pnpm-lock.yaml
      Note: Lockfile required by frozen CI installs
    - Path: scripts/packages/package-sets.mjs
      Note: Package sets documented by the runbook
    - Path: scripts/packages/publish-npm-package-set.mjs
      Note: Publish helper documented by the runbook
ExternalSources: []
Summary: Operator runbook for publishing public go-go-os packages to npmjs through GitHub Actions Trusted Publishing.
LastUpdated: 2026-05-11T20:30:00-04:00
WhatFor: Run safe dry-run and real npmjs Trusted Publishing releases.
WhenToUse: Use before publishing any @go-go-golems package from go-go-os-frontend to npmjs.
---


# npm Trusted Publishing Release Runbook

## Goal

Publish public `@go-go-golems/*` packages from `go-go-os-frontend` to npmjs through GitHub Actions Trusted Publishing, with deterministic installs, validation, pack smoke checks, and provenance.

## Trusted identity

npmjs package settings trust this exact identity:

```text
Repository: go-go-golems/go-go-os-frontend
Workflow: publish-npm.yml
Environment: npm-production
```

The workflow file must remain:

```text
.github/workflows/publish-npm.yml
```

The publish job must keep:

```yaml
permissions:
  contents: read
  id-token: write

environment: npm-production
```

## Package-side setup status

Trusted Publishing has been configured and verified for:

```text
@go-go-golems/os-core
@go-go-golems/os-repl
@go-go-golems/os-widgets
@go-go-golems/os-shell
@go-go-golems/os-chat
@go-go-golems/os-confirm
@go-go-golems/os-scripting
@go-go-golems/os-ui-cards
@go-go-golems/os-kanban
```

## Standard single-package release

### 1. Choose package and version

Pick a package with a committed change that warrants publication. Bump its version in `packages/<pkg>/package.json`.

Example:

```bash
python3 - <<'PY'
import json
from pathlib import Path
p = Path('packages/os-core/package.json')
data = json.loads(p.read_text())
data['version'] = '0.1.2'
p.write_text(json.dumps(data, indent=2) + '\n')
PY
```

### 2. Update the pnpm lockfile if needed

Run:

```bash
pnpm install --lockfile-only
pnpm install --frozen-lockfile
```

If `pnpm-lock.yaml` changes, commit it with the version bump.

### 3. Local validation

Run package-local checks:

```bash
pnpm --filter @go-go-golems/os-core run typecheck
pnpm --filter @go-go-golems/os-core run test
pnpm --filter @go-go-golems/os-core run build:dist
node scripts/packages/pack-smoke.mjs packages/os-core
node scripts/packages/publish-npm-package-set.mjs --package packages/os-core --tag latest --dry-run
```

For packages without a test script, the workflow skips tests. Locally, check `package.json` before running `pnpm --filter ... run test`.

### 4. Commit and push to main

The current project policy is to push release infrastructure and package release commits directly to `main`.

```bash
git add packages/os-core/package.json pnpm-lock.yaml
git commit -m "Bump os-core for trusted publish"
git push origin HEAD:main
git push origin HEAD:task/npm-packages-go-go-os
```

### 5. Run workflow dry-run

```bash
gh workflow run publish-npm.yml \
  --repo go-go-golems/go-go-os-frontend \
  --ref main \
  -f package_set=single \
  -f package_name=@go-go-golems/os-core \
  -f npm_tag=latest \
  -f dry_run=true \
  -f skip_existing=false \
  -f confirm_latest_publish=''
```

Watch it:

```bash
gh run list --repo go-go-golems/go-go-os-frontend --workflow publish-npm.yml --limit 3
gh run watch <run-id> --repo go-go-golems/go-go-os-frontend --exit-status
```

### 6. Run real publish

Use this only after the dry-run passes:

```bash
gh workflow run publish-npm.yml \
  --repo go-go-golems/go-go-os-frontend \
  --ref main \
  -f package_set=single \
  -f package_name=@go-go-golems/os-core \
  -f npm_tag=latest \
  -f dry_run=false \
  -f skip_existing=false \
  -f confirm_latest_publish='CONFIRM_LATEST'
```

The workflow and helper both guard real `latest` publishes. `confirm_latest_publish=CONFIRM_LATEST` is required.

## Package-set release

Use package sets only when all package versions and dependencies are ready.

Available sets:

```text
os-core
first-wave
shell-stack
vm-stack
all
```

Example dry-run:

```bash
gh workflow run publish-npm.yml \
  --repo go-go-golems/go-go-os-frontend \
  --ref main \
  -f package_set=vm-stack \
  -f package_name='' \
  -f npm_tag=latest \
  -f dry_run=true \
  -f skip_existing=true \
  -f confirm_latest_publish=''
```

Do not run a real package-set publish until every package version in the set is intentionally bumped or `skip_existing=true` is explicitly desired.

## Verification

### Preferred direct registry API check

Local npm config can contain scope overrides. The most reliable verification is the registry API:

```bash
python3 - <<'PY'
import json, urllib.request
pkg = '@go-go-golems/os-core'
ver = '0.1.2'
url = f"https://registry.npmjs.org/{pkg.replace('/', '%2F')}/{ver}"
with urllib.request.urlopen(url) as r:
    data = json.load(r)
print(data['name'], data['version'])
print(data.get('_npmUser'))
print(data.get('dist', {}).get('tarball'))
PY
```

Expected Trusted Publishing evidence:

```json
{
  "name": "GitHub Actions",
  "email": "npm-oidc-no-reply@github.com",
  "trustedPublisher": {
    "id": "github"
  }
}
```

### Workflow log evidence

Look for:

```text
npm notice publish Signed provenance statement with source and build information from GitHub Actions
npm notice publish Provenance statement published to transparency log: ...
+ @go-go-golems/<pkg>@<version>
```

## Known successful releases

```text
@go-go-golems/os-chat@0.1.1
Workflow run: 25705272997
Provenance log: https://search.sigstore.dev/?logIndex=1513355990

@go-go-golems/os-core@0.1.2
Workflow run: 25705516239
Provenance log: https://search.sigstore.dev/?logIndex=1513414083
```

## Troubleshooting

### Workflow is not found

If `gh workflow run publish-npm.yml` returns 404, the workflow file is not on the default branch yet. Push it to `main` first.

### Lockfile error in setup-node

If setup-node says no `pnpm-lock.yaml` exists, confirm the lockfile is committed and the workflow has checked out the expected branch.

### Existing version failure

npm versions are immutable. Either bump the package version or run with `skip_existing=true` when skipping is intentional.

### Local npm points to GitHub Packages

Check:

```bash
npm config get @go-go-golems:registry
```

It should be:

```text
https://registry.npmjs.org/
```

If local verification still routes to GitHub Packages, use the direct registry API verification above.

### Node 20 action warnings

The workflow may show GitHub's Node 20 action deprecation warning for action implementations. This is currently non-failing. The publish job itself uses Node 24 for repository commands.
