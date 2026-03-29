import { describe, expect, it } from 'vitest';
import { isMissingRequiredValue } from '../components/widgets/FormView';

describe('FormView required value helper', () => {
  it('treats undefined, null, and empty string as missing', () => {
    expect(isMissingRequiredValue(undefined)).toBe(true);
    expect(isMissingRequiredValue(null)).toBe(true);
    expect(isMissingRequiredValue('')).toBe(true);
    expect(isMissingRequiredValue('   ')).toBe(true);
  });

  it('treats false and zero as valid required values', () => {
    expect(isMissingRequiredValue(false)).toBe(false);
    expect(isMissingRequiredValue(0)).toBe(false);
  });

  it('treats NaN and empty arrays as missing values', () => {
    expect(isMissingRequiredValue(Number.NaN)).toBe(true);
    expect(isMissingRequiredValue([])).toBe(true);
    expect(isMissingRequiredValue(['value'])).toBe(false);
  });
});
