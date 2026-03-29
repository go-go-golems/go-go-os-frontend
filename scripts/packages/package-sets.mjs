export const packageSets = {
  'os-core': ['packages/os-core'],
  'os-shell-stack': [
    'packages/os-core',
    'packages/os-chat',
    'packages/os-repl',
    'packages/os-scripting',
    'packages/os-shell',
  ],
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
