import { describe, expect, it } from 'vitest';
import { shouldPrefixWindowIcon } from './WindowTitleBar';

describe('shouldPrefixWindowIcon', () => {
  it('returns false when icon is missing', () => {
    expect(shouldPrefixWindowIcon('Inventory Chat')).toBe(false);
  });

  it('returns true when title does not already start with icon', () => {
    expect(shouldPrefixWindowIcon('Inventory Chat', '💬')).toBe(true);
  });

  it('returns false when title already starts with the same icon', () => {
    expect(shouldPrefixWindowIcon('💬 Inventory Chat', '💬')).toBe(false);
  });

  it('ignores leading whitespace before icon', () => {
    expect(shouldPrefixWindowIcon('   💬 Inventory Chat', '💬')).toBe(false);
  });
});
