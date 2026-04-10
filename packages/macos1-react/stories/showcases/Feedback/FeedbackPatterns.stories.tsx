import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { ProgressBar } from '../../../src/primitives/ProgressBar';
import { Toast } from '../../../src/primitives/Toast';
import { AlertDialog } from '../../../src/primitives/AlertDialog';
import { ContextMenu } from '../../../src/primitives/ContextMenu';

// ── Style constants ──

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const DEMO_BOX_STYLE: React.CSSProperties = {
  padding: 16,
  background: '#fff',
  border: '2px solid #000',
  marginBottom: 16,
  position: 'relative' as const,
  minHeight: 120,
};

// ── FeedbackPatterns component ──

function FeedbackPatternsInner() {
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Item saved successfully');

  // Progress state
  const [progress, setProgress] = useState(0);
  const [isProgressing, setIsProgressing] = useState(false);

  // Alert state
  const [showAlert, setShowAlert] = useState<'note' | 'caution' | 'stop' | null>(null);
  const [alertMessage, setAlertMessage] = useState('');

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  // Progress animation
  useEffect(() => {
    if (!isProgressing) return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setIsProgressing(false);
          setToastMessage('Copy complete!');
          setShowToast(true);
          return 0;
        }
        return p + 2;
      });
    }, 150);
    return () => clearInterval(t);
  }, [isProgressing]);

  const handleStartCopy = () => {
    setIsProgressing(true);
    setToastMessage('Copying files...');
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'var(--hc-font-family, Geneva, sans-serif)',
        fontSize: 12,
        width: 480,
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
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
        Feedback Patterns
      </h1>

      {/* ── Progress Bar ── */}
      <div style={SECTION_LABEL_STYLE}>Progress Bar</div>
      <div style={DEMO_BOX_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <ProgressBar value={progress} width={200} />
          <span style={{ fontSize: 11, minWidth: 40 }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleStartCopy} style={{ padding: '4px 12px' }}>
            Start Copy
          </button>
          <button onClick={() => setIsProgressing(false)} style={{ padding: '4px 12px' }}>
            Stop
          </button>
          <button onClick={() => setProgress(0)} style={{ padding: '4px 12px' }}>
            Reset
          </button>
        </div>
      </div>

      {/* ── Toast ── */}
      <div style={SECTION_LABEL_STYLE}>Toast Notification</div>
      <div style={{ ...DEMO_BOX_STYLE, minHeight: 60 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setToastMessage('Item saved successfully'); setShowToast(true); }} style={{ padding: '4px 12px' }}>
            Show Success
          </button>
          <button onClick={() => { setToastMessage('3 files copied'); setShowToast(true); }} style={{ padding: '4px 12px' }}>
            Show Info
          </button>
          <button onClick={() => setShowToast(false)} style={{ padding: '4px 12px' }}>
            Dismiss
          </button>
        </div>
        {showToast && <Toast message={toastMessage} onDone={() => setShowToast(false)} />}
      </div>

      {/* ── Alert Dialogs ── */}
      <div style={SECTION_LABEL_STYLE}>Alert Dialogs</div>
      <div style={{ ...DEMO_BOX_STYLE, minHeight: 80 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { setAlertMessage('Welcome to Macintosh.'); setShowAlert('note'); }} style={{ padding: '4px 12px' }}>
            Note
          </button>
          <button onClick={() => { setAlertMessage('Are you sure you want to erase the disk?'); setShowAlert('caution'); }} style={{ padding: '4px 12px' }}>
            Caution
          </button>
          <button onClick={() => { setAlertMessage('The application has unexpectedly quit.'); setShowAlert('stop'); }} style={{ padding: '4px 12px' }}>
            Stop
          </button>
        </div>
        {showAlert && (
          <AlertDialog type={showAlert} message={alertMessage} onOK={() => setShowAlert(null)} />
        )}
      </div>

      {/* ── Context Menu ── */}
      <div style={SECTION_LABEL_STYLE}>Context Menu (right-click anywhere)</div>
      <div style={{ ...DEMO_BOX_STYLE, fontSize: 11, color: '#888', textAlign: 'center' as const }}>
        Right-click on this area to see the context menu
        {ctxMenu && (
          <ContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            items={[
              { id: 'info', label: 'Get Info', commandId: 'file.get-info', shortcut: '⌘I' },
              { id: 'dup', label: 'Duplicate', commandId: 'file.duplicate', shortcut: '⌘D' },
              { separator: true },
              { id: 'open', label: 'Open', commandId: 'file.open' },
              { id: 'open-with', label: 'Open With…', commandId: 'file.open-with' },
              { separator: true },
              { id: 'trash', label: 'Move to Trash', commandId: 'file.trash' },
              { separator: true },
              { id: 'inspect', label: 'Inspect (Smalltalk)', commandId: 'debug.inspect' },
            ]}
            onSelect={() => {}}
            onClose={() => setCtxMenu(null)}
          />
        )}
      </div>
    </div>
  );
}

// ── Meta ──

const meta = {
  title: 'Showcases/Feedback/FeedbackPatterns',
  component: FeedbackPatternsInner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Showcase demonstrating feedback widgets: progress bars with animation, toast notifications, alert dialogs, and context menus.',
      },
    },
  },
} satisfies Meta<typeof FeedbackPatternsInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FeedbackPatterns: Story = {};
