import { describe, expect, it } from 'vitest';
import { timelineEntityFromProto } from './timelineMapper';

describe('timelineEntityFromProto', () => {
  it('keeps legacy tool_result entities unchanged during hard cutover', () => {
    const mapped = timelineEntityFromProto(
      {
        id: 'tool-1:custom',
        kind: 'tool_result',
        createdAtMs: 100,
        props: {
          customKind: 'hypercard.widget.v1',
          result: {
            itemId: 'widget-123',
            title: 'Low Stock Widget',
            data: { artifact: { id: 'artifact-1' } },
          },
        },
      } as any,
      7,
    );

    expect(mapped).toEqual(
      expect.objectContaining({
        id: 'tool-1:custom',
        kind: 'tool_result',
        version: 7,
        props: expect.objectContaining({
          customKind: 'hypercard.widget.v1',
        }),
      }),
    );
  });

  it('preserves first-class hypercard.card.v2 timeline kind and props', () => {
    const mapped = timelineEntityFromProto(
      {
        id: 'tool-card-1:result',
        kind: 'hypercard.card.v2',
        createdAtMs: 500,
        props: {
          toolCallId: 'tool-card-1',
          result: {
            itemId: 'card-first-class',
            title: 'Low Stock Drilldown',
            data: {
              artifact: { id: 'artifact-card-fc' },
              card: {
                id: 'runtime-low-stock',
                code: '({ ui }) => ({ render() { return ui.text("hi"); } })',
              },
            },
          },
        },
      } as any,
      11,
    );

    expect(mapped).toEqual(
      expect.objectContaining({
        id: 'tool-card-1:result',
        kind: 'hypercard.card.v2',
        version: 11,
        props: expect.objectContaining({
          toolCallId: 'tool-card-1',
          result: expect.objectContaining({
            itemId: 'card-first-class',
            title: 'Low Stock Drilldown',
          }),
        }),
      }),
    );
  });
});
