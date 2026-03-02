import { useState, useRef, useEffect, useCallback } from 'react';
import { RICH_PARTS } from '../parts';
import type { TerminalLine } from './types';
import {
  BUILT_IN_COMMANDS,
  FORTUNES,
  ASCII_ART,
  INITIAL_LINES,
} from './sampleData';

// ── Props ────────────────────────────────────────────────────────────
export interface MacReplProps {
  /** Initial terminal lines */
  initialLines?: TerminalLine[];
  /** Prompt character */
  prompt?: string;
}

// ── Component ────────────────────────────────────────────────────────
export function MacRepl({
  initialLines = INITIAL_LINES,
  prompt = '⌘',
}: MacReplProps) {
  const [lines, setLines] = useState<TerminalLine[]>(initialLines);
  const [input, setInput] = useState('');
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestion, setSuggestion] = useState('');
  const [envVars, setEnvVars] = useState<Record<string, string>>({
    USER: 'macuser',
    HOME: '/Users/macuser',
    SHELL: '/bin/msh',
  });
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const startTime = useRef(Date.now());
  const [showCompletion, setShowCompletion] = useState(false);
  const [completions, setCompletions] = useState<string[]>([]);
  const [completionIdx, setCompletionIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getCompletions = useCallback(
    (partial: string) => {
      if (!partial) return [];
      const allCommands = [
        ...Object.keys(BUILT_IN_COMMANDS),
        ...Object.keys(aliases),
      ];
      return allCommands.filter((c) => c.startsWith(partial.toLowerCase()));
    },
    [aliases],
  );

  useEffect(() => {
    const parts = input.split(' ');
    if (parts.length === 1 && input.length > 0) {
      const matches = getCompletions(input);
      if (matches.length === 1 && matches[0] !== input) {
        setSuggestion(matches[0].slice(input.length));
      } else {
        setSuggestion('');
      }
      setCompletions(matches);
    } else {
      setSuggestion('');
      setCompletions([]);
      setShowCompletion(false);
    }
  }, [input, getCompletions]);

  const addLines = (newLines: TerminalLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  };

  const executeCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      addLines([{ type: 'input', text: trimmed }]);

      const parts = trimmed.split(/\s+/);
      let cmd = parts[0].toLowerCase();
      let args = parts.slice(1);

      if (aliases[cmd]) {
        const aliasParts = aliases[cmd].split(/\s+/);
        cmd = aliasParts[0].toLowerCase();
        args = [...aliasParts.slice(1), ...args];
      }

      const argStr = args.join(' ');

      switch (cmd) {
        case 'help': {
          if (args.length > 0) {
            const target = args[0].toLowerCase();
            const info =
              BUILT_IN_COMMANDS[target as keyof typeof BUILT_IN_COMMANDS];
            if (info) {
              addLines([
                { type: 'output', text: `${target} — ${info.desc}` },
                { type: 'output', text: `   Usage: ${info.usage}` },
              ]);
            } else {
              addLines([
                { type: 'error', text: `No help available for "${target}"` },
              ]);
            }
          } else {
            addLines([
              { type: 'system', text: '═══ Available Commands ═══' },
              ...Object.entries(BUILT_IN_COMMANDS).map(([k, v]) => ({
                type: 'output' as const,
                text: `  ${k.padEnd(12)} ${v.desc}`,
              })),
              { type: 'system', text: '' },
              {
                type: 'system',
                text: 'Tab = autocomplete  Up/Down = history  help <cmd> = details',
              },
            ]);
          }
          break;
        }
        case 'clear':
          setLines([]);
          break;
        case 'echo':
          addLines([{ type: 'output', text: argStr || '' }]);
          break;
        case 'history':
          if (historyStack.length === 0) {
            addLines([{ type: 'output', text: 'No commands in history.' }]);
          } else {
            addLines(
              historyStack.map((h, i) => ({
                type: 'output' as const,
                text: `  ${(i + 1).toString().padStart(4)}  ${h}`,
              })),
            );
          }
          break;
        case 'env':
          if (args.length === 0) {
            addLines(
              Object.entries(envVars).map(([k, v]) => ({
                type: 'output' as const,
                text: `  ${k}=${v}`,
              })),
            );
          } else {
            const eq = argStr.indexOf('=');
            if (eq > 0) {
              const key = argStr.slice(0, eq).trim();
              const val = argStr.slice(eq + 1).trim();
              setEnvVars((prev) => ({ ...prev, [key]: val }));
              addLines([{ type: 'output', text: `Set ${key}=${val}` }]);
            } else {
              const val = envVars[argStr.trim()];
              addLines([
                {
                  type: 'output',
                  text:
                    val !== undefined
                      ? `${argStr.trim()}=${val}`
                      : `Variable "${argStr.trim()}" not set`,
                },
              ]);
            }
          }
          break;
        case 'about':
          addLines([
            { type: 'system', text: '┌─────────────────────────────────┐' },
            { type: 'system', text: '│  Macintosh System REPL v1.0     │' },
            { type: 'system', text: '│  Built with React & nostalgia   │' },
            { type: 'system', text: '└─────────────────────────────────┘' },
          ]);
          break;
        case 'date':
          addLines([{ type: 'output', text: new Date().toLocaleString() }]);
          break;
        case 'calc': {
          if (!argStr) {
            addLines([{ type: 'error', text: 'Usage: calc <expression>' }]);
            break;
          }
          try {
            const sanitized = argStr.replace(/[^0-9+\-*/().%\s^]/g, '');
            const result = new Function(`"use strict"; return (${sanitized})`)();
            addLines([{ type: 'output', text: `${argStr} = ${result}` }]);
          } catch {
            addLines([
              { type: 'error', text: `Invalid expression: ${argStr}` },
            ]);
          }
          break;
        }
        case 'ascii':
          addLines(
            ASCII_ART.split('\n').map((l) => ({
              type: 'output' as const,
              text: l,
            })),
          );
          break;
        case 'whoami':
          addLines([{ type: 'output', text: envVars.USER }]);
          break;
        case 'uptime': {
          const secs = Math.floor((Date.now() - startTime.current) / 1000);
          const mins = Math.floor(secs / 60);
          const hrs = Math.floor(mins / 60);
          addLines([
            {
              type: 'output',
              text: `Session uptime: ${hrs}h ${mins % 60}m ${secs % 60}s`,
            },
          ]);
          break;
        }
        case 'fortune':
          addLines([
            {
              type: 'output',
              text: FORTUNES[Math.floor(Math.random() * FORTUNES.length)],
            },
          ]);
          break;
        case 'js': {
          if (!argStr) {
            addLines([{ type: 'error', text: 'Usage: js <expression>' }]);
            break;
          }
          try {
            const result = new Function(`"use strict"; return (${argStr})`)();
            const display =
              typeof result === 'object'
                ? JSON.stringify(result, null, 2)
                : String(result);
            addLines(
              display
                .split('\n')
                .map((l) => ({ type: 'output' as const, text: `→ ${l}` })),
            );
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            addLines([{ type: 'error', text: msg }]);
          }
          break;
        }
        case 'grep': {
          if (!argStr) {
            addLines([{ type: 'error', text: 'Usage: grep <pattern>' }]);
            break;
          }
          const pattern = new RegExp(argStr, 'i');
          const matches = lines.filter((l) => pattern.test(l.text));
          if (matches.length === 0) {
            addLines([
              { type: 'output', text: `No matches for "${argStr}"` },
            ]);
          } else {
            addLines([
              {
                type: 'system',
                text: `Found ${matches.length} match(es):`,
              },
              ...matches.map((m) => ({
                type: 'output' as const,
                text: `  ${m.text}`,
              })),
            ]);
          }
          break;
        }
        case 'alias':
          if (!argStr) {
            if (Object.keys(aliases).length === 0) {
              addLines([{ type: 'output', text: 'No aliases defined.' }]);
            } else {
              addLines(
                Object.entries(aliases).map(([k, v]) => ({
                  type: 'output' as const,
                  text: `  ${k}='${v}'`,
                })),
              );
            }
          } else {
            const eq = argStr.indexOf('=');
            if (eq > 0) {
              const name = argStr.slice(0, eq).trim();
              const val = argStr.slice(eq + 1).trim();
              setAliases((prev) => ({ ...prev, [name]: val }));
              addLines([{ type: 'output', text: `Alias: ${name} → ${val}` }]);
            } else {
              addLines([
                {
                  type: 'error',
                  text: 'Usage: alias name=command (e.g. alias ll=history)',
                },
              ]);
            }
          }
          break;
        case 'unalias':
          if (!argStr) {
            addLines([{ type: 'error', text: 'Usage: unalias <name>' }]);
          } else if (aliases[argStr]) {
            setAliases((prev) => {
              const copy = { ...prev };
              delete copy[argStr];
              return copy;
            });
            addLines([{ type: 'output', text: `Removed alias: ${argStr}` }]);
          } else {
            addLines([
              { type: 'error', text: `Alias "${argStr}" not found` },
            ]);
          }
          break;
        default:
          addLines([
            { type: 'error', text: `Command not found: ${cmd}` },
            { type: 'system', text: 'Type "help" for available commands' },
          ]);
      }
    },
    [aliases, envVars, historyStack, lines],
  );

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (trimmed) {
      setHistoryStack((prev) => [...prev, trimmed]);
    }
    executeCommand(trimmed);
    setInput('');
    setHistoryIndex(-1);
    setSuggestion('');
    setShowCompletion(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (completions.length === 1) {
        setInput(completions[0] + ' ');
        setShowCompletion(false);
      } else if (completions.length > 1) {
        if (showCompletion) {
          setInput(completions[completionIdx] + ' ');
          setShowCompletion(false);
        } else {
          setShowCompletion(true);
          setCompletionIdx(0);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showCompletion) {
        setCompletionIdx((i) => Math.max(0, i - 1));
      } else if (historyStack.length > 0) {
        const newIdx =
          historyIndex === -1
            ? historyStack.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIdx);
        setInput(historyStack[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showCompletion) {
        setCompletionIdx((i) => Math.min(completions.length - 1, i + 1));
      } else if (historyIndex !== -1) {
        const newIdx = historyIndex + 1;
        if (newIdx >= historyStack.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIdx);
          setInput(historyStack[newIdx]);
        }
      }
    } else if (e.key === 'Escape') {
      setShowCompletion(false);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div data-part={RICH_PARTS.repl}>
      {/* ── Terminal Body ── */}
      <div
        data-part={RICH_PARTS.replBody}
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            data-part={RICH_PARTS.replLine}
            data-line-type={line.type}
          >
            {line.type === 'input' ? (
              <span>
                <span style={{ opacity: 0.6 }}>▸ </span>
                {line.text}
              </span>
            ) : (
              line.text
            )}
          </div>
        ))}

        {/* ── Input Line ── */}
        <div data-part={RICH_PARTS.replInputLine}>
          <span data-part={RICH_PARTS.replPrompt}>{prompt}</span>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              ref={inputRef}
              data-part={RICH_PARTS.replInput}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
            {suggestion && (
              <span
                data-part={RICH_PARTS.replGhost}
                style={{ left: `${input.length * 7.2}px` }}
              >
                {suggestion}
              </span>
            )}
            {showCompletion && completions.length > 1 && (
              <div data-part={RICH_PARTS.replCompletionPopup}>
                {completions.map((c, i) => (
                  <div
                    key={c}
                    data-part={RICH_PARTS.replCompletionItem}
                    data-state={i === completionIdx ? 'active' : undefined}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setInput(c + ' ');
                      setShowCompletion(false);
                      inputRef.current?.focus();
                    }}
                  >
                    <span>{c}</span>
                    <span style={{ opacity: 0.5, marginLeft: 8 }}>
                      {BUILT_IN_COMMANDS[
                        c as keyof typeof BUILT_IN_COMMANDS
                      ]?.desc?.slice(0, 30) || 'alias'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div data-part={RICH_PARTS.replStatusBar}>
        <span>{envVars.HOME}</span>
        <span>{historyStack.length} cmds</span>
      </div>
    </div>
  );
}
