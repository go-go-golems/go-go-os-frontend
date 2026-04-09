import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from './Toast';

const meta = {
  title: 'Engine/Widgets/Toast',
  component: Toast,
  args: { message: 'Item saved ✅', onDone: () => {} },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
