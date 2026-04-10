import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    {
      directory: '../src/primitives',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../src/rich',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../src/shell',
      files: '**/*.stories.@(ts|tsx)',
    },
    {
      directory: '../stories',
      files: '**/*.stories.@(ts|tsx)',
    },
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-onboarding',
  ],
  framework: '@storybook/react-vite',
  viteFinal: async (config_) => {
    config_.resolve = config_.resolve || {};
    config_.resolve.alias = {
      ...config_.resolve.alias,
      '@go-go-golems/macos1-react': resolve(__dirname, '../src'),
    };
    return config_;
  },
};

export default config;
