import type { Meta, StoryObj } from '@storybook/react';
import { MacRepl } from './MacRepl';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof MacRepl> = {
  title: 'RichWidgets/MacRepl',
  component: MacRepl,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MacRepl>;

export const Default: Story = {
  decorators: [fullscreenDecorator],
};

export const CustomPrompt: Story = {
  args: {
    prompt: '❯',
  },
  decorators: [fullscreenDecorator],
};

export const WithHistory: Story = {
  args: {
    initialLines: [
      { type: 'system', text: 'Macintosh System REPL v1.0' },
      { type: 'system', text: '' },
      { type: 'input', text: 'whoami' },
      { type: 'output', text: 'macuser' },
      { type: 'input', text: 'date' },
      { type: 'output', text: '3/5/2026, 9:41:00 AM' },
      { type: 'input', text: 'fortune' },
      {
        type: 'output',
        text: 'The best way to predict the future is to invent it. — Alan Kay',
      },
      { type: 'system', text: '' },
    ],
  },
  decorators: [fullscreenDecorator],
};

export const ErrorOutput: Story = {
  args: {
    initialLines: [
      { type: 'system', text: 'Macintosh System REPL v1.0' },
      { type: 'input', text: 'open /System/Extensions' },
      { type: 'error', text: 'Permission denied: /System/Extensions' },
      { type: 'input', text: 'connect prod-db --mode write' },
      { type: 'error', text: 'Network timeout while opening session' },
      { type: 'system', text: '' },
    ],
  },
  decorators: [fullscreenDecorator],
};

export const LongSession: Story = {
  args: {
    initialLines: Array.from({ length: 24 }, (_, index) =>
      index % 3 === 0
        ? { type: 'input' as const, text: `echo run-${index}` }
        : index % 3 === 1
          ? { type: 'output' as const, text: `run-${index - 1}` }
          : { type: 'system' as const, text: '' },
    ),
  },
  decorators: [fixedFrameDecorator('100%', 640)],
};
