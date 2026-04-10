import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TabControl } from '../../../src/primitives/TabControl';
import { DisclosureTriangle } from '../../../src/primitives/DisclosureTriangle';
import { DropdownMenu } from '../../../src/primitives/DropdownMenu';
import { ListBox } from '../../../src/primitives/ListBox';

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

// ── Fixture data ──

const FONT_OPTIONS = ['Geneva', 'Chicago', 'Monaco', 'New York', 'Athens', 'Cairo', 'Helvetica', 'Times'];
const THEME_OPTIONS = ['Classic', 'Platinum', 'Blue', 'Snow', 'Graphite'];
const SPEED_OPTIONS = ['Slow', 'Fast'];

const APP_LIST = ['Finder', 'Safari', 'Mail', 'Calendar', 'Notes', 'Reminders', 'Maps', 'Photos', 'Music', 'Podcasts'];

// ── NavigationPatterns component ──

function NavigationPatternsInner() {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Dropdown states
  const [fontIndex, setFontIndex] = useState(0);
  const [themeIndex, setThemeIndex] = useState(2); // Snow

  // ListBox state
  const [selectedApp, setSelectedApp] = useState(2); // Mail

  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'var(--hc-font-family, Geneva, sans-serif)',
        fontSize: 12,
        width: 520,
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
        }}
      >
        Navigation Patterns
      </h1>

      {/* ── TabControl ── */}
      <div style={SECTION_LABEL_STYLE}>TabControl (Preferences-style)</div>
      <div style={{ marginBottom: 20 }}>
        <TabControl
          tabs={['General', 'Appearance', 'Notifications']}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {activeTab === 0 && (
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ minWidth: 100 }}>Open at Login</span>
                <DropdownMenu options={['Never', 'Always', 'From Dock']} selected={1} onSelect={() => {}} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ minWidth: 100 }}>Language</span>
                <DropdownMenu options={['English', 'Deutsch', 'Français', '日本語']} selected={0} onSelect={() => {}} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ minWidth: 100 }}>Time Zone</span>
                <DropdownMenu options={['Local', 'UTC', 'PST', 'EST']} selected={0} onSelect={() => {}} />
              </div>
            </div>
          )}
          {activeTab === 1 && (
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ minWidth: 100 }}>Font</span>
                <DropdownMenu options={FONT_OPTIONS} selected={fontIndex} onSelect={setFontIndex} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ minWidth: 100 }}>Theme</span>
                <DropdownMenu options={THEME_OPTIONS} selected={themeIndex} onSelect={setThemeIndex} />
              </div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
                Font: {FONT_OPTIONS[fontIndex]} · Theme: {THEME_OPTIONS[themeIndex]}
              </div>
            </div>
          )}
          {activeTab === 2 && (
            <div style={{ padding: 12, fontSize: 12 }}>
              Configure which apps can send notifications.
            </div>
          )}
        </TabControl>
      </div>

      {/* ── DisclosureTriangle (Sidebar) ── */}
      <div style={SECTION_LABEL_STYLE}>DisclosureTriangle (Sidebar Navigation)</div>
      <div
        style={{
          display: 'flex',
          gap: 0,
          border: '2px solid #000',
          marginBottom: 20,
          width: 420,
          height: 240,
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: 150,
            background: '#fff',
            borderRight: '2px solid #000',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '6px 8px',
              fontSize: 10,
              color: '#888',
              borderBottom: '1px solid #ddd',
              background: '#f5f5f5',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Navigation
          </div>
          <DisclosureTriangle label="Applications" defaultOpen>
            <div style={{ padding: '3px 8px 3px 20px', fontSize: 11, cursor: 'default' }}>🖥️ Finder</div>
            <div style={{ padding: '3px 8px 3px 20px', fontSize: 11, cursor: 'default' }}>🌐 Safari</div>
            <div style={{ padding: '3px 8px 3px 20px', fontSize: 11, cursor: 'default' }}>✉️ Mail</div>
            <div style={{ padding: '3px 8px 3px 20px', fontSize: 11, cursor: 'default' }}>📅 Calendar</div>
            <div style={{ padding: '3px 8px 3px 20px', fontSize: 11, cursor: 'default' }}>📝 Notes</div>
          </DisclosureTriangle>
          <DisclosureTriangle label="Utilities" defaultOpen>
            <div style={{ padding: '3px 8px 3px 20px', fontSize: 11, cursor: 'default' }}>🧮 Calculator</div>
            <div style={{ padding: '3px 8px 3px 20px', fontSize: 11, cursor: 'default' }}>📋 Stickies</div>
          </DisclosureTriangle>
          <DisclosureTriangle label="System" defaultOpen>
            <div style={{ padding: '3px 8px 3px 20px', fontSize: 11, cursor: 'default' }}>⚙️ System Settings</div>
            <div style={{ padding: '3px 8px 3px 20px', fontSize: 11, cursor: 'default' }}>🗑️ Trash</div>
          </DisclosureTriangle>
          <DisclosureTriangle label="Archived" disabled>
            <div style={{ padding: '3px 8px 3px 20px', fontSize: 11, cursor: 'default' }}>Archived folder</div>
          </DisclosureTriangle>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>Welcome</div>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>
            Select an item from the sidebar to see its content. Nested disclosure triangles allow
            grouping related items together.
          </div>
        </div>
      </div>

      {/* ── DropdownMenu + ListBox ── */}
      <div style={SECTION_LABEL_STYLE}>DropdownMenu + ListBox</div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        {/* Font dropdown */}
        <div>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Font Face</div>
          <DropdownMenu options={FONT_OPTIONS} selected={fontIndex} onSelect={setFontIndex} />
        </div>
        {/* Speed dropdown */}
        <div>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Double-Click</div>
          <DropdownMenu options={SPEED_OPTIONS} selected={0} onSelect={() => {}} />
        </div>
        {/* App list */}
        <div>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Startup App</div>
          <ListBox items={APP_LIST} selected={selectedApp} onSelect={setSelectedApp} />
        </div>
      </div>
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/Navigation/NavigationPatterns',
  component: NavigationPatternsInner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Showcase demonstrating navigation widgets: TabControl with embedded content, DisclosureTriangle sidebar, and DropdownMenu + ListBox combos.',
      },
    },
  },
} satisfies Meta<typeof NavigationPatternsInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NavigationPatterns: Story = {};
