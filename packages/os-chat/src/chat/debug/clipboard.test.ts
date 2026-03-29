import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyTextToClipboard } from './clipboard';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('copyTextToClipboard', () => {
  it('uses navigator.clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await copyTextToClipboard('hello');

    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to document.execCommand copy when navigator.clipboard is unavailable', async () => {
    const textarea = {
      value: '',
      setAttribute: vi.fn(),
      style: {} as Record<string, string>,
      select: vi.fn(),
    };

    const body = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    };

    vi.stubGlobal('navigator', {});
    vi.stubGlobal('document', {
      body,
      createElement: vi.fn().mockReturnValue(textarea),
      execCommand: vi.fn().mockReturnValue(true),
    });

    await copyTextToClipboard('fallback');

    expect(body.appendChild).toHaveBeenCalledWith(textarea);
    expect(textarea.select).toHaveBeenCalledTimes(1);
    expect(body.removeChild).toHaveBeenCalledWith(textarea);
  });

  it('throws when clipboard APIs are unavailable', async () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('document', {
      body: null,
      createElement: vi.fn(),
      execCommand: vi.fn(),
    });

    await expect(copyTextToClipboard('nope')).rejects.toThrow('clipboard unavailable');
  });
});
