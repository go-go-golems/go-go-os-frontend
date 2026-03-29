import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_STORY_FILES = [
  'apps/todo/src/app/stories/TodoApp.stories.tsx',
  'apps/crm/src/app/stories/CrmApp.stories.tsx',
  'apps/book-tracker-debug/src/app/stories/BookTrackerDebugApp.stories.tsx',
] as const;

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, '../../../../');

describe('app storybook modules', () => {
  for (const relativePath of APP_STORY_FILES) {
    it(`contains Storybook exports: ${relativePath}`, () => {
      const filePath = resolve(repoRoot, relativePath);
      const source = readFileSync(filePath, 'utf8');

      expect(source).toContain('export default');
      expect(source).toMatch(/export const\s+[A-Za-z0-9_]+\s*:/);
    });
  }
});
