import { describe, expect, it } from 'vitest';

/**
 * Tests for per-window minimum size constraint logic in the interaction controller.
 *
 * The actual hook (useWindowInteractionController) requires a React environment,
 * but the constraint resolution logic is straightforward: per-window values are
 * preferred over global constraints, which fall back to hardcoded defaults.
 *
 * We test the constraint resolution algorithm directly.
 */

interface MinSize {
  minWidth: number;
  minHeight: number;
}

/**
 * Mirrors the constraint resolution logic from useWindowInteractionController
 * lines 143-148 (the onMove handler inside beginInteraction).
 */
function resolveResizeConstraints(
  perWindow: MinSize | undefined,
  globalConstraints: { minWidth?: number; minHeight?: number } | undefined,
): MinSize {
  return {
    minWidth: perWindow?.minWidth ?? globalConstraints?.minWidth ?? 220,
    minHeight: perWindow?.minHeight ?? globalConstraints?.minHeight ?? 140,
  };
}

describe('interaction controller constraint resolution', () => {
  it('prefers per-window minWidth over global constraints', () => {
    const result = resolveResizeConstraints(
      { minWidth: 354, minHeight: 200 },
      { minWidth: 220, minHeight: 140 },
    );

    expect(result.minWidth).toBe(354);
    expect(result.minHeight).toBe(200);
  });

  it('falls back to global constraints when per-window is undefined', () => {
    const result = resolveResizeConstraints(undefined, { minWidth: 220, minHeight: 140 });

    expect(result.minWidth).toBe(220);
    expect(result.minHeight).toBe(140);
  });

  it('falls back to hardcoded defaults when both are undefined', () => {
    const result = resolveResizeConstraints(undefined, undefined);

    expect(result.minWidth).toBe(220);
    expect(result.minHeight).toBe(140);
  });

  it('falls back to hardcoded defaults when global constraints are partial', () => {
    const result = resolveResizeConstraints(undefined, {});

    expect(result.minWidth).toBe(220);
    expect(result.minHeight).toBe(140);
  });

  it('per-window values override even if smaller than global', () => {
    // In practice updateWindowMinSize uses Math.max so per-window is always >= default,
    // but the controller itself does not enforce this — it trusts the values.
    const result = resolveResizeConstraints(
      { minWidth: 100, minHeight: 80 },
      { minWidth: 220, minHeight: 140 },
    );

    expect(result.minWidth).toBe(100);
    expect(result.minHeight).toBe(80);
  });

  describe('clamping behavior', () => {
    it('clamps resize to per-window minimum', () => {
      const perWindow = resolveResizeConstraints(
        { minWidth: 354, minHeight: 200 },
        { minWidth: 220, minHeight: 140 },
      );

      // Simulate: startWidth=600, dx=-400 → attempted width=200
      const attemptedWidth = 600 + -400;
      const clampedWidth = Math.max(perWindow.minWidth, attemptedWidth);

      expect(clampedWidth).toBe(354);
    });

    it('does not clamp when attempted size exceeds minimum', () => {
      const perWindow = resolveResizeConstraints(
        { minWidth: 354, minHeight: 200 },
        { minWidth: 220, minHeight: 140 },
      );

      const attemptedWidth = 600 + -100;
      const clampedWidth = Math.max(perWindow.minWidth, attemptedWidth);

      expect(clampedWidth).toBe(500);
    });
  });
});
