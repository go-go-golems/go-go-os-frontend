import { describe, expect, it } from 'vitest';
import {
  executeReplSubmission,
  resolveReplCompletionState,
  type ReplDriver,
  type ReplDriverContext,
} from './index';

const TEST_CONTEXT: ReplDriverContext = {
  lines: [],
  historyStack: [],
  envVars: {},
  aliases: {},
  uptimeMs: 0,
};

const TEST_DRIVER: ReplDriver = {
  execute() {
    return { lines: [] };
  },
  getCompletions(input) {
    return input.startsWith('he')
      ? [
          { value: 'help', detail: 'Show help' },
          { value: 'hello', detail: 'Greet' },
        ]
      : [];
  },
};

describe('controller', () => {
  it('derives completion items for single-token inputs', () => {
    const completionState = resolveReplCompletionState('he', TEST_DRIVER, TEST_CONTEXT);
    expect(completionState.items.map((item) => item.value)).toEqual(['help', 'hello']);
    expect(completionState.suggestion).toBe('');
  });

  it('defers multi-token completion policy to the driver', () => {
    const completionState = resolveReplCompletionState('help to', TEST_DRIVER, TEST_CONTEXT);
    expect(completionState).toEqual({
      suggestion: '',
      items: [
        { value: 'help', detail: 'Show help' },
        { value: 'hello', detail: 'Greet' },
      ],
    });
  });

  it('supports async driver execution', async () => {
    const asyncDriver: ReplDriver = {
      async execute(raw) {
        return {
          lines: [{ type: 'output', text: `async:${raw}` }],
        };
      },
    };

    await expect(
      executeReplSubmission('run', asyncDriver, TEST_CONTEXT),
    ).resolves.toEqual({
      lines: [{ type: 'output', text: 'async:run' }],
    });
  });
});
