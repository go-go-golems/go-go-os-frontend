import { describe, expect, it } from 'vitest';
import { toStoryParam } from '../app/generateCardStories';

describe('toStoryParam', () => {
  it('keeps string params unchanged', () => {
    expect(toStoryParam('abc')).toBe('abc');
  });

  it('encodes structured params as JSON strings', () => {
    expect(toStoryParam({ id: 'c1', tab: 'notes' })).toBe('{"id":"c1","tab":"notes"}');
  });

  it('returns undefined when params are omitted', () => {
    expect(toStoryParam(undefined)).toBeUndefined();
  });
});
