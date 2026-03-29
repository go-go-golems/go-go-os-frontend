import type { Meta, StoryObj } from '@storybook/react';
import { DisclosureTriangle } from './DisclosureTriangle';

const meta = {
  title: 'Engine/Widgets/DisclosureTriangle',
  component: DisclosureTriangle,
  tags: ['autodocs'],
} satisfies Meta<typeof DisclosureTriangle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    label: 'System Folder',
    children: (
      <div>
        <div style={{ fontSize: 12 }}>System</div>
        <div style={{ fontSize: 12 }}>Finder</div>
      </div>
    ),
  },
};

export const Open: Story = {
  args: {
    label: 'System Folder',
    defaultOpen: true,
    children: (
      <div>
        <div style={{ fontSize: 12 }}>System</div>
        <div style={{ fontSize: 12 }}>Finder</div>
      </div>
    ),
  },
};

export const Nested: Story = {
  args: { label: '', children: null },
  render: () => (
    <div>
      <DisclosureTriangle label="System Folder">
        <div style={{ fontSize: 12 }}>System</div>
        <div style={{ fontSize: 12 }}>Finder</div>
        <DisclosureTriangle label="Extensions">
          <div style={{ fontSize: 12 }}>Chooser</div>
          <div style={{ fontSize: 12 }}>ImageWriter</div>
        </DisclosureTriangle>
      </DisclosureTriangle>
      <DisclosureTriangle label="Applications">
        <div style={{ fontSize: 12 }}>MacPaint</div>
        <div style={{ fontSize: 12 }}>MacWrite</div>
      </DisclosureTriangle>
    </div>
  ),
};
