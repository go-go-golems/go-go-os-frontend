const allPublicPackages = [
  'packages/os-core',
  'packages/os-repl',
  'packages/os-chat',
  'packages/os-scripting',
  'packages/os-ui-cards',
  'packages/os-confirm',
  'packages/os-shell',
  'packages/os-widgets',
  'packages/os-kanban',
];

export const packageSets = {
  'os-core': ['packages/os-core'],
  'first-wave': ['packages/os-core', 'packages/os-repl', 'packages/os-widgets'],
  'vm-stack': [
    'packages/os-core',
    'packages/os-scripting',
    'packages/os-ui-cards',
    'packages/os-widgets',
    'packages/os-kanban',
  ],
  'all': allPublicPackages,
  'os-shell-stack': [
    'packages/os-core',
    'packages/os-chat',
    'packages/os-repl',
    'packages/os-scripting',
    'packages/os-shell',
  ],
  'shell-stack': [
    'packages/os-core',
    'packages/os-chat',
    'packages/os-repl',
    'packages/os-scripting',
    'packages/os-shell',
  ],
  'os-inventory-stack': allPublicPackages,
};

export function listPackageSetNames() {
  return Object.keys(packageSets);
}

export function getPackageSet(packageSetName) {
  const packageSet = packageSets[packageSetName];
  if (!packageSet) {
    throw new Error(
      `Unknown package set "${packageSetName}". Expected one of: ${listPackageSetNames().join(', ')}`,
    );
  }

  return [...packageSet];
}
