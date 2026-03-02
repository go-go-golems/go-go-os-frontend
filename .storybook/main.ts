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
      directory: '../packages/engine/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../packages/chat-runtime/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../packages/hypercard-runtime/src',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../packages/rich-widgets/src',
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
      '@hypercard/engine': resolve(__dirname, '../packages/engine/src'),
      '@hypercard/chat-runtime': resolve(__dirname, '../packages/chat-runtime/src'),
      '@hypercard/hypercard-runtime': resolve(__dirname, '../packages/hypercard-runtime/src'),
      '@hypercard/confirm-runtime': resolve(__dirname, '../packages/confirm-runtime/src'),
      '@hypercard/apps-browser': resolve(__dirname, '../apps/apps-browser/src'),
      '@hypercard/arc-agi-player': resolve(__dirname, '../apps/arc-agi-player/src'),
      '@hypercard/rich-widgets': resolve(__dirname, '../packages/rich-widgets/src'),
    };
    return config_;
  },
};

export default config;
