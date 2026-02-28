import { describe, expect, it } from 'vitest';
import {
  buildArtifactOpenWindowPayload,
  extractArtifactUpsertFromSem,
  extractArtifactUpsertFromTimelineEntity,
  normalizeArtifactId,
} from './artifactRuntime';

describe('artifactRuntime', () => {
  it('builds deduped open-window payload when runtime card id is provided', () => {
    const payload = buildArtifactOpenWindowPayload({
      artifactId: 'detailed_inventory_summary',
      runtimeCardId: 'runtimeDetailedInventorySummary',
      title: 'Detailed Inventory Summary',
      stackId: 'inventory',
    });

    expect(payload).toBeTruthy();
    expect(payload?.dedupeKey).toBe('artifact:detailed_inventory_summary');
    expect(payload?.content.kind).toBe('card');
    expect(payload?.content.card?.cardId).toBe('runtimeDetailedInventorySummary');
    expect(payload?.content.card?.stackId).toBe('inventory');
    expect(payload?.content.card?.param).toBe('detailed_inventory_summary');
    expect(payload?.content.card?.cardSessionId).toBe('artifact-session:detailed_inventory_summary');
  });

  it('normalizes quoted artifact ids when building open payload', () => {
    const payload = buildArtifactOpenWindowPayload({
      artifactId: '"sales-summary-2026-02-20"',
      runtimeCardId: 'runtimeSalesSummary',
      title: "Today's Sales Summary",
      stackId: 'inventory',
    });

    expect(payload?.dedupeKey).toBe('artifact:sales-summary-2026-02-20');
    expect(payload?.content.card?.param).toBe('sales-summary-2026-02-20');
  });

  it('returns undefined when runtime card id is missing', () => {
    const payload = buildArtifactOpenWindowPayload({
      artifactId: 'sales-summary-2026-02-20',
      title: "Today's Sales Summary",
      stackId: 'inventory',
    });

    expect(payload).toBeUndefined();
  });

  it('extracts artifact upsert from direct hypercard widget ready events', () => {
    const widget = extractArtifactUpsertFromSem('hypercard.widget.v1', {
      title: 'Inventory Summary Report',
      widgetType: 'report',
      data: {
        artifact: {
          id: 'inventory-summary',
          data: { totalUnits: 59 },
        },
      },
    });
    expect(widget).toEqual({
      id: 'inventory-summary',
      title: 'Inventory Summary Report',
      template: 'report',
      data: { totalUnits: 59 },
      source: 'widget',
    });
  });

  it('extracts artifact upsert from hypercard.card.v2 with runtime card fields', () => {
    const card = extractArtifactUpsertFromSem('hypercard.card.v2', {
      title: 'Low Stock Drilldown',
      name: 'Low Stock Items',
      data: {
        artifact: {
          id: 'low-stock-drilldown',
          data: { threshold: 5 },
        },
        card: {
          id: 'lowStockDrilldown',
          code: '({ ui }) => ({ render() { return ui.text(\"hi\"); } })',
        },
      },
    });
    expect(card).toMatchObject({
      id: 'low-stock-drilldown',
      title: 'Low Stock Drilldown',
      data: { threshold: 5 },
      source: 'card',
      runtimeCardId: 'lowStockDrilldown',
      runtimeCardCode: '({ ui }) => ({ render() { return ui.text(\"hi\"); } })',
    });
  });

  it('does not extract artifact from legacy tool_result customKind timeline entity after cutover', () => {
    const projected = extractArtifactUpsertFromSem('timeline.upsert', {
      entity: {
        kind: 'tool_result',
        toolResult: {
          customKind: 'hypercard.card.v2',
          result: {
            title: 'Low Stock Drilldown',
            template: 'reportViewer',
            data: {
              artifact: {
                id: 'low-stock-drilldown',
                data: { threshold: 5 },
              },
            },
          },
        },
      },
    });

    expect(projected).toBeUndefined();
  });

  it('does not extract artifact from legacy timeline.upsert entity.props tool_result shape', () => {
    const projected = extractArtifactUpsertFromSem('timeline.upsert', {
      entity: {
        kind: 'tool_result',
        props: {
          customKind: 'hypercard.widget.v1',
          result: {
            title: "Today's Sales Summary",
            widgetType: 'report',
            data: {
              artifact: {
                id: '"sales-summary-2026-02-20"',
                data: { total_value: 0 },
              },
            },
          },
        },
      },
    });

    expect(projected).toBeUndefined();
  });

  it('extracts artifact upsert from timeline.upsert with first-class hypercard kind', () => {
    const projected = extractArtifactUpsertFromSem('timeline.upsert', {
      entity: {
        kind: 'hypercard.card.v2',
        props: {
          result: {
            title: 'Low Stock Drilldown',
            data: {
              artifact: {
                id: 'low-stock-drilldown',
                data: { threshold: 5 },
              },
              card: {
                id: 'runtime-low-stock',
                code: '({ ui }) => ({ render() { return ui.text("hi"); } })',
              },
            },
          },
        },
      },
    });

    expect(projected).toMatchObject({
      id: 'low-stock-drilldown',
      title: 'Low Stock Drilldown',
      source: 'card',
      runtimeCardId: 'runtime-low-stock',
    });
  });

  it('extracts fallback artifact upsert from remapped hypercard timeline entity props', () => {
    const upsert = extractArtifactUpsertFromTimelineEntity('hypercard_widget', {
      artifactId: '"sales-summary-2026-02-20"',
      title: "Today's Sales Summary",
      resultRaw:
        '{"title":"Today\\u0027s Sales Summary","widgetType":"report","data":{"artifact":{"id":"sales-summary-2026-02-20","data":{"total_transactions":0}}}}',
    });

    expect(upsert).toMatchObject({
      id: 'sales-summary-2026-02-20',
      title: "Today's Sales Summary",
      source: 'widget',
      data: { total_transactions: 0 },
    });
  });

  it('extracts runtime card fields from hypercard_card rawData props', () => {
    const upsert = extractArtifactUpsertFromTimelineEntity('hypercard_card', {
      title: 'Low Stock Drilldown',
      rawData: {
        title: 'Low Stock Drilldown',
        data: {
          artifact: {
            id: 'low-stock-drilldown',
            data: { threshold: 5 },
          },
          card: {
            id: 'runtime-low-stock',
            code: '({ ui }) => ({ render() { return ui.text("hi"); } })',
          },
        },
      },
    });

    expect(upsert).toMatchObject({
      id: 'low-stock-drilldown',
      source: 'card',
      data: { threshold: 5 },
      runtimeCardId: 'runtime-low-stock',
      runtimeCardCode: '({ ui }) => ({ render() { return ui.text("hi"); } })',
    });
  });

  it('extracts artifact from first-class hypercard kind in timeline entity path', () => {
    const upsert = extractArtifactUpsertFromTimelineEntity('hypercard.widget.v1', {
      result: {
        title: 'Inventory Snapshot',
        widgetType: 'report',
        data: {
          artifact: {
            id: 'inventory-snapshot-1',
            data: { totalSkus: 12 },
          },
        },
      },
    });

    expect(upsert).toMatchObject({
      id: 'inventory-snapshot-1',
      source: 'widget',
      data: { totalSkus: 12 },
    });
  });

  it('normalizes mixed quoting in artifact ids', () => {
    expect(normalizeArtifactId(' "abc-123" ')).toBe('abc-123');
    expect(normalizeArtifactId("'abc-123'")).toBe('abc-123');
    expect(normalizeArtifactId('')).toBeUndefined();
  });
});
