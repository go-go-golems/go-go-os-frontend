import type { Preview } from '@storybook/react';
import React from 'react';
import { Macos1Theme } from '../src/theme/Macos1Theme';
import '../src/theme';

const preview: Preview = {
  decorators: [
    (Story) =>
      React.createElement(
        Macos1Theme,
        { theme: 'theme-macos1' },
        React.createElement(Story)
      ),
  ],
  parameters: {
    docs: {
      codePanel: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
};

export default preview;
