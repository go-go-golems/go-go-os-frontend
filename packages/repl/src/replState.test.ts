import { describe, expect, it } from 'vitest';
import {
  createMacReplStateSeed,
  macReplActions,
  macReplReducer,
} from './index';

describe('replState', () => {
  it('builds a seeded state with overrides', () => {
    const state = createMacReplStateSeed({
      prompt: 'sql>',
      historyStack: ['select 1'],
      envVars: { DB: 'app' },
      aliases: { ll: 'ls -lah' },
    });

    expect(state.prompt).toBe('sql>');
    expect(state.historyStack).toEqual(['select 1']);
    expect(state.envVars.DB).toBe('app');
    expect(state.aliases.ll).toBe('ls -lah');
    expect(state.lines.length).toBeGreaterThan(0);
  });

  it('updates lines and aliases through reducers', () => {
    const seeded = createMacReplStateSeed();
    const updated = macReplReducer(
      macReplReducer(
        seeded,
        macReplActions.appendLines([{ type: 'output', text: 'hello' }]),
      ),
      macReplActions.setAlias({ key: 'gs', value: 'git status' }),
    );

    expect(updated.lines.at(-1)).toEqual({ type: 'output', text: 'hello' });
    expect(updated.aliases.gs).toBe('git status');
  });
});
