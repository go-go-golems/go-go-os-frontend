import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('packages/rich-widgets/src');
const ignoreDirs = new Set(['launcher', 'primitives', 'theme']);

for (const entry of fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  if (ignoreDirs.has(entry.name)) {
    continue;
  }

  const dir = path.join(root, entry.name);
  const files = fs.readdirSync(dir);
  const storyFile = files.find((file) => file.endsWith('.stories.tsx'));
  const componentFile = files.find((file) => file.endsWith('.tsx') && !file.endsWith('.stories.tsx'));

  if (!storyFile || !componentFile) {
    console.log(`${entry.name}\t${componentFile ?? ''}\t${storyFile ?? ''}\t0\t`);
    continue;
  }

  const storySource = fs.readFileSync(path.join(dir, storyFile), 'utf8');
  const storyNames = [...storySource.matchAll(/^export const (\w+):/gm)].map((match) => match[1]);
  console.log(
    `${entry.name}\t${componentFile}\t${storyFile}\t${storyNames.length}\t${storyNames.join(',')}`,
  );
}
