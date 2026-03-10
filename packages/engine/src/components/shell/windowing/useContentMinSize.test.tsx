// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ContentMinSize, useContentMinSize } from './useContentMinSize';

// jsdom does not perform real layout, so scrollWidth/scrollHeight are always 0.
// We test the hook's callback mechanics and dedup logic using mocked scrollWidth.
// ResizeObserver is not available in jsdom; the hook guards itself with typeof check.

const roots: Root[] = [];
const containers: HTMLElement[] = [];

function mount(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => root.render(element));
  return { root, container };
}

afterEach(() => {
  for (const root of roots) {
    act(() => root.unmount());
  }
  roots.length = 0;
  for (const container of containers) {
    container.remove();
  }
  containers.length = 0;
});

function TestComponent({ onMinSize }: { onMinSize?: (size: ContentMinSize) => void }) {
  const ref = useContentMinSize(onMinSize);
  return (
    <div ref={ref} data-testid="body">
      <div style={{ minWidth: 200 }}>content</div>
    </div>
  );
}

describe('useContentMinSize', () => {
  it('calls onMinSize on mount', () => {
    const onMinSize = vi.fn();
    mount(<TestComponent onMinSize={onMinSize} />);

    // jsdom scrollWidth = 0, so measured min is 0:0
    expect(onMinSize).toHaveBeenCalledTimes(1);
    expect(onMinSize).toHaveBeenCalledWith({ minW: 0, minH: 0 });
  });

  it('does not call onMinSize again on re-render if values unchanged', () => {
    const onMinSize = vi.fn();
    const { root } = mount(<TestComponent onMinSize={onMinSize} />);

    expect(onMinSize).toHaveBeenCalledTimes(1);

    // Re-render with same content
    act(() => root.render(<TestComponent onMinSize={onMinSize} />));

    // Should still be 1 call — dedup prevents re-fire
    expect(onMinSize).toHaveBeenCalledTimes(1);
  });

  it('calls onMinSize again when scrollWidth changes', () => {
    const onMinSize = vi.fn();
    const { container } = mount(<TestComponent onMinSize={onMinSize} />);

    expect(onMinSize).toHaveBeenCalledTimes(1);

    // Mock scrollWidth changing (simulate content change)
    const body = container.querySelector('[data-testid="body"]') as HTMLElement;
    Object.defineProperty(body, 'scrollWidth', { value: 354, configurable: true });
    Object.defineProperty(body, 'scrollHeight', { value: 200, configurable: true });

    // Force re-render
    const root = roots[0];
    act(() => root.render(<TestComponent onMinSize={onMinSize} />));

    expect(onMinSize).toHaveBeenCalledTimes(2);
    expect(onMinSize).toHaveBeenLastCalledWith({ minW: 354, minH: 200 });
  });

  it('does not call onMinSize when callback is undefined', () => {
    // Should not throw
    expect(() => mount(<TestComponent />)).not.toThrow();
  });

  it('restores original style.width after measurement', () => {
    const { container } = mount(<TestComponent />);
    const body = container.querySelector('[data-testid="body"]') as HTMLElement;

    // The hook sets width to '0px' then restores. After mount, width should be empty.
    expect(body.style.width).toBe('');
  });
});
