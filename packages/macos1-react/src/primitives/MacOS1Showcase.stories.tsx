import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { AlertDialog } from './AlertDialog';
import { Btn } from './Btn';
import { Checkbox } from './Checkbox';
import { ContextMenu, type ContextMenuEntry } from './ContextMenu';
import { DisclosureTriangle } from './DisclosureTriangle';
import { DropdownMenu } from './DropdownMenu';
import { HaloTarget } from './HaloTarget';
import { ListBox } from './ListBox';
import { ProgressBar } from './ProgressBar';
import { RadioButton } from './RadioButton';
import { TabControl } from './TabControl';
import { ToolPalette, type ToolDef } from './ToolPalette';

// ── Fixture data ──

const TOOLS: ToolDef[] = [
  { icon: '✏️', label: 'Pencil' },
  { icon: '🖌️', label: 'Brush' },
  { icon: '🪣', label: 'Fill' },
  { icon: '🔲', label: 'Select' },
  { icon: '✂️', label: 'Lasso' },
  { icon: '📏', label: 'Line' },
  { icon: '⬜', label: 'Rect' },
  { icon: '⭕', label: 'Oval' },
  { icon: '🔤', label: 'Text' },
  { icon: '🧽', label: 'Eraser' },
  { icon: '💨', label: 'Spray' },
  { icon: '🔍', label: 'Zoom' },
];
const LIST_ITEMS = ['System Folder', 'MacPaint', 'MacWrite', 'Finder', 'Scrapbook', 'Note Pad', 'Calculator'];
const FONT_OPTIONS = ['Geneva', 'Chicago', 'Monaco', 'New York', 'Athens', 'Cairo'];
const CTX_ITEMS: ContextMenuEntry[] = [
  'Get Info',
  'Duplicate',
  { separator: true },
  'Open',
  'Open With…',
  { separator: true },
  'Move to Trash',
  { separator: true },
  'Inspect (Smalltalk)',
  'Browse Senders',
];

// ── Showcase component ──

