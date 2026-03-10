import type { Meta, StoryObj } from '@storybook/react';
import { KanbanHeaderBar } from './KanbanHeaderBar';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof KanbanHeaderBar> = {
  title: 'RichWidgets/Kanban/HeaderBar',
  component: KanbanHeaderBar,
};

export default meta;
type Story = StoryObj<typeof KanbanHeaderBar>;

export const Default: Story = {
  args: {
    title: 'Sprint Planning',
    subtitle: 'Velocity, backlog, and delivery flow',
    searchQuery: '',
    onPrimaryAction: () => {},
    onSearchChange: () => {},
  },
};

export const WithSearchValue: Story = {
  args: {
    title: 'Bug Triage',
    subtitle: 'Review incoming defects',
    searchQuery: 'crash',
    primaryActionLabel: '+ Report Issue',
    onPrimaryAction: () => {},
    onSearchChange: () => {},
  },
};
