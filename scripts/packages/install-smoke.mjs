#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const workspaceRoot = path.resolve(import.meta.dirname, '..', '..');
const packageDirs = process.argv.slice(2);

if (packageDirs.length === 0) {
  console.error('Usage: node scripts/packages/install-smoke.mjs <package-dir> [<package-dir> ...]');
  process.exit(1);
}

async function packDistPackage(packageDirArg) {
  const packageDir = path.resolve(workspaceRoot, packageDirArg);
  const distDir = path.join(packageDir, 'dist');
  const distPackageJson = JSON.parse(await readFile(path.join(distDir, 'package.json'), 'utf8'));
  const { stdout } = await execFileAsync('npm', ['pack', '--json'], {
    cwd: distDir,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const [packResult] = JSON.parse(stdout);

  return {
    packageDirArg,
    packageName: distPackageJson.name,
    tarballPath: path.join(distDir, packResult.filename),
  };
}

const fixtureDir = await mkdtemp(path.join(os.tmpdir(), 'go-go-os-install-smoke-'));
const packedPackages = [];

try {
  await writeFile(
    path.join(fixtureDir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'go-go-os-install-smoke',
        private: true,
        type: 'module',
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  for (const packageDirArg of packageDirs) {
    packedPackages.push(await packDistPackage(packageDirArg));
  }

  const peerPackages = ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit'];
  await execFileAsync(
    'npm',
    [
      'install',
      '--no-package-lock',
      '--silent',
      ...peerPackages,
      ...packedPackages.map((packedPackage) => packedPackage.tarballPath),
    ],
    {
      cwd: fixtureDir,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  const { stdout } = await execFileAsync('npm', ['ls', '--depth=0', '--json'], {
    cwd: fixtureDir,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const installTree = JSON.parse(stdout);

  for (const packedPackage of packedPackages) {
    if (!installTree.dependencies?.[packedPackage.packageName]) {
      throw new Error(`Fixture install is missing ${packedPackage.packageName}.`);
    }
  }

  console.log(
    `Installed ${packedPackages.map((packedPackage) => packedPackage.packageName).join(', ')} into clean fixture ${fixtureDir}`,
  );
} catch (error) {
  console.error(`Install smoke failed. Fixture preserved at ${fixtureDir}`);
  throw error;
} finally {
  for (const packedPackage of packedPackages) {
    await rm(packedPackage.tarballPath, { force: true });
  }
}

await rm(fixtureDir, { recursive: true, force: true });
