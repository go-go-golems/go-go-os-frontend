/**
 * Bounded ring-buffer backed by a plain array.
 *
 * Provides O(1) push and O(n) window-slice for rolling aggregation.
 * Designed for use in Redux state (Immer-friendly: just an array + write index).
 */
export interface RingBufferState<T> {
  items: T[];
  capacity: number;
  /** Pointer to next write position (wraps). */
  cursor: number;
  /** Total items ever written (not capped by capacity). */
  total: number;
}

/** Create an empty ring-buffer state. */
export function createRingBuffer<T>(capacity: number): RingBufferState<T> {
  return { items: [], capacity, cursor: 0, total: 0 };
}

/** Push a value into the buffer, evicting the oldest if at capacity. Mutates in place (Immer-safe). */
export function ringPush<T>(buf: RingBufferState<T>, value: T): void {
  if (buf.items.length < buf.capacity) {
    buf.items.push(value);
  } else {
    buf.items[buf.cursor] = value;
  }
  buf.cursor = (buf.cursor + 1) % buf.capacity;
  buf.total += 1;
}

/**
 * Return items whose `ts` field is >= `sinceTs`, ordered oldest-first.
 * Assumes each item has a numeric `ts` property.
 */
export function ringWindowSince<T extends { ts: number }>(
  buf: RingBufferState<T>,
  sinceTs: number,
): T[] {
  return buf.items.filter((item) => item.ts >= sinceTs);
}

/** Return all items in insertion order (oldest first). */
export function ringToArray<T>(buf: RingBufferState<T>): T[] {
  if (buf.items.length < buf.capacity) return buf.items.slice();
  // Buffer is full: read from cursor (oldest) wrapping around
  return [...buf.items.slice(buf.cursor), ...buf.items.slice(0, buf.cursor)];
}

/** Clear the buffer. Mutates in place. */
export function ringClear<T>(buf: RingBufferState<T>): void {
  buf.items = [];
  buf.cursor = 0;
  buf.total = 0;
}
