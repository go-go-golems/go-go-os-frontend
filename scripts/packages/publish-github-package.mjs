#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = path.resolve(import.meta.dirname, '..', '..');

function parseArgs(argv) {
  const args = {
    dryRun: false,
    manifestOnly: false,
    tag: 'canary',
    versionSuffix: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (value === '--manifest-only') {
      args.manifestOnly = true;
      continue;
    }
    if (value === '--tag') {
      args.tag = argv[index + 1] ?? '';
      index += 1;
      continue;
    }
    if (value === '--version-suffix') {
      args.versionSuffix = argv[index + 1] ?? '';
      index += 1;
      continue;
    }
    if (!args.packageDir) {
      args.packageDir = value;
      continue;
    }
    throw new Error(`Unexpected argument: ${value}`);
  }

  if (!args.packageDir) {
    throw new Error(
      'Usage: node scripts/packages/publish-github-package.mjs <package-dir> [--tag <npm-tag>] [--version-suffix <suffix>] [--dry-run]',
    );
  }

  if (!args.tag) {
    throw new Error('Expected a non-empty npm tag.');
  }

  if (args.versionSuffix && /[^0-9A-Za-z.-]/.test(args.versionSuffix)) {
    throw new Error(`Invalid version suffix: ${args.versionSuffix}`);
  }

  return args;
}

function withVersionSuffix(version, versionSuffix) {
  if (!versionSuffix) {
    return version;
  }

  return version.includes('-') ? `${version}.${versionSuffix}` : `${version}-${versionSuffix}`;
}

async function listWorkspacePackageNames() {
  const packageRoots = [path.join(workspaceRoot, 'packages'), path.join(workspaceRoot, 'apps')];
  const packageNames = new Set();

  for (const root of packageRoots) {
    let entries;
    try {
      entries = await readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const packageJsonPath = path.join(root, entry.name, 'package.json');
      try {
        const packageJsonRaw = await readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonRaw);
        if (typeof packageJson.name === 'string' && packageJson.name.length > 0) {
          packageNames.add(packageJson.name);
        }
      } catch {
        continue;
      }
    }
  }

  return packageNames;
}

function rewriteSpecifierWithPublishVersion(specifier, publishVersion) {
  if (typeof specifier !== 'string') {
    return specifier;
  }
  if (specifier.startsWith('^')) {
    return `^${publishVersion}`;
  }
  if (specifier.startsWith('~')) {
    return `~${publishVersion}`;
  }
  return publishVersion;
}

function rewriteInternalDependencyMap(dependencies, workspacePackageNames, publishVersion) {
  if (!dependencies) {
    return dependencies;
  }

  return Object.fromEntries(
    Object.entries(dependencies).map(([dependencyName, specifier]) => [
      dependencyName,
      workspacePackageNames.has(dependencyName)
        ? rewriteSpecifierWithPublishVersion(specifier, publishVersion)
        : specifier,
    ]),
  );
}

function buildPublishPackageJson(packageJson, workspacePackageNames, publishVersion) {
  return {
    ...packageJson,
    version: publishVersion,
    dependencies: rewriteInternalDependencyMap(
      packageJson.dependencies,
      workspacePackageNames,
      publishVersion,
    ),
    peerDependencies: rewriteInternalDependencyMap(
      packageJson.peerDependencies,
      workspacePackageNames,
      publishVersion,
    ),
    optionalDependencies: rewriteInternalDependencyMap(
      packageJson.optionalDependencies,
      workspacePackageNames,
      publishVersion,
    ),
  };
}

function runNpmPublish(distDir, tag, dryRun) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const publishArgs = ['publish', '--tag', tag];

  if (dryRun) {
    publishArgs.push('--dry-run');
  }

  const result = spawnSync(npmCommand, publishArgs, {
    cwd: distDir,
    stdio: 'inherit',
  });

  return result.status ?? 1;
}

const args = parseArgs(process.argv.slice(2));
const packageDir = path.resolve(workspaceRoot, args.packageDir);
const distDir = path.join(packageDir, 'dist');
const distPackageJsonPath = path.join(distDir, 'package.json');
const originalPackageJsonRaw = await readFile(distPackageJsonPath, 'utf8');
const originalPackageJson = JSON.parse(originalPackageJsonRaw);
const publishVersion = withVersionSuffix(originalPackageJson.version, args.versionSuffix);
const workspacePackageNames = await listWorkspacePackageNames();
const publishPackageJson = buildPublishPackageJson(
  originalPackageJson,
  workspacePackageNames,
  publishVersion,
);

if (args.manifestOnly) {
  process.stdout.write(`${JSON.stringify(publishPackageJson, null, 2)}\n`);
  process.exit(0);
}

await writeFile(distPackageJsonPath, `${JSON.stringify(publishPackageJson, null, 2)}\n`, 'utf8');

console.log(
  `Publishing ${originalPackageJson.name}@${publishVersion} from ${path.relative(workspaceRoot, distDir)} with tag "${args.tag}"${args.dryRun ? ' (dry run)' : ''}.`,
);

let exitCode = 0;
try {
  exitCode = runNpmPublish(distDir, args.tag, args.dryRun);
} finally {
  await writeFile(distPackageJsonPath, originalPackageJsonRaw, 'utf8');
}

if (exitCode !== 0) {
  process.exit(exitCode);
}
