#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const thisFile = fileURLToPath(import.meta.url);
const repoRoot = resolve(thisFile, '../../..');

const APP_PREFIXES = new Map([
  ['apps/inventory/', 'Apps/Inventory/'],
  ['apps/todo/', 'Apps/Todo/'],
  ['apps/crm/', 'Apps/Crm/'],
  ['apps/book-tracker-debug/', 'Apps/BookTrackerDebug/'],
  ['apps/apps-browser/', 'Apps/AppsBrowser/'],
]);

const FORBIDDEN_TOP_LEVEL = new Set([
  'Packages',
  'Widgets',
  'Shell',
  'Pages',
  'Chat',
  'Todo',
  'CRM',
  'BookTrackerDebug',
  'BookTracker',
  'Plugin Runtime',
]);

function walk(dir, out) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (/\.stories\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
}

function inferExpectedPrefix(relPath) {
  if (relPath.startsWith('packages/os-core/src/components/shell/')) {
    return 'Engine/Shell/';
  }
  if (relPath.startsWith('packages/os-core/src/components/widgets/')) {
    return 'Engine/Widgets/';
  }
  if (relPath.startsWith('packages/os-core/src/plugin-runtime/')) {
    return 'Engine/PluginRuntime/';
  }
  if (relPath.startsWith('packages/os-core/')) {
    return 'Engine/';
  }
  if (relPath.startsWith('packages/os-chat/src/chat/components/')) {
    return 'ChatRuntime/Components/';
  }
  if (relPath.startsWith('packages/os-chat/src/chat/debug/')) {
    return 'ChatRuntime/Debug/';
  }
  if (relPath.startsWith('packages/os-chat/src/chat/renderers/')) {
    return 'ChatRuntime/Renderers/';
  }
  if (relPath.startsWith('packages/os-chat/')) {
    return 'ChatRuntime/';
  }
  if (relPath.startsWith('packages/os-scripting/src/hypercard/debug/')) {
    return 'HypercardRuntime/Debug/';
  }
  if (relPath.startsWith('packages/os-scripting/src/hypercard/editor/')) {
    return 'HypercardRuntime/Editor/';
  }
  if (relPath.startsWith('packages/os-scripting/src/hypercard/timeline/')) {
    return 'HypercardRuntime/Timeline/';
  }
  if (relPath.startsWith('packages/os-scripting/src/runtime-host/')) {
    return 'HypercardRuntime/RuntimeHost/';
  }
  if (relPath.startsWith('packages/os-scripting/src/plugin-runtime/')) {
    return 'HypercardRuntime/PluginRuntime/';
  }
  if (relPath.startsWith('packages/os-scripting/')) {
    return 'HypercardRuntime/';
  }
  for (const [pathPrefix, titlePrefix] of APP_PREFIXES.entries()) {
    if (relPath.startsWith(pathPrefix)) return titlePrefix;
  }
  return null;
}

function extractCanonicalTitle(source) {
  const matches = [...source.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1]);
  return (
    matches.find(
      (t) =>
        t.startsWith('Apps/') ||
        t.startsWith('Engine/') ||
        t.startsWith('ChatRuntime/') ||
        t.startsWith('HypercardRuntime/'),
    ) ?? null
  );
}

function checkPlacement(relPath) {
  if (relPath.startsWith('apps/')) {
    if (relPath.includes('/src/stories/')) {
      return 'app story must not live in flat src/stories; move under src/app/stories or src/features/**/stories';
    }
    const ok =
      /^apps\/[^/]+\/src\/(app\/stories\/.+|features\/.+\/stories\/.+|components\/.+)\.stories\.(ts|tsx)$/.test(
        relPath,
      );
    if (!ok) {
      return 'app story path must match src/app/stories/*, src/features/**/stories/*, or src/components/*';
    }
  }

  if (relPath.startsWith('packages/os-core/')) {
    const ok = /^packages\/os-core\/src\/(components\/.+|plugin-runtime\/.+)\.stories\.(ts|tsx)$/.test(relPath);
    if (!ok) {
      return 'engine story path must be under packages/os-core/src/components or packages/os-core/src/plugin-runtime';
    }
  }
  if (relPath.startsWith('packages/os-chat/')) {
    const ok = /^packages\/os-chat\/src\/chat\/.+\.stories\.(ts|tsx)$/.test(relPath);
    if (!ok) {
      return 'chat-runtime story path must be under packages/os-chat/src/chat';
    }
  }
  if (relPath.startsWith('packages/os-scripting/')) {
    const ok =
      /^packages\/os-scripting\/src\/(hypercard\/.+|runtime-host\/.+|plugin-runtime\/.+)\.stories\.(ts|tsx)$/.test(
        relPath,
      );
    if (!ok) {
      return 'hypercard-runtime story path must be under src/hypercard, src/runtime-host, or src/plugin-runtime';
    }
  }

  return null;
}

const storyFiles = [];
walk(join(repoRoot, 'apps'), storyFiles);
walk(join(repoRoot, 'packages/os-core/src'), storyFiles);
walk(join(repoRoot, 'packages/os-chat/src'), storyFiles);
walk(join(repoRoot, 'packages/os-scripting/src'), storyFiles);

const errors = [];

for (const file of storyFiles) {
  const relPath = relative(repoRoot, file).replace(/\\/g, '/');
  const source = readFileSync(file, 'utf8');

  const title = extractCanonicalTitle(source);
  if (!title) {
    errors.push(`${relPath}: missing canonical meta title (Apps/* or Engine/*)`);
    continue;
  }

  const expectedPrefix = inferExpectedPrefix(relPath);
  if (!expectedPrefix) {
    errors.push(`${relPath}: could not infer expected title prefix from path`);
  } else if (!title.startsWith(expectedPrefix)) {
    errors.push(`${relPath}: title/path mismatch (${title} vs expected prefix ${expectedPrefix})`);
  }

  const topLevel = title.split('/')[0];
  if (FORBIDDEN_TOP_LEVEL.has(topLevel)) {
    errors.push(`${relPath}: forbidden legacy top-level title segment (${topLevel})`);
  }
  if (title.startsWith('Engine/Components/')) {
    errors.push(`${relPath}: legacy engine taxonomy segment Engine/Components/* is not allowed`);
  }

  const placementError = checkPlacement(relPath);
  if (placementError) errors.push(`${relPath}: ${placementError}`);
}

if (errors.length > 0) {
  console.error('Storyboard taxonomy check failed:');
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
}

console.log(`Storyboard taxonomy check passed (${storyFiles.length} story files).`);
