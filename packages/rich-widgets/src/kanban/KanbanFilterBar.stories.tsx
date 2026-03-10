import type { Meta, StoryObj } from '@storybook/react';
import { KanbanFilterBar } from './KanbanFilterBar';
import { DEFAULT_KANBAN_TAXONOMY } from './types';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof KanbanFilterBar> = {
  title: 'RichWidgets/Kanban/FilterBar',
  component: KanbanFilterBar,
};

export default meta;
type Story = StoryObj<typeof KanbanFilterBar>;

export const Default: Story = {
  args: {
    taxonomy: DEFAULT_KANBAN_TAXONOMY,
    filterType: null,
    filterPriority: null,
    searchQuery: '',
    onSetFilterType: () => {},
    onSetFilterPriority: () => {},
    onClearFilters: () => {},
  },
};

export const ActiveFilters: Story = {
  args: {
    taxonomy: DEFAULT_KANBAN_TAXONOMY,
    filterType: 'bug',
    filterPriority: 'high',
    searchQuery: 'auth',
    onSetFilterType: () => {},
    onSetFilterPriority: () => {},
    onClearFilters: () => {},
  },
};
