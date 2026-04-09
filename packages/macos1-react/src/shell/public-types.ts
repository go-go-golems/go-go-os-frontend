// Public types for shell components
// These types form the public API surface for shell components

export interface DesktopWindowDef {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isFocused: boolean;
}

export interface DesktopIconDef {
  id: string;
  label: string;
  x: number;
  y: number;
  icon?: string;
}

export interface DesktopMenuSection {
  id: string;
  label?: string;
  items: DesktopMenuEntry[];
}

export interface DesktopMenuEntry {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  separator?: boolean;
  children?: DesktopMenuSection[];
  action?: () => void;
}

export interface DesktopCommandInvocation {
  command: string;
  args?: Record<string, unknown>;
}
