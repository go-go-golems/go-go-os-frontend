import type { Meta, StoryObj } from '@storybook/react';
import { ContextMenu } from './ContextMenu';

const meta = {
  title: 'Engine/Widgets/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    x: 80,
    y: 40,
    items: ['Get Info', 'Duplicate', 'Open', 'Move to Trash'],
    onSelect: () => {},
    onClose: () => {},
  },
};

export const WithSeparators: Story = {
  args: {
    x: 80,
    y: 40,
    items: [
      'Get Info',
      'Duplicate',
      { separator: true },
      'Open',
      'Open With\u2026',
      { separator: true },
      'Move to Trash',
      { separator: true },
      'Inspect (Smalltalk)',
      'Browse Senders',
      'Browse Implementors',
    ],
    onSelect: () => {},
    onClose: () => {},
  },
};

export const ManyItems: Story = {
  args: {
    x: 80,
    y: 40,
    items: [
      'Cut',
      'Copy',
      'Paste',
      'Clear',
      { separator: true },
      'Select All',
      'Undo',
      'Redo',
      { separator: true },
      'Find\u2026',
      'Replace\u2026',
    ],
    onSelect: () => {},
    onClose: () => {},
  },
};

export const ActionEntries: Story = {
  args: {
    x: 80,
    y: 40,
    items: [
      { id: 'close', label: 'Close Window', commandId: 'window.close-focused', shortcut: '\u2318W' },
      { separator: true },
      { id: 'tile', label: 'Tile Windows', commandId: 'window.tile' },
      { id: 'cascade', label: 'Cascade Windows', commandId: 'window.cascade', checked: true },
      { id: 'disabled', label: 'Disabled Item', commandId: 'window.disabled', disabled: true },
    ],
    onSelect: () => {},
    onAction: () => {},
    onClose: () => {},
  },
};

export const WidgetTargetActions: Story = {
  args: {
    x: 80,
    y: 40,
    items: [
      {
        id: 'timeline-pin',
        label: 'Pin Timeline Widget',
        commandId: 'widget.timeline.pin',
        payload: { widgetId: 'timeline-widget', target: 'timeline' },
      },
      {
        id: 'timeline-copy',
        label: 'Copy Widget Data',
        commandId: 'widget.timeline.copy',
        payload: { widgetId: 'timeline-widget', format: 'json' },
      },
      { separator: true },
      {
        id: 'sidebar-collapse',
        label: 'Collapse Sidebar',
        commandId: 'widget.sidebar.collapse',
        payload: { widgetId: 'sidebar-main' },
        checked: true,
      },
    ],
    onSelect: () => {},
    onAction: () => {},
    onClose: () => {},
  },
};

export const FinderStyle: Story = {
  name: 'Finder-Style Context Menu',
  args: {
    x: 80,
    y: 40,
    items: [
      { id: 'new-folder', label: 'New Folder', commandId: 'finder.new-folder', shortcut: '\u21e7\u2318N' },
      { separator: true },
      { id: 'get-info', label: 'Get Info', commandId: 'finder.get-info', shortcut: '\u2318I' },
      { separator: true },
      { id: 'view-icons', label: 'as Icons', commandId: 'view.icons', checked: true },
      { id: 'view-list', label: 'as List', commandId: 'view.list' },
      { id: 'view-columns', label: 'as Columns', commandId: 'view.columns' },
      { id: 'view-gallery', label: 'as Gallery', commandId: 'view.gallery' },
      { separator: true },
      { id: 'sort-name', label: 'Sort By Name', commandId: 'sort.name' },
      { id: 'sort-date', label: 'Sort By Date', commandId: 'sort.date' },
      { id: 'sort-size', label: 'Sort By Size', commandId: 'sort.size' },
      { separator: true },
      { id: 'show-options', label: 'Show View Options', commandId: 'view.options', shortcut: '\u2318J' },
    ],
    onSelect: () => {},
    onAction: () => {},
    onClose: () => {},
  },
};

export const MixedWithDisabled: Story = {
  name: 'Mixed Items with Disabled States',
  args: {
    x: 80,
    y: 40,
    items: [
      { id: 'undo', label: 'Undo', commandId: 'edit.undo', shortcut: '\u2318Z' },
      { id: 'redo', label: 'Redo', commandId: 'edit.redo', shortcut: '\u21e7\u2318Z', disabled: true },
      { separator: true },
      { id: 'cut', label: 'Cut', commandId: 'edit.cut', shortcut: '\u2318X' },
      { id: 'copy', label: 'Copy', commandId: 'edit.copy', shortcut: '\u2318C' },
      { id: 'paste', label: 'Paste', commandId: 'edit.paste', shortcut: '\u2318V', disabled: true },
      { id: 'delete', label: 'Delete', commandId: 'edit.delete' },
      { separator: true },
      { id: 'select-all', label: 'Select All', commandId: 'edit.select-all', shortcut: '\u2318A' },
    ],
    onSelect: () => {},
    onAction: () => {},
    onClose: () => {},
  },
};
