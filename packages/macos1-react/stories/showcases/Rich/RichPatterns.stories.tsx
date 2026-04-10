import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { Sparkline } from '../../../src/rich/Sparkline';
import { CommandPalette } from '../../../src/rich/CommandPalette';
import { SearchBar } from '../../../src/rich/SearchBar';
import { LabeledSlider } from '../../../src/rich/LabeledSlider';
import { WidgetToolbar } from '../../../src/rich/WidgetToolbar';
import { WidgetStatusBar } from '../../../src/rich/WidgetStatusBar';
import { EmptyState } from '../../../src/rich/EmptyState';
import { ButtonGroup } from '../../../src/rich/ButtonGroup';
import { ModalOverlay } from '../../../src/rich/ModalOverlay';
import { Separator } from '../../../src/rich/Separator';

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

// ── Fixture data ──

const COMMANDS = [
  { id: 'new-file', label: 'New Document', icon: '📄', shortcut: '⌘N' },
  { id: 'open-file', label: 'Open File', icon: '📂', shortcut: '⌘O' },
  { id: 'save-file', label: 'Save', icon: '💾', shortcut: '⌘S' },
  { id: 'save-as', label: 'Save As…', icon: '💾', shortcut: '⇧⌘S' },
  { id: 'export', label: 'Export…', icon: '📤' },
  { separator: true },
  { id: 'settings', label: 'Preferences', icon: '⚙️', shortcut: '⌘,' },
  { id: 'help', label: 'Help', icon: '❓', shortcut: '⌘?' },
];

// ── RichPatterns component ──

function RichPatternsInner() {
  // Sparkline state
  const [sparklineData, setSparklineData] = useState([3, 7, 2, 9, 4, 11, 6, 8, 1, 5]);

  // Command palette state
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteResult, setPaletteResult] = useState<string | null>(null);

  // Search bar state
  const [searchValue, setSearchValue] = useState('');
  const [searchCount] = useState(42);

  // Slider state
  const [volume, setVolume] = useState(65);
  const [brightness, setBrightness] = useState(80);

  // Button group state
  const [alignMode, setAlignMode] = useState<'left' | 'center' | 'right'>('left');

  // Modal state
  const [showModal, setShowModal] = useState(false);

  // Update sparkline data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSparklineData((prev) => [...prev.slice(1), Math.floor(Math.random() * 15) + 1]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(true);
      }
      if (e.key === 'Escape') {
        setShowPalette(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
        Rich Widget Patterns
      </h1>

      {/* ── Sparkline ── */}
      <div style={SECTION_LABEL_STYLE}>Sparkline (live updating)</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <Sparkline data={sparklineData} width={200} height={32} />
        <div style={{ fontSize: 11, color: '#666' }}>
          CPU: {sparklineData[sparklineData.length - 1]}%
        </div>
      </div>

      {/* ── Command Palette ── */}
      <div style={SECTION_LABEL_STYLE}>CommandPalette (⌘K to open)</div>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setShowPalette(true)} style={{ padding: '6px 12px' }}>
          Open Command Palette ⌘K
        </button>
        {paletteResult && (
          <div style={{ fontSize: 11, color: '#060', marginTop: 8 }}>
            ✓ Selected: {paletteResult}
          </div>
        )}
      </div>

      {/* ── SearchBar ── */}
      <div style={SECTION_LABEL_STYLE}>SearchBar</div>
      <div style={{ marginBottom: 20 }}>
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Search..."
          count={searchCount}
        />
        <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
          {searchValue ? `Searching for "${searchValue}"` : 'Start typing to search'}
        </div>
      </div>

      {/* ── LabeledSlider ── */}
      <div style={SECTION_LABEL_STYLE}>LabeledSlider</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        <LabeledSlider
          label="Volume"
          value={volume}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={setVolume}
        />
        <LabeledSlider
          label="Brightness"
          value={brightness}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={setBrightness}
        />
      </div>

      {/* ── WidgetToolbar ── */}
      <div style={SECTION_LABEL_STYLE}>WidgetToolbar</div>
      <div style={{ marginBottom: 20 }}>
        <WidgetToolbar>
          <button style={{ padding: '4px 8px' }}>▶ Run</button>
          <button style={{ padding: '4px 8px' }}>⏹ Stop</button>
          <button style={{ padding: '4px 8px' }}>↻ Reset</button>
          <Separator orientation="vertical" />
          <button style={{ padding: '4px 8px' }}>📊 Stats</button>
          <button style={{ padding: '4px 8px' }}>⚙ Settings</button>
        </WidgetToolbar>
      </div>

      {/* ── WidgetStatusBar ── */}
      <div style={SECTION_LABEL_STYLE}>WidgetStatusBar</div>
      <div style={{ marginBottom: 20 }}>
        <WidgetStatusBar>
          <span>Status: Running</span>
          <Separator orientation="vertical" />
          <span>Memory: 128MB</span>
          <Separator orientation="vertical" />
          <span>CPU: {sparklineData[sparklineData.length - 1]}%</span>
          <Separator orientation="vertical" />
          <span>Uptime: 2h 34m</span>
        </WidgetStatusBar>
      </div>

      {/* ── ButtonGroup ── */}
      <div style={SECTION_LABEL_STYLE}>ButtonGroup</div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Text Alignment</div>
        <ButtonGroup
          options={[
            { value: 'left', label: '← Left' },
            { value: 'center', label: 'Center ↔' },
            { value: 'right', label: 'Right →' },
          ]}
          value={alignMode}
          onChange={(v) => setAlignMode(v as typeof alignMode)}
        />
      </div>

      {/* ── EmptyState ── */}
      <div style={SECTION_LABEL_STYLE}>EmptyState</div>
      <div
        style={{
          height: 120,
          border: '1px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <EmptyState
          icon="📭"
          message="No items to display"
        />
      </div>

      {/* ── ModalOverlay ── */}
      <div style={SECTION_LABEL_STYLE}>ModalOverlay</div>
      <div>
        <button onClick={() => setShowModal(true)} style={{ padding: '6px 12px' }}>
          Open Modal
        </button>
        {showModal && (
          <ModalOverlay onClose={() => setShowModal(false)}>
            <div
              style={{
                background: '#fff',
                padding: 24,
                border: '2px solid #000',
                width: 300,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 14, marginBottom: 16 }}>Confirm Action</div>
              <div style={{ marginBottom: 16 }}>
                Are you sure you want to proceed with this action?
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={() => setShowModal(false)}>Cancel</button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    alert('Confirmed!');
                  }}
                  style={{ background: '#000', color: '#fff', border: 'none', padding: '4px 12px' }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>

      {/* Command Palette overlay */}
      {showPalette && (
        <CommandPalette
          query={paletteQuery}
          onQueryChange={setPaletteQuery}
          items={COMMANDS.filter((cmd) =>
            !('separator' in cmd) && cmd.label.toLowerCase().includes(paletteQuery.toLowerCase())
          )}
          onSelect={(item) => {
            setPaletteResult(item.label);
            setPaletteQuery('');
            setShowPalette(false);
          }}
          onClose={() => setShowPalette(false)}
        />
      )}
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/Rich/RichPatterns',
  component: RichPatternsInner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Showcase demonstrating rich widgets: Sparkline, CommandPalette, SearchBar, LabeledSlider, WidgetToolbar, WidgetStatusBar, EmptyState, ButtonGroup, and ModalOverlay.',
      },
    },
  },
} satisfies Meta<typeof RichPatternsInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RichPatterns: Story = {};
