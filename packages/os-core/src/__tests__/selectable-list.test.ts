import { describe, expect, it } from 'vitest';
import { nextSelection, normalizeSelectableListItems } from '../components/widgets/SelectableList';

describe('SelectableList helpers', () => {
  it('normalizes string items into list items', () => {
    const normalized = normalizeSelectableListItems(['Alpha', 'Beta']);
    expect(normalized).toHaveLength(2);
    expect(normalized[0].label).toBe('Alpha');
    expect(normalized[1].label).toBe('Beta');
  });

  it('single mode always keeps one selected id', () => {
    expect(nextSelection([], 'a', 'single')).toEqual(['a']);
    expect(nextSelection(['a'], 'b', 'single')).toEqual(['b']);
  });

  it('multiple mode toggles selected ids', () => {
    expect(nextSelection([], 'a', 'multiple')).toEqual(['a']);
    expect(nextSelection(['a'], 'a', 'multiple')).toEqual([]);
    expect(nextSelection(['a'], 'b', 'multiple')).toEqual(['a', 'b']);
  });

  it('keeps selection unchanged when item is disabled', () => {
    expect(nextSelection(['a'], 'b', 'single', true)).toEqual(['a']);
  });
});
