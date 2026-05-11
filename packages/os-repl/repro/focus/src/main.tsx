import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MacRepl } from '../../../src/MacRepl';
import type { ReplDriver } from '../../../src/types';
import '../../../src/theme.css';
import './styles.css';

const driver: ReplDriver = {
  async execute(raw, context) {
    const input = raw.trim();
    if (input === 'status') {
      return {
        lines: [
          { type: 'output', text: `history entries: ${context.historyStack.length}` },
          { type: 'output', text: `uptime: ${Math.round(context.uptimeMs / 1000)}s` },
        ],
      };
    }
    return {
      lines: [{ type: 'output', text: `echo: ${raw}` }],
    };
  },
};

function App() {
  return (
    <main className="focus-repro">
      <h1>os-repl focus repro</h1>
      <p>Type <code>status</code>, press Enter, and check whether focus remains in the REPL input.</p>
      <section className="focus-repro__terminal">
        <MacRepl
          prompt="λ"
          driver={driver}
          initialLines={[
            { type: 'system', text: 'focus repro loaded' },
            { type: 'output', text: 'try: status' },
          ]}
        />
      </section>
    </main>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
