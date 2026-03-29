#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { getPackageSet, listPackageSetNames } from './package-sets.mjs';

const workspaceRoot = path.resolve(import.meta.dirname, '..', '..');

function parseArgs(argv) {
  const args = {
    dryRun: false,
    tag: 'canary',
    versionSuffix: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--dry-run') {
      args.dryRun = true;
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
    if (!args.packageSetName) {
      args.packageSetName = value;
      continue;
    }
    throw new Error(`Unexpected argument: ${value}`);
  }

  if (!args.packageSetName) {
    throw new Error(
      `Usage: node scripts/packages/publish-github-package-set.mjs <package-set> [--tag <npm-tag>] [--version-suffix <suffix>] [--dry-run]\nKnown package sets: ${listPackageSetNames().join(', ')}`,
    );
  }

  return args;
}

function runNodeScript(scriptPath, scriptArgs) {
  const nodeCommand = process.execPath;
  const result = spawnSync(nodeCommand, [scriptPath, ...scriptArgs], {
    cwd: workspaceRoot,
    stdio: 'inherit',
  });

  return result.status ?? 1;
}

const args = parseArgs(process.argv.slice(2));
const packageDirs = getPackageSet(args.packageSetName);
const publishScriptPath = path.join(import.meta.dirname, 'publish-github-package.mjs');

for (const packageDir of packageDirs) {
  const commandArgs = [packageDir, '--tag', args.tag];
  if (args.versionSuffix) {
    commandArgs.push('--version-suffix', args.versionSuffix);
  }
  if (args.dryRun) {
    commandArgs.push('--dry-run');
  }

  console.log(
    `Publishing package set ${args.packageSetName}: ${packageDir}${args.dryRun ? ' (dry run)' : ''}`,
  );
  const exitCode = runNodeScript(publishScriptPath, commandArgs);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
