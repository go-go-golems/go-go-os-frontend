import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Btn } from '../../../src/primitives/Btn';
import { Checkbox } from '../../../src/primitives/Checkbox';
import { RadioButton } from '../../../src/primitives/RadioButton';
import { DropdownMenu } from '../../../src/primitives/DropdownMenu';
import { ListBox } from '../../../src/primitives/ListBox';
import { TabControl } from '../../../src/primitives/TabControl';

// ── Fixture data ──

const FONTS = ['Geneva', 'Chicago', 'Monaco', 'New York', 'Athens', 'Cairo'];
const LIST_ITEMS = ['System Folder', 'MacPaint', 'MacWrite', 'Finder', 'Scrapbook', 'Note Pad', 'Calculator'];
const TAB_ITEMS = ['General', 'Sound', 'Mouse', 'Keyboard', 'Display'];

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 24,
  marginBottom: 14,
};

// ── ControlPanel component ──

function ControlPanelInner() {
  const [checkBold, setCheckBold] = useState(true);
  const [checkItalic, setCheckItalic] = useState(false);
  const [checkUnderline, setCheckUnderline] = useState(true);
  const [checkSmallCaps, setCheckSmallCaps] = useState(false);
  const [checkShadow, setCheckShadow] = useState(false);

  const [radioSize, setRadioSize] = useState(1); // 0=9pt, 1=10pt, 2=12pt
  const [radioStyle, setRadioStyle] = useState(0); // 0=Plain, 1=Bold, 2=Italic

  const [fontSelected, setFontSelected] = useState(0);
  const [listSelected, setListSelected] = useState(2);
  const [activeTab, setActiveTab] = useState(0);

  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div
      style={{
        padding: 16,
        fontFamily: 'var(--hc-font-family, Geneva, sans-serif)',
        fontSize: 12,
        width: 480,
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
        Control Panel
      </h1>

      {/* ── Push Buttons ── */}
      <div style={SECTION_LABEL_STYLE}>Push Buttons</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <Btn isDefault>OK</Btn>
        <Btn>Cancel</Btn>
        <Btn variant="primary">Apply</Btn>
        <Btn variant="danger">Reset</Btn>
        <Btn disabled>Disabled</Btn>
      </div>

      {/* ── Checkboxes ── */}
      <div style={SECTION_LABEL_STYLE}>Checkbox Options</div>
      <div style={ROW_STYLE}>
        <div>
          <Checkbox label="Bold" checked={checkBold} onChange={() => setCheckBold(!checkBold)} />
          <Checkbox label="Italic" checked={checkItalic} onChange={() => setCheckItalic(!checkItalic)} />
          <Checkbox label="Underline" checked={checkUnderline} onChange={() => setCheckUnderline(!checkUnderline)} />
        </div>
        <div>
          <Checkbox label="Small Caps" checked={checkSmallCaps} onChange={() => setCheckSmallCaps(!checkSmallCaps)} />
          <Checkbox label="Shadow" checked={checkShadow} onChange={() => setCheckShadow(!checkShadow)} />
        </div>
      </div>

      {/* ── Radio Buttons ── */}
      <div style={SECTION_LABEL_STYLE}>Size</div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        <RadioButton
          label="9 point"
          selected={radioSize === 0}
          onChange={() => setRadioSize(0)}
        />
        <RadioButton
          label="10 point"
          selected={radioSize === 1}
          onChange={() => setRadioSize(1)}
        />
        <RadioButton
          label="12 point"
          selected={radioSize === 2}
          onChange={() => setRadioSize(2)}
        />
      </div>

      <div style={SECTION_LABEL_STYLE}>Style</div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <RadioButton
          label="Plain"
          selected={radioStyle === 0}
          onChange={() => setRadioStyle(0)}
        />
        <RadioButton
          label="Bold"
          selected={radioStyle === 1}
          onChange={() => setRadioStyle(1)}
        />
        <RadioButton
          label="Italic"
          selected={radioStyle === 2}
          onChange={() => setRadioStyle(2)}
        />
      </div>

      {/* ── Dropdown ── */}
      <div style={SECTION_LABEL_STYLE}>Font</div>
      <div style={{ marginBottom: 20 }}>
        <DropdownMenu
          options={FONTS}
          selected={fontSelected}
          onSelect={setFontSelected}
        />
      </div>

      {/* ── List Box ── */}
      <div style={SECTION_LABEL_STYLE}>List Box</div>
      <div style={{ marginBottom: 20 }}>
        <ListBox
          items={LIST_ITEMS}
          selected={listSelected}
          onSelect={setListSelected}
        />
      </div>

      {/* ── Tabs ── */}
      <div style={SECTION_LABEL_STYLE}>Tab Control</div>
      <TabControl
        tabs={TAB_ITEMS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 0 && (
          <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 6 }}>Desktop Pattern: Standard</div>
            <div>Time: {new Date().toLocaleTimeString()}</div>
            <div style={{ marginTop: 8 }}>
              <Checkbox
                label="Show clock"
                checked={true}
                onChange={() => {}}
              />
            </div>
          </div>
        )}
        {activeTab === 1 && (
          <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 6 }}>Speaker Volume</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10 }}>🔈</span>
              <div
                style={{
                  width: 120,
                  height: 8,
                  border: '2px solid #000',
                  background: '#fff',
                  position: 'relative',
                }}
              >
                <div style={{ width: '60%', height: '100%', background: '#000' }} />
              </div>
              <span style={{ fontSize: 10 }}>🔊</span>
            </div>
          </div>
        )}
        {activeTab === 2 && (
          <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 6 }}>Double-Click Speed</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <RadioButton label="Slow" selected={false} onChange={() => {}} />
              <RadioButton label="Medium" selected={true} onChange={() => {}} />
              <RadioButton label="Fast" selected={false} onChange={() => {}} />
            </div>
          </div>
        )}
        {activeTab === 3 && (
          <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 6 }}>Key Repeat Rate</div>
            <DropdownMenu
              options={['Slow', 'Medium', 'Fast']}
              selected={1}
              onSelect={() => {}}
            />
          </div>
        )}
        {activeTab === 4 && (
          <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 6 }}>Resolution</div>
            <DropdownMenu
              options={['640 × 480', '800 × 600', '1024 × 768']}
              selected={1}
              onSelect={() => {}}
            />
          </div>
        )}
      </TabControl>
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/Controls/ControlPanel',
  component: ControlPanelInner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Classic macOS System 1 style control panel demonstrating all form control widgets: buttons, checkboxes, radio buttons, dropdowns, list boxes, and tabs.',
      },
    },
  },
} satisfies Meta<typeof ControlPanelInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ControlPanel: Story = {};
