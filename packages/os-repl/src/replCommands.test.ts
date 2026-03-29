import { describe, expect, it } from 'vitest';
import { BUILTIN_DEMO_REPL_DRIVER, executeReplCommand, getCompletions } from './index';

const baseContext: ReplDriverContext = {
  lines: [],
  historyStack: [],
  envVars: {
    USER: 'macuser',
    HOME: '/Users/macuser',
    SHELL: '/bin/msh',
  },
  aliases: {},
  uptimeMs: 12_345,
};

describe('replCommands', () => {
  it('returns generic completion items with details', () => {
    expect(getCompletions('he', {})).toEqual([
      { value: 'help', detail: 'Show available commands and usage' },
    ]);
  });

  it('marks clear as a transcript-clearing result', () => {
    expect(executeReplCommand('clear', baseContext)).toEqual({
      lines: [],
      clearTranscript: true,
    });
  });

  it('exposes help through the demo driver', () => {
    expect(BUILTIN_DEMO_REPL_DRIVER.getHelp?.('help', baseContext)).toEqual([
      expect.objectContaining({
        title: 'help',
        usage: 'help [command]',
      }),
    ]);
  });
});
