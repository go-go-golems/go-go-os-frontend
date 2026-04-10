import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from '../../primitives/Checkbox';
import { RadioButton } from '../../primitives/RadioButton';

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const GROUP_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

// ── SelectionControls component ──

function SelectionControlsInner() {
  // Text formatting checkboxes
  const [formatting, setFormatting] = useState({
    bold: true,
    italic: false,
    underline: true,
    strikethrough: false,
    shadow: false,
  });

  // Alignment radio buttons
  const [align, setAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  // Style radio buttons
  const [style, setStyle] = useState<'plain' | 'bold' | 'italic' | 'boldItalic'>('plain');

  // Font family checkboxes
  const [fonts, setFonts] = useState({
    geneva: true,
    chicago: false,
    monaco: true,
    newYork: false,
  });

  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'var(--hc-font-family, Geneva, sans-serif)',
        fontSize: 12,
        width: 400,
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
        Selection Controls
      </h1>

      {/* ── Checkbox Groups ── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
        {/* Text Formatting */}
        <div>
          <div style={SECTION_LABEL_STYLE}>Text Formatting</div>
          <div style={GROUP_STYLE}>
            <Checkbox
              label="Bold"
              checked={formatting.bold}
              onChange={() => setFormatting((f) => ({ ...f, bold: !f.bold }))}
            />
            <Checkbox
              label="Italic"
              checked={formatting.italic}
              onChange={() => setFormatting((f) => ({ ...f, italic: !f.italic }))}
            />
            <Checkbox
              label="Underline"
              checked={formatting.underline}
              onChange={() => setFormatting((f) => ({ ...f, underline: !f.underline }))}
            />
            <Checkbox
              label="Strikethrough"
              checked={formatting.strikethrough}
              onChange={() => setFormatting((f) => ({ ...f, strikethrough: !f.strikethrough }))}
            />
            <Checkbox
              label="Shadow"
              checked={formatting.shadow}
              onChange={() => setFormatting((f) => ({ ...f, shadow: !f.shadow }))}
            />
          </div>
        </div>

        {/* Font Family */}
        <div>
          <div style={SECTION_LABEL_STYLE}>Font Family</div>
          <div style={GROUP_STYLE}>
            <Checkbox
              label="Geneva"
              checked={fonts.geneva}
              onChange={() => setFonts((f) => ({ ...f, geneva: !f.geneva }))}
            />
            <Checkbox
              label="Chicago"
              checked={fonts.chicago}
              onChange={() => setFonts((f) => ({ ...f, chicago: !f.chicago }))}
            />
            <Checkbox
              label="Monaco"
              checked={fonts.monaco}
              onChange={() => setFonts((f) => ({ ...f, monaco: !f.monaco }))}
            />
            <Checkbox
              label="New York"
              checked={fonts.newYork}
              onChange={() => setFonts((f) => ({ ...f, newYork: !f.newYork }))}
            />
          </div>
        </div>
      </div>

      {/* ── Radio Button Groups ── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
        {/* Alignment */}
        <div>
          <div style={SECTION_LABEL_STYLE}>Alignment</div>
          <div style={GROUP_STYLE}>
            <RadioButton
              label="Left"
              selected={align === 'left'}
              onChange={() => setAlign('left')}
            />
            <RadioButton
              label="Center"
              selected={align === 'center'}
              onChange={() => setAlign('center')}
            />
            <RadioButton
              label="Right"
              selected={align === 'right'}
              onChange={() => setAlign('right')}
            />
            <RadioButton
              label="Justify"
              selected={align === 'justify'}
              onChange={() => setAlign('justify')}
            />
          </div>
        </div>

        {/* Style */}
        <div>
          <div style={SECTION_LABEL_STYLE}>Font Style</div>
          <div style={GROUP_STYLE}>
            <RadioButton
              label="Plain"
              selected={style === 'plain'}
              onChange={() => setStyle('plain')}
            />
            <RadioButton
              label="Bold"
              selected={style === 'bold'}
              onChange={() => setStyle('bold')}
            />
            <RadioButton
              label="Italic"
              selected={style === 'italic'}
              onChange={() => setStyle('italic')}
            />
            <RadioButton
              label="Bold Italic"
              selected={style === 'boldItalic'}
              onChange={() => setStyle('boldItalic')}
            />
          </div>
        </div>
      </div>

      {/* ── Disabled States ── */}
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <div style={SECTION_LABEL_STYLE}>Disabled Checkboxes</div>
          <div style={GROUP_STYLE}>
            <Checkbox label="Disabled (on)" checked={true} onChange={() => {}} disabled />
            <Checkbox label="Disabled (off)" checked={false} onChange={() => {}} disabled />
          </div>
        </div>
        <div>
          <div style={SECTION_LABEL_STYLE}>Disabled Radio Buttons</div>
          <div style={GROUP_STYLE}>
            <RadioButton label="Disabled (on)" selected={true} onChange={() => {}} disabled />
            <RadioButton label="Disabled (off)" selected={false} onChange={() => {}} disabled />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/Controls/SelectionControls',
  component: SelectionControlsInner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Showcase demonstrating checkbox and radio button groups with interactive state management and disabled states.',
      },
    },
  },
} satisfies Meta<typeof SelectionControlsInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelectionControls: Story = {};
