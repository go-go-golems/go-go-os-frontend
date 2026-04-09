import type { DesktopIconDef, DesktopMenuSection, DesktopWindowDef } from './types';

export const WINDOWING_MENU_SECTIONS: DesktopMenuSection[] = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new-window', label: 'New Window', commandId: 'file.new-window', shortcut: 'Ctrl+N' },
      { id: 'close-window', label: 'Close Window', commandId: 'file.close-window', shortcut: 'Ctrl+W' },
      { separator: true },
      { id: 'open-recent', label: 'Open Recent', commandId: 'file.open-recent' },
    ],
  },
  {
    id: 'window',
    label: 'Window',
    items: [
      { id: 'tile', label: 'Tile', commandId: 'window.tile' },
      { id: 'cascade', label: 'Cascade', commandId: 'window.cascade' },
      { separator: true },
      { id: 'bring-all', label: 'Bring All To Front', commandId: 'window.front' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    items: [{ id: 'about-windowing', label: 'About Windowing', commandId: 'help.about-windowing' }],
  },
];

export const WINDOWING_ICONS: DesktopIconDef[] = [
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'sales', label: 'Sales', icon: '📈' },
  { id: 'contacts', label: 'Contacts', icon: '👥' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖' },
];

/** Icons with explicit absolute positions (legacy / manual layout). */
export const WINDOWING_ICONS_ABSOLUTE: DesktopIconDef[] = [
  { id: 'inventory', label: 'Inventory', icon: '📦', x: 20, y: 44 },
  { id: 'sales', label: 'Sales', icon: '📈', x: 20, y: 132 },
  { id: 'contacts', label: 'Contacts', icon: '👥', x: 20, y: 220 },
  { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖', x: 20, y: 308 },
];

export const WINDOWING_DENSE_ICONS: DesktopIconDef[] = Array.from({ length: 12 }, (_, index) => ({
  id: `icon-${index + 1}`,
  label: `App ${index + 1}`,
  icon: ['📄', '📊', '📬', '🧩'][index % 4],
}));

/** Dense icons with explicit absolute positions. */
export const WINDOWING_DENSE_ICONS_ABSOLUTE: DesktopIconDef[] = Array.from({ length: 12 }, (_, index) => {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return {
    id: `icon-${index + 1}`,
    label: `App ${index + 1}`,
    icon: ['📄', '📊', '📬', '🧩'][index % 4],
    x: 20 + col * 92,
    y: 44 + row * 92,
  };
});

export function createWindow(
  overrides: Partial<DesktopWindowDef> & Pick<DesktopWindowDef, 'id' | 'title'>,
): DesktopWindowDef {
  return {
    id: overrides.id,
    title: overrides.title,
    icon: overrides.icon,
    x: overrides.x ?? 120,
    y: overrides.y ?? 80,
    width: overrides.width ?? 320,
    height: overrides.height ?? 220,
    zIndex: overrides.zIndex ?? 1,
    focused: overrides.focused ?? false,
    isDialog: overrides.isDialog,
    isResizable: overrides.isResizable,
  };
}

export const WINDOWING_WINDOWS: DesktopWindowDef[] = [
  createWindow({ id: 'window:inventory', title: 'Inventory', icon: '📦', x: 150, y: 90, zIndex: 1 }),
  createWindow({ id: 'window:sales', title: 'Sales', icon: '📈', x: 250, y: 140, zIndex: 2, focused: true }),
  createWindow({ id: 'window:contacts', title: 'Contacts', icon: '👥', x: 360, y: 120, zIndex: 3 }),
];
