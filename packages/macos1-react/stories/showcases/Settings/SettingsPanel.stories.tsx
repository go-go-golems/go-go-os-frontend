import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TabControl } from '../../../src/primitives/TabControl';
import { ListBox } from '../../../src/primitives/ListBox';
import { DropdownMenu } from '../../../src/primitives/DropdownMenu';
import { Btn } from '../../../src/primitives/Btn';
import { Checkbox } from '../../../src/primitives/Checkbox';
import { RadioButton } from '../../../src/primitives/RadioButton';

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '4px 0',
  borderBottom: '1px solid #f0f0f0',
};

const LABEL_STYLE: React.CSSProperties = {
  minWidth: 120,
  fontSize: 12,
};

const VALUE_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: '#666',
};

// ── Fixture data ──

const DISPLAY_MODES = ['Default', 'Compact', 'Graphite'];
const SIDEBAR_POSITIONS = ['Left', 'Right', 'Top', 'Bottom'];
const LANGUAGE_OPTIONS = ['English', 'Deutsch', 'Français', 'Español', '日本語', '中文'];
const FONT_OPTIONS = ['Geneva', 'Chicago', 'Monaco', 'New York', 'Helvetica', 'Times'];
const MOUSE_SPEED_OPTIONS = ['Slow', 'Medium', 'Fast'];
const CLICK_OPTIONS = ['Single', 'Double'];
const NOTIFY_OPTIONS = ['Always', 'When Focused', 'Never'];
const DOCK_APPS = ['Finder', 'Safari', 'Mail', 'Calendar', 'Messages', 'Notes', 'Photos', 'Music', 'Podcasts'];
const NETWORK_ITEMS = ['Built-in Ethernet', 'Wi-Fi', 'Bluetooth PAN'];

// ── SettingsPanel component ──

function SettingsPanelInner() {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // General settings
  const [languageIdx, setLanguageIdx] = useState(0);
  const [showInDock, setShowInDock] = useState(true);
  const [recentItems, setRecentItems] = useState(5);

  // Appearance settings
  const [displayModeIdx, setDisplayModeIdx] = useState(0);
  const [sidebarPosIdx, setSidebarPosIdx] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);

  // Mouse settings
  const [mouseSpeedIdx, setMouseSpeedIdx] = useState(1);
  const [clickModeIdx, setClickModeIdx] = useState(1); // Double

  // Notifications
  const [notifyIdx, setNotifyIdx] = useState(1);
  const [badgeAppIcon, setBadgeAppIcon] = useState(true);
  const [playSound, setPlaySound] = useState(true);

  // Network
  const [selectedNet, setSelectedNet] = useState(0);

  // Saved state
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const SETTINGS_TABS = ['General', 'Appearance', 'Mouse', 'Notifications', 'Network'];

  return (
    <div
      style={{
        fontFamily: 'var(--hc-font-family, Geneva, sans-serif)',
        fontSize: 12,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Header ── */}
      <h1
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 12,
          borderBottom: '1px solid #ccc',
          paddingBottom: 8,
          padding: '0 16px 8px',
        }}
      >
        System Preferences — macOS 1 Style
      </h1>

      <div style={{ padding: '0 16px', display: 'flex', gap: 0, border: '2px solid #000', background: '#fff', width: 600 }}>
        {/* ── Sidebar ── */}
        <div
          style={{
            width: 160,
            borderRight: '2px solid #000',
            background: '#eee',
          }}
        >
          <ListBox
            items={SETTINGS_TABS}
            selected={activeTab}
            onSelect={setActiveTab}
          />
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 0 && (
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 12 }}>General Settings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Language</span>
                  <DropdownMenu options={LANGUAGE_OPTIONS} selected={languageIdx} onSelect={setLanguageIdx} />
                  <span style={VALUE_STYLE}>{LANGUAGE_OPTIONS[languageIdx]}</span>
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Recent Items</span>
                  <DropdownMenu options={['None', '5', '10', '15', '20']} selected={recentItems / 5 - 1} onSelect={(i) => setRecentItems((i + 1) * 5)} />
                  <span style={VALUE_STYLE}>{recentItems} recent applications</span>
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Dock</span>
                  <Checkbox label="Show in Dock" checked={showInDock} onChange={setShowInDock} />
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Appearance</span>
                  <DropdownMenu options={['Aqua', 'Graphite']} selected={0} onSelect={() => {}} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 12 }}>Appearance</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Display</span>
                  <DropdownMenu options={DISPLAY_MODES} selected={displayModeIdx} onSelect={setDisplayModeIdx} />
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Sidebar</span>
                  <DropdownMenu options={SIDEBAR_POSITIONS} selected={sidebarPosIdx} onSelect={setSidebarPosIdx} />
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Dark Mode</span>
                  <Checkbox label="Use dark appearance" checked={darkMode} onChange={setDarkMode} />
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Accessibility</span>
                  <Checkbox label="Reduce motion" checked={reduceMotion} onChange={setReduceMotion} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 12 }}>Mouse & Trackpad</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Tracking Speed</span>
                  <DropdownMenu options={MOUSE_SPEED_OPTIONS} selected={mouseSpeedIdx} onSelect={setMouseSpeedIdx} />
                  <span style={VALUE_STYLE}>{MOUSE_SPEED_OPTIONS[mouseSpeedIdx]}</span>
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Click</span>
                  <DropdownMenu options={CLICK_OPTIONS} selected={clickModeIdx} onSelect={setClickModeIdx} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 12 }}>Notifications</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Notifications</span>
                  <DropdownMenu options={NOTIFY_OPTIONS} selected={notifyIdx} onSelect={setNotifyIdx} />
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Badge App Icon</span>
                  <Checkbox label="Show in icon" checked={badgeAppIcon} onChange={setBadgeAppIcon} />
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Sounds</span>
                  <Checkbox label="Play sound for notifications" checked={playSound} onChange={setPlaySound} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 4 && (
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 12 }}>Network</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Interface</span>
                  <ListBox items={NETWORK_ITEMS} selected={selectedNet} onSelect={setSelectedNet} />
                </div>
                <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', border: '1px solid #ddd', fontSize: 11 }}>
                  Status: <strong>Connected</strong> · IP: 192.168.1.42
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Action bar ── */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 600,
        }}
      >
        <div>
          {saved && (
            <span style={{ fontSize: 11, color: '#060' }}>✓ Changes saved</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="default" onClick={() => {}}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>Save</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/Settings/SettingsPanel',
  component: SettingsPanelInner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Showcase demonstrating a realistic System Preferences-style settings panel using TabControl, ListBox, DropdownMenu, Btn, Checkbox, and RadioButton.',
      },
    },
  },
} satisfies Meta<typeof SettingsPanelInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SettingsPanel: Story = {};
