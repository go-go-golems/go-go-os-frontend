import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DesktopMenuBar } from '../../../src/shell/DesktopMenuBar';
import { DesktopIconLayer } from '../../../src/shell/DesktopIconLayer';
import { WindowTitleBar } from '../../../src/shell/WindowTitleBar';
import { WindowResizeHandle } from '../../../src/shell/WindowResizeHandle';
import type { DesktopMenuSection, DesktopIconDef } from '../../../src/shell/types';

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

// ── Fixture data ──

const MENU_SECTIONS: DesktopMenuSection[] = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new', label: 'New Window', commandId: 'file.new-window', shortcut: '⌘N' },
      { id: 'open', label: 'Open…', commandId: 'file.open', shortcut: '⌘O' },
      { separator: true },
      { id: 'close', label: 'Close Window', commandId: 'file.close', shortcut: '⌘W' },
      { separator: true },
      { id: 'quit', label: 'Quit', commandId: 'app.quit', shortcut: '⌘Q' },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { id: 'undo', label: 'Undo', commandId: 'edit.undo', shortcut: '⌘Z' },
      { id: 'redo', label: 'Redo', commandId: 'edit.redo', shortcut: '⇧⌘Z' },
      { separator: true },
      { id: 'cut', label: 'Cut', commandId: 'edit.cut', shortcut: '⌘X' },
      { id: 'copy', label: 'Copy', commandId: 'edit.copy', shortcut: '⌘C' },
      { id: 'paste', label: 'Paste', commandId: 'edit.paste', shortcut: '⌘V' },
      { id: 'delete', label: 'Delete', commandId: 'edit.delete' },
      { separator: true },
      { id: 'select-all', label: 'Select All', commandId: 'edit.select-all', shortcut: '⌘A' },
    ],
  },
  {
    id: 'view',
    label: 'View',
    items: [
      { id: 'as-icons', label: 'as Icons', commandId: 'view.icons' },
      { id: 'as-list', label: 'as List', commandId: 'view.list' },
      { id: 'as-columns', label: 'as Columns', commandId: 'view.columns' },
    ],
  },
  {
    id: 'window',
    label: 'Window',
    items: [
      { id: 'minimize', label: 'Minimize', commandId: 'window.minimize', shortcut: '⌘M' },
      { id: 'zoom', label: 'Zoom', commandId: 'window.zoom' },
      { separator: true },
      { id: 'bring-front', label: 'Bring All to Front', commandId: 'window.front' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    items: [
      { id: 'help', label: 'Help', commandId: 'app.help', shortcut: '⌘?' },
    ],
  },
];

const DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'system', label: 'System', icon: '💻' },
  { id: 'applications', label: 'Applications', icon: '📁' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'sales', label: 'Sales', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'trash', label: 'Trash', icon: '🗑️' },
];

// ── DesktopPatterns component ──

function DesktopPatternsInner() {
  // Menu bar state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState('No command');

  // Icon layer state
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [iconAction, setIconAction] = useState<string | null>(null);

  // Window state
  const [focusedWindow, setFocusedWindow] = useState<'window1' | 'window2' | null>('window1');
  const [window1CloseCount, setWindow1CloseCount] = useState(0);
  const [window2CloseCount, setWindow2CloseCount] = useState(0);

  return (
    <div
      style={{
        fontFamily: 'var(--hc-font-family, Geneva, sans-serif)',
        fontSize: 12,
        width: '100%',
      }}
    >
      {/* ── Header ── */}
      <h1
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 16,
          borderBottom: '1px solid #ccc',
          paddingBottom: 8,
          padding: '0 16px 8px',
        }}
      >
        Desktop Shell Patterns
      </h1>

      {/* ── Menu Bar ── */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={SECTION_LABEL_STYLE}>DesktopMenuBar</div>
        <div
          style={{
            border: '1px solid #7f8899',
            background: '#fff',
          }}
        >
          <DesktopMenuBar
            sections={MENU_SECTIONS}
            activeMenuId={activeMenuId}
            onActiveMenuChange={setActiveMenuId}
            onCommand={(commandId, menuId) => {
              setLastCommand(`${menuId}: ${commandId}`);
              setActiveMenuId(null);
            }}
          />
        </div>
        <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
          Last command: {lastCommand}
        </div>
      </div>

      {/* ── Window Title Bars ── */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={SECTION_LABEL_STYLE}>WindowTitleBar (click to focus)</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Window 1 */}
          <div
            style={{
              width: 320,
              border: focusedWindow === 'window1' ? '2px solid #000' : '2px solid #999',
              background: '#fff',
            }}
            onClick={() => setFocusedWindow('window1')}
          >
            <WindowTitleBar
              title="Inventory Manager"
              icon="📦"
              focused={focusedWindow === 'window1'}
              onClose={() => setWindow1CloseCount((c) => c + 1)}
            />
            <div style={{ padding: 12, fontSize: 11 }}>
              Window 1 content · closes: {window1CloseCount}
            </div>
          </div>

          {/* Window 2 */}
          <div
            style={{
              width: 320,
              border: focusedWindow === 'window2' ? '2px solid #000' : '2px solid #999',
              background: focusedWindow === 'window2' ? '#fff' : '#f5f5f5',
            }}
            onClick={() => setFocusedWindow('window2')}
          >
            <WindowTitleBar
              title="Sales Dashboard"
              icon="📈"
              focused={focusedWindow === 'window2'}
              onClose={() => setWindow2CloseCount((c) => c + 1)}
            />
            <div style={{ padding: 12, fontSize: 11 }}>
              Window 2 content · closes: {window2CloseCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── Window Resize Handle ── */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={SECTION_LABEL_STYLE}>WindowResizeHandle</div>
        <div
          style={{
            width: 200,
            height: 100,
            border: '2px solid #000',
            background: '#fff',
            position: 'relative',
          }}
        >
          <div style={{ padding: 8, fontSize: 11 }}>Resize from corner →</div>
          <WindowResizeHandle position="se" />
        </div>
      </div>

      {/* ── Desktop Icon Layer ── */}
      <div style={{ padding: '0 16px' }}>
        <div style={SECTION_LABEL_STYLE}>DesktopIconLayer</div>
        <div
          style={{
            height: 180,
            border: '1px solid #7f8899',
            background: '#bfc8d8',
            position: 'relative',
          }}
        >
          <DesktopIconLayer
            icons={DESKTOP_ICONS}
            selectedIconId={selectedIconId}
            onSelectIcon={(iconId) => {
              setSelectedIconId(iconId);
              setIconAction(`Selected: ${iconId}`);
            }}
            onOpenIcon={(iconId) => {
              setIconAction(`Opened: ${iconId}`);
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 8,
              bottom: 8,
              fontSize: 10,
              color: '#283040',
              padding: '3px 6px',
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid #7f8899',
            }}
          >
            {iconAction || 'Click or double-click an icon'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/Desktop/DesktopPatterns',
  component: DesktopPatternsInner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Showcase demonstrating desktop shell widgets: DesktopMenuBar, WindowTitleBar, WindowResizeHandle, and DesktopIconLayer.',
      },
    },
  },
} satisfies Meta<typeof DesktopPatternsInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopPatterns: Story = {};
