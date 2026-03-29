#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const thisFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(thisFile, '../../..');
const engineSrcDir = join(repoRoot, 'packages/os-core/src');
const shellControllerFile = join(engineSrcDir, 'components/shell/windowing/useDesktopShellController.tsx');

const forbiddenSpecifiers = ['@go-go-golems/os-scripting', '@go-go-golems/os-chat'];
const sourceExtensions = new Set(['.ts', '.tsx']);
const errors = [];

function hasSourceExtension(file) {
  return [...sourceExtensions].some((ext) => file.endsWith(ext));
}

function walkFiles(dir, out) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkFiles(full, out);
      continue;
    }
    if (hasSourceExtension(full)) {
      out.push(full);
    }
  }
}

function collectImportSpecifiers(source) {
  const specifiers = [];
  const importMatches = source.matchAll(/from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    specifiers.push(match[1]);
  }
  const dynamicMatches = source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g);
  for (const match of dynamicMatches) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

const files = [];
walkFiles(engineSrcDir, files);

for (const file of files) {
  const relPath = relative(repoRoot, file).replace(/\\/g, '/');
  const source = readFileSync(file, 'utf8');
  const imports = collectImportSpecifiers(source);
  for (const specifier of imports) {
    for (const forbidden of forbiddenSpecifiers) {
      if (specifier === forbidden || specifier.startsWith(`${forbidden}/`)) {
        errors.push(`${relPath}: forbidden dependency import "${specifier}"`);
      }
    }
  }
}

const shellControllerSource = readFileSync(shellControllerFile, 'utf8');
if (shellControllerSource.includes('chatProfiles')) {
  const relPath = relative(repoRoot, shellControllerFile).replace(/\\/g, '/');
  errors.push(`${relPath}: shell controller must not hardcode chatProfiles state`);
}

if (errors.length > 0) {
  console.error('Boundary check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Boundary check passed (${files.length} source files scanned).`);
