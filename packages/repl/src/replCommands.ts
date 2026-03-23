import { ASCII_ART, BUILT_IN_COMMANDS, FORTUNES } from './sampleData';
import type { ReplCompletionItem, ReplDriver, ReplDriverContext, ReplExecutionResult, TerminalLine } from './types';

export function getCompletions(
  partial: string,
  aliases: Record<string, string>,
): ReplCompletionItem[] {
  if (!partial) return [];
  const allCommands = [...Object.keys(BUILT_IN_COMMANDS), ...Object.keys(aliases)];
  return allCommands
    .filter((command) => command.startsWith(partial.toLowerCase()))
    .map((command) => ({
      value: command,
      detail: BUILT_IN_COMMANDS[command as keyof typeof BUILT_IN_COMMANDS]?.desc ?? 'alias',
    }));
}

export function executeReplCommand(
  raw: string,
  state: ReplDriverContext,
): ReplExecutionResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { lines: [] };
  }

  const newLines: TerminalLine[] = [{ type: 'input', text: trimmed }];
  const parts = trimmed.split(/\s+/);
  let cmd = parts[0].toLowerCase();
  let args = parts.slice(1);

  if (state.aliases[cmd]) {
    const aliasParts = state.aliases[cmd].split(/\s+/);
    cmd = aliasParts[0].toLowerCase();
    args = [...aliasParts.slice(1), ...args];
  }

  const argStr = args.join(' ');

  switch (cmd) {
    case 'help': {
      if (args.length > 0) {
        const target = args[0].toLowerCase();
        const info = BUILT_IN_COMMANDS[target as keyof typeof BUILT_IN_COMMANDS];
        if (info) {
          newLines.push(
            { type: 'output', text: `${target} — ${info.desc}` },
            { type: 'output', text: `   Usage: ${info.usage}` },
          );
        } else {
          newLines.push({ type: 'error', text: `No help available for "${target}"` });
        }
      } else {
        newLines.push(
          { type: 'system', text: '═══ Available Commands ═══' },
          ...Object.entries(BUILT_IN_COMMANDS).map(([key, value]) => ({
            type: 'output' as const,
            text: `  ${key.padEnd(12)} ${value.desc}`,
          })),
          { type: 'system', text: '' },
          { type: 'system', text: 'Tab = autocomplete  Up/Down = history  help <cmd> = details' },
        );
      }
      return { lines: newLines };
    }
    case 'clear':
      return { lines: [], clearTranscript: true };
    case 'echo':
      newLines.push({ type: 'output', text: argStr || '' });
      return { lines: newLines };
    case 'history':
      if (state.historyStack.length === 0) {
        newLines.push({ type: 'output', text: 'No commands in history.' });
      } else {
        newLines.push(
          ...state.historyStack.map((entry, index) => ({
            type: 'output' as const,
            text: `  ${(index + 1).toString().padStart(4)}  ${entry}`,
          })),
        );
      }
      return { lines: newLines };
    case 'env': {
      if (args.length === 0) {
        newLines.push(
          ...Object.entries(state.envVars).map(([key, value]) => ({
            type: 'output' as const,
            text: `  ${key}=${value}`,
          })),
        );
        return { lines: newLines };
      }
      const eq = argStr.indexOf('=');
      if (eq > 0) {
        const key = argStr.slice(0, eq).trim();
        const value = argStr.slice(eq + 1).trim();
        newLines.push({ type: 'output', text: `Set ${key}=${value}` });
        return {
          lines: newLines,
          envVars: { ...state.envVars, [key]: value },
        };
      }
      const value = state.envVars[argStr.trim()];
      newLines.push({
        type: 'output',
        text:
          value !== undefined
            ? `${argStr.trim()}=${value}`
            : `Variable "${argStr.trim()}" not set`,
      });
      return { lines: newLines };
    }
    case 'about':
      newLines.push(
        { type: 'system', text: '┌─────────────────────────────────┐' },
        { type: 'system', text: '│  Macintosh System REPL v1.0     │' },
        { type: 'system', text: '│  Built with React & nostalgia   │' },
        { type: 'system', text: '└─────────────────────────────────┘' },
      );
      return { lines: newLines };
    case 'date':
      newLines.push({ type: 'output', text: new Date().toLocaleString() });
      return { lines: newLines };
    case 'calc': {
      if (!argStr) {
        newLines.push({ type: 'error', text: 'Usage: calc <expression>' });
        return { lines: newLines };
      }
      try {
        const sanitized = argStr.replace(/[^0-9+\-*/().%\s^]/g, '');
        const result = new Function(`"use strict"; return (${sanitized})`)();
        newLines.push({ type: 'output', text: `${argStr} = ${result}` });
      } catch {
        newLines.push({ type: 'error', text: `Invalid expression: ${argStr}` });
      }
      return { lines: newLines };
    }
    case 'ascii':
      newLines.push(
        ...ASCII_ART.split('\n').map((line) => ({ type: 'output' as const, text: line })),
      );
      return { lines: newLines };
    case 'whoami':
      newLines.push({ type: 'output', text: state.envVars.USER });
      return { lines: newLines };
    case 'uptime': {
      const secs = Math.floor(state.uptimeMs / 1000);
      const mins = Math.floor(secs / 60);
      const hrs = Math.floor(mins / 60);
      newLines.push({
        type: 'output',
        text: `Session uptime: ${hrs}h ${mins % 60}m ${secs % 60}s`,
      });
      return { lines: newLines };
    }
    case 'fortune':
      newLines.push({
        type: 'output',
        text: FORTUNES[Math.floor(Math.random() * FORTUNES.length)],
      });
      return { lines: newLines };
    case 'js': {
      if (!argStr) {
        newLines.push({ type: 'error', text: 'Usage: js <expression>' });
        return { lines: newLines };
      }
      try {
        const result = new Function(`"use strict"; return (${argStr})`)();
        const display = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
        newLines.push(
          ...display.split('\n').map((line) => ({ type: 'output' as const, text: `→ ${line}` })),
        );
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        newLines.push({ type: 'error', text: msg });
      }
      return { lines: newLines };
    }
    case 'grep': {
      if (!argStr) {
        newLines.push({ type: 'error', text: 'Usage: grep <pattern>' });
        return { lines: newLines };
      }
      const pattern = new RegExp(argStr, 'i');
      const matches = state.lines.filter((line) => pattern.test(line.text));
      if (matches.length === 0) {
        newLines.push({ type: 'output', text: `No matches for "${argStr}"` });
      } else {
        newLines.push(
          { type: 'system', text: `Found ${matches.length} match(es):` },
          ...matches.map((match) => ({ type: 'output' as const, text: `  ${match.text}` })),
        );
      }
      return { lines: newLines };
    }
    case 'alias': {
      if (!argStr) {
        if (Object.keys(state.aliases).length === 0) {
          newLines.push({ type: 'output', text: 'No aliases defined.' });
        } else {
          newLines.push(
            ...Object.entries(state.aliases).map(([key, value]) => ({
              type: 'output' as const,
              text: `  ${key}='${value}'`,
            })),
          );
        }
        return { lines: newLines };
      }
      const eq = argStr.indexOf('=');
      if (eq > 0) {
        const name = argStr.slice(0, eq).trim();
        const value = argStr.slice(eq + 1).trim();
        newLines.push({ type: 'output', text: `Alias: ${name} → ${value}` });
        return { lines: newLines, aliases: { ...state.aliases, [name]: value } };
      }
      newLines.push({
        type: 'error',
        text: 'Usage: alias name=command (e.g. alias ll=history)',
      });
      return { lines: newLines };
    }
    case 'unalias':
      if (!argStr) {
        newLines.push({ type: 'error', text: 'Usage: unalias <name>' });
        return { lines: newLines };
      }
      if (state.aliases[argStr]) {
        const nextAliases = { ...state.aliases };
        delete nextAliases[argStr];
        newLines.push({ type: 'output', text: `Removed alias: ${argStr}` });
        return { lines: newLines, aliases: nextAliases };
      }
      newLines.push({ type: 'error', text: `Alias "${argStr}" not found` });
      return { lines: newLines };
    default:
      newLines.push(
        { type: 'error', text: `Command not found: ${cmd}` },
        { type: 'system', text: 'Type "help" for available commands' },
      );
      return { lines: newLines };
  }
}

export const BUILTIN_DEMO_REPL_DRIVER: ReplDriver = {
  execute(raw, context) {
    return executeReplCommand(raw, context);
  },
  getCompletions(input, context) {
    return getCompletions(input, context.aliases);
  },
  getHelp(topic) {
    if (!topic) {
      return Object.entries(BUILT_IN_COMMANDS).map(([command, info]) => ({
        title: command,
        detail: info.desc,
        usage: info.usage,
      }));
    }

    const info = BUILT_IN_COMMANDS[topic as keyof typeof BUILT_IN_COMMANDS];
    return info ? [{ title: topic, detail: info.desc, usage: info.usage }] : null;
  },
};
