import type { Meta, StoryObj } from '@storybook/react';
import { DesktopDemo } from './DesktopPrimitives.stories';
import type { DesktopIconDef } from './types';

const BIG_DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'sales', label: 'Sales', icon: '📈' },
  { id: 'contacts', label: 'Contacts', icon: '👥' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { id: 'reports', label: 'Reports', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'mail', label: 'Mail', icon: '✉️' },
  { id: 'calculator', label: 'Calculator', icon: '🧮' },
  { id: 'trash', label: 'Trash', icon: '🗑️' },
];

const meta = {
  title: 'Engine/Shell/Windowing/DesktopPrimitives',
  component: DesktopDemo,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DesktopDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BigDesktopIdle: Story = {
  args: {
    icons: BIG_DESKTOP_ICONS,
  },
};

export const BigDesktopWorkspace: Story = {
  args: {
    icons: BIG_DESKTOP_ICONS,
    preloadWindows: [
      {
        id: 'w:inventory',
        title: 'Inventory — Browse Items',
        icon: '📦',
        bounds: { x: 220, y: 20, w: 480, h: 360 },
        content: { kind: 'app', appKey: 'inventory' },
      },
      {
        id: 'w:contacts',
        title: 'Contacts — All',
        icon: '👥',
        bounds: { x: 340, y: 80, w: 420, h: 320 },
        content: { kind: 'app', appKey: 'contacts' },
      },
      {
        id: 'w:ai',
        title: 'AI Assistant',
        icon: '🤖',
        bounds: { x: 780, y: 30, w: 380, h: 500 },
        content: { kind: 'app', appKey: 'ai' },
      },
      {
        id: 'w:reports',
        title: 'Reports — Monthly Summary',
        icon: '📊',
        bounds: { x: 500, y: 300, w: 520, h: 340 },
        content: { kind: 'app', appKey: 'reports' },
      },
      {
        id: 'w:notes',
        title: 'Notes',
        icon: '📝',
        bounds: { x: 180, y: 420, w: 300, h: 260 },
        content: { kind: 'app', appKey: 'notes' },
      },
    ],
  },
};

export const BigDesktopSixWindows: Story = {
  args: {
    icons: BIG_DESKTOP_ICONS,
    preloadWindows: [
      {
        id: 'w:inventory',
        title: 'Inventory',
        icon: '📦',
        bounds: { x: 220, y: 10, w: 400, h: 300 },
        content: { kind: 'app', appKey: 'inventory' },
      },
      {
        id: 'w:sales',
        title: 'Sales Dashboard',
        icon: '📈',
        bounds: { x: 640, y: 10, w: 420, h: 280 },
        content: { kind: 'app', appKey: 'sales' },
      },
      {
        id: 'w:contacts',
        title: 'Contacts',
        icon: '👥',
        bounds: { x: 1080, y: 10, w: 380, h: 300 },
        content: { kind: 'app', appKey: 'contacts' },
      },
      {
        id: 'w:reports',
        title: 'Reports',
        icon: '📊',
        bounds: { x: 220, y: 340, w: 440, h: 320 },
        content: { kind: 'app', appKey: 'reports' },
      },
      {
        id: 'w:ai',
        title: 'AI Assistant',
        icon: '🤖',
        bounds: { x: 680, y: 320, w: 360, h: 360 },
        content: { kind: 'app', appKey: 'ai' },
      },
      {
        id: 'w:mail',
        title: 'Mail — Inbox',
        icon: '✉️',
        bounds: { x: 1060, y: 340, w: 400, h: 320 },
        content: { kind: 'app', appKey: 'mail' },
      },
    ],
  },
};
