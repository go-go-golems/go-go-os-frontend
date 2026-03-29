import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    {
      directory: '../apps/todo/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../apps/crm/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../apps/book-tracker-debug/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../apps/apps-browser/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../apps/arc-agi-player/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../packages/os-core/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../packages/os-chat/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../packages/os-repl/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../packages/os-scripting/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../packages/os-widgets/src',
      files: '**/*.stories.@(ts|tsx)',
    },
  ],
  staticDirs: ['./public'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-onboarding',
    '@storybook/addon-vitest',
  ],
  framework: '@storybook/react-vite',
  viteFinal: async (config_) => {
    config_.resolve = config_.resolve || {};
    config_.resolve.alias = {
      ...config_.resolve.alias,
      '@go-go-golems/os-core': resolve(__dirname, '../packages/os-core/src'),
      '@go-go-golems/os-chat': resolve(__dirname, '../packages/os-chat/src'),
      '@go-go-golems/os-repl': resolve(__dirname, '../packages/os-repl/src'),
      '@go-go-golems/os-scripting': resolve(__dirname, '../packages/os-scripting/src'),
      '@go-go-golems/os-confirm': resolve(__dirname, '../packages/os-confirm/src'),
      '@go-go-golems/apps-browser': resolve(__dirname, '../apps/apps-browser/src'),
      '@go-go-golems/arc-agi-player': resolve(__dirname, '../apps/arc-agi-player/src'),
      '@go-go-golems/os-widgets/kanban-runtime': resolve(__dirname, '../packages/os-widgets/src/kanban/runtime.ts'),
      '@go-go-golems/os-widgets': resolve(__dirname, '../packages/os-widgets/src'),
    };
    return config_;
  },
};

export default config;
