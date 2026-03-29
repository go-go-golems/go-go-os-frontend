import type { Meta, StoryObj } from '@storybook/react';
import { AlertDialog } from './AlertDialog';

const meta = {
  title: 'Engine/Widgets/AlertDialog',
  component: AlertDialog,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['stop', 'caution', 'note'] },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Note: Story = {
  args: { type: 'note', message: 'Welcome to Macintosh.', onOK: () => {} },
};

export const Caution: Story = {
  args: { type: 'caution', message: 'Are you sure you want to erase the disk?', onOK: () => {} },
};

export const Stop: Story = {
  args: { type: 'stop', message: 'The application has unexpectedly quit.', onOK: () => {} },
};

export const CustomActions: Story = {
  args: {
    type: 'caution',
    message: 'Save changes before closing?',
    actions: [
      { label: "Don't Save", onClick: () => {} },
      { label: 'Cancel', onClick: () => {} },
      { label: 'Save', onClick: () => {}, isDefault: true },
    ],
  },
};
