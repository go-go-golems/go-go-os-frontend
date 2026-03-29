import type { CommandInfo, TerminalLine } from './types';

export const BUILT_IN_COMMANDS: Record<string, CommandInfo> = {
  help: { desc: 'Show available commands and usage', usage: 'help [command]' },
  clear: { desc: 'Clear the terminal screen', usage: 'clear' },
  echo: { desc: 'Print text to the terminal', usage: 'echo <text>' },
  history: { desc: 'Show command history', usage: 'history' },
  env: { desc: 'Show/set environment variables', usage: 'env [key=value]' },
  about: { desc: 'About this system', usage: 'about' },
  date: { desc: 'Show current date and time', usage: 'date' },
  calc: { desc: 'Evaluate a math expression', usage: 'calc <expression>' },
  whoami: { desc: 'Display current user', usage: 'whoami' },
  uptime: { desc: 'Show session uptime', usage: 'uptime' },
  fortune: { desc: 'Get a random fortune', usage: 'fortune' },
  js: { desc: 'Evaluate JavaScript expression', usage: 'js <expression>' },
  grep: { desc: 'Search output history for a pattern', usage: 'grep <pattern>' },
  alias: { desc: 'Create a command alias', usage: 'alias <name>=<command>' },
  unalias: { desc: 'Remove an alias', usage: 'unalias <name>' },
};

export const FORTUNES = [
  'The best way to predict the future is to invent it. — Alan Kay',
  'Simplicity is the ultimate sophistication. — Leonardo da Vinci',
  'Real artists ship. — Steve Jobs',
  'The computer was born to solve problems that did not exist before. — Bill Gates',
  'Any sufficiently advanced technology is indistinguishable from magic. — Arthur C. Clarke',
  'Talk is cheap. Show me the code. — Linus Torvalds',
  'First, solve the problem. Then, write the code. — John Johnson',
  'In the middle of difficulty lies opportunity. — Albert Einstein',
];

export const ASCII_ART = `
    +========================+
    |  +------------------+  |
    |  |  Welcome to      |  |
    |  |   Macintosh      |  |
    |  +------------------+  |
    |                        |
    +========================+
    |  ################      |
    +========================+
`;

export const INITIAL_LINES: TerminalLine[] = [
  { type: 'system', text: 'Macintosh System REPL v1.0' },
  { type: 'system', text: 'Type "help" for available commands. Tab to autocomplete.' },
  { type: 'system', text: '' },
];