function MacOS1ShowcaseInner() {
  const [checkA, setCheckA] = useState(true);
  const [checkB, setCheckB] = useState(false);
  const [checkC, setCheckC] = useState(true);
  const [radio, setRadio] = useState(0);
  const [listSel, setListSel] = useState(2);
  const [dropdown, setDropdown] = useState(1);
  const [tool, setTool] = useState(0);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [showAlert, setShowAlert] = useState<'note' | 'caution' | 'stop' | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 2)), 150);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
      }}
      style={{
        padding: 16,
        fontFamily: 'var(--hc-font-family)',
        fontSize: 12,
        position: 'relative',
        minHeight: 600,
      }}
    >
      <h2 style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12 }}>macOS System 1 Widget Showcase</h2>

      {/* ── Row 1: Form controls + Tool palette + Halos ── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Form controls column */}
        <div style={{ minWidth: 280 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>PUSH BUTTONS</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
            <Btn isDefault onClick={() => setShowAlert('note')}>
              OK
            </Btn>
            <Btn>Cancel</Btn>
            <Btn disabled>Disabled</Btn>
          </div>

          <div style={{ display: 'flex', gap: 24, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>CHECKBOXES</div>
              <Checkbox label="Bold" checked={checkA} onChange={() => setCheckA(!checkA)} />
              <Checkbox label="Italic" checked={checkB} onChange={() => setCheckB(!checkB)} />
              <Checkbox label="Underline" checked={checkC} onChange={() => setCheckC(!checkC)} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>RADIO BUTTONS</div>
              <RadioButton label="9 point" selected={radio === 0} onChange={() => setRadio(0)} />
              <RadioButton label="10 point" selected={radio === 1} onChange={() => setRadio(1)} />
              <RadioButton label="12 point" selected={radio === 2} onChange={() => setRadio(2)} />
            </div>
          </div>

          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>DROPDOWN SELECTOR</div>
          <div style={{ marginBottom: 14 }}>
            <DropdownMenu options={FONT_OPTIONS} selected={dropdown} onSelect={setDropdown} />
          </div>

          <div style={{ display: 'flex', gap: 24, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>LIST BOX</div>
              <ListBox items={LIST_ITEMS} selected={listSel} onSelect={setListSel} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>DISCLOSURE TRIANGLES</div>
              <DisclosureTriangle label="System Folder">
                <div style={{ fontSize: 12 }}>System</div>
                <div style={{ fontSize: 12 }}>Finder</div>
                <DisclosureTriangle label="Extensions">
                  <div style={{ fontSize: 12 }}>Chooser</div>
                  <div style={{ fontSize: 12 }}>ImageWriter</div>
                </DisclosureTriangle>
              </DisclosureTriangle>
              <DisclosureTriangle label="Applications">
                <div style={{ fontSize: 12 }}>MacPaint</div>
                <div style={{ fontSize: 12 }}>MacWrite</div>
              </DisclosureTriangle>
            </div>
          </div>
        </div>

        {/* Tool Palette + Halos column */}
        <div>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>TOOL PALETTE</div>
          <div style={{ marginBottom: 16 }}>
            <ToolPalette tools={TOOLS} selected={tool} onSelect={setTool} />
          </div>

          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>SMALLTALK HALOS (hover)</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <HaloTarget label="a Button">
              <Btn>Morph</Btn>
            </HaloTarget>
            <HaloTarget label="a StringMorph">
              <div
                style={{
                  fontFamily: 'var(--hc-font-family)',
                  fontSize: 14,
                  border: '1px solid #000',
                  padding: '4px 10px',
                  background: '#fff',
                }}
              >
                Hello World
              </div>
            </HaloTarget>
          </div>
        </div>
      </div>

      {/* ── Row 2: Progress bar + Tabs ── */}
      <div style={{ maxWidth: 440 }}>
        <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>PROGRESS BAR</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <ProgressBar value={progress} width={200} />
          <span style={{ fontSize: 11 }}>Copying files… {Math.round(progress)}%</span>
        </div>

        <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>TAB CONTROL</div>
        <TabControl tabs={['General', 'Sound', 'Mouse']} activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === 0 && (
            <div style={{ padding: 12 }}>
              <div style={{ marginBottom: 6 }}>Desktop Pattern: Standard</div>
              <div>Time: {new Date().toLocaleTimeString()}</div>
            </div>
          )}
          {activeTab === 1 && (
            <div style={{ padding: 12 }}>
              <div style={{ marginBottom: 6 }}>Speaker Volume</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10 }}>🔈</span>
                <div style={{ width: 120, height: 8, border: '2px solid #000', background: '#fff' }}>
                  <div style={{ width: '60%', height: '100%', background: '#000' }} />
                </div>
                <span style={{ fontSize: 10 }}>🔊</span>
              </div>
            </div>
          )}
          {activeTab === 2 && (
            <div style={{ padding: 12 }}>
              <div style={{ marginBottom: 6 }}>Double-Click Speed</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <RadioButton label="Slow" selected onChange={() => {}} />
                <RadioButton label="Fast" selected={false} onChange={() => {}} />
              </div>
            </div>
          )}
        </TabControl>
      </div>

      <div style={{ marginTop: 12, fontSize: 10, color: '#888' }}>
        💡 Right-click anywhere for a context menu • Click OK for an alert dialog
      </div>

      {/* Alert overlay */}
      {showAlert && (
        <AlertDialog
          type={showAlert}
          message={
            showAlert === 'stop'
              ? 'The application has unexpectedly quit.'
              : showAlert === 'caution'
                ? 'Are you sure you want to erase the disk?'
                : 'Welcome to Macintosh.'
          }
          onOK={() => setShowAlert(null)}
        />
      )}

      {/* Right-click context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={CTX_ITEMS}
          onSelect={(item) => {
            if (item === 'Get Info') setShowAlert('note');
            else if (item === 'Move to Trash') setShowAlert('caution');
            else if (item.startsWith('Inspect') || item.startsWith('Browse')) setShowAlert('stop');
          }}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Engine/Widgets/macOS1Showcase',
  component: MacOS1ShowcaseInner,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MacOS1ShowcaseInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllWidgets: Story = {};
