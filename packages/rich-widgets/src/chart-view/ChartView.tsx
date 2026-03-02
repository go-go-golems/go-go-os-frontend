import { useState, useRef, useEffect, useCallback } from 'react';
import { RadioButton } from '@hypercard/engine';
import { RICH_PARTS } from '../parts';
import type { ChartType, ChartDataset, ChartTooltip } from './types';
import { SAMPLE_DATASETS } from './sampleData';
import {
  drawLineChart,
  drawBarChart,
  drawPieChart,
  drawScatterChart,
  getTooltipForPosition,
  MARKER_SHAPES,
} from './rendering';

// ── Props ────────────────────────────────────────────────────────────
export interface ChartViewProps {
  /** Chart data to display */
  data: ChartDataset;
  /** Initial chart type (default: 'line') */
  initialChartType?: ChartType;
  /** Canvas width in pixels (default: 540) */
  width?: number;
  /** Canvas height in pixels (default: 320) */
  height?: number;
  /** Optional title shown above the chart */
  title?: string;
  /** Available chart types to show in controls (default: all) */
  availableTypes?: ChartType[];
  /** Optional list of datasets to switch between */
  datasets?: Record<string, ChartDataset>;
}

const CHART_TYPE_OPTIONS: Array<{ value: ChartType; label: string }> = [
  { value: 'line', label: '📈 Line' },
  { value: 'bar', label: '📊 Bar' },
  { value: 'pie', label: '🥧 Pie' },
  { value: 'scatter', label: '⭐ Scatter' },
];

const DASH_SVG_PATTERNS = [[''], ['6,3'], ['2,2'], ['8,3,2,3']];

// ── ChartCanvas sub-component ────────────────────────────────────────
function ChartCanvas({
  chartType,
  data,
  width,
  height,
}: {
  chartType: ChartType;
  data: ChartDataset;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);

  const draw = useCallback(
    (tip: ChartTooltip | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      switch (chartType) {
        case 'line':
          drawLineChart(canvas, data, tip);
          break;
        case 'bar':
          drawBarChart(canvas, data, tip);
          break;
        case 'pie':
          drawPieChart(canvas, data);
          break;
        case 'scatter':
          drawScatterChart(canvas, data);
          break;
      }
    },
    [chartType, data],
  );

  useEffect(() => {
    draw(tooltip);
  }, [draw, tooltip]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (chartType === 'pie') return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTooltip(
      getTooltipForPosition(mx, my, width, height, data, chartType === 'bar'),
    );
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip(null)}
      style={{
        display: 'block',
        cursor: tooltip ? 'crosshair' : 'default',
        width: '100%',
        height: 'auto',
      }}
    />
  );
}

// ── LegendBar sub-component ──────────────────────────────────────────
function LegendBar({
  series,
  chartType,
}: {
  series: ChartDataset['series'];
  chartType: ChartType;
}) {
  return (
    <div data-part={RICH_PARTS.chartViewLegend}>
      {series.map((s, i) => (
        <div
          key={s.name}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {chartType === 'line' ? (
            <svg width="22" height="10">
              <line
                x1="0"
                y1="5"
                x2="22"
                y2="5"
                stroke="#000"
                strokeWidth="2"
                strokeDasharray={DASH_SVG_PATTERNS[i % DASH_SVG_PATTERNS.length].join('')}
              />
              {MARKER_SHAPES[i % MARKER_SHAPES.length] === 'circle' ? (
                <circle
                  cx="11"
                  cy="5"
                  r="3"
                  fill="#fff"
                  stroke="#000"
                  strokeWidth="1.5"
                />
              ) : (
                <rect
                  x="8"
                  y="2"
                  width="6"
                  height="6"
                  fill="#fff"
                  stroke="#000"
                  strokeWidth="1.5"
                />
              )}
            </svg>
          ) : (
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 10,
                border: '1px solid var(--hc-color-border)',
                background: `repeating-linear-gradient(${45 + i * 30}deg, var(--hc-color-fg) 0px, var(--hc-color-fg) 1px, var(--hc-color-bg) 1px, var(--hc-color-bg) 3px)`,
              }}
            />
          )}
          <span style={{ fontSize: 10 }}>{s.name}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────
export function ChartView({
  data: initialData = SAMPLE_DATASETS['Quarterly Revenue'],
  initialChartType = 'line',
  width = 540,
  height = 320,
  title,
  availableTypes,
  datasets,
}: Partial<ChartViewProps> = {}) {
  const [chartType, setChartType] = useState<ChartType>(initialChartType);
  const [datasetKey, setDatasetKey] = useState<string>(
    datasets ? Object.keys(datasets)[0] : '',
  );

  const data = datasets ? (datasets[datasetKey] ?? initialData) : initialData;
  const types = availableTypes ?? CHART_TYPE_OPTIONS.map((o) => o.value);

  return (
    <div data-part={RICH_PARTS.chartView}>
      {/* Chart area */}
      <div data-part={RICH_PARTS.chartViewCanvas}>
        {title && (
          <div
            style={{
              fontWeight: 'bold',
              fontSize: 11,
              textAlign: 'center',
              padding: '4px 0',
              borderBottom: '1px solid var(--hc-color-border)',
            }}
          >
            📊 {title} — {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
          </div>
        )}
        <ChartCanvas
          chartType={chartType}
          data={data}
          width={width}
          height={height}
        />
        {data.series.length > 0 && (
          <LegendBar series={data.series} chartType={chartType} />
        )}
      </div>

      {/* Controls panel */}
      <div data-part={RICH_PARTS.chartViewControls}>
        {/* Chart type */}
        <div data-part={RICH_PARTS.chartViewControlGroup}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 'bold',
              borderBottom: '1px solid var(--hc-color-border)',
              paddingBottom: 2,
              marginBottom: 6,
            }}
          >
            Chart Type
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {CHART_TYPE_OPTIONS.filter((o) => types.includes(o.value)).map(
              (opt) => (
                <RadioButton
                  key={opt.value}
                  label={opt.label}
                  selected={chartType === opt.value}
                  onChange={() => setChartType(opt.value)}
                />
              ),
            )}
          </div>
        </div>

        {/* Dataset selector */}
        {datasets && (
          <div data-part={RICH_PARTS.chartViewControlGroup}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 'bold',
                borderBottom: '1px solid var(--hc-color-border)',
                paddingBottom: 2,
                marginBottom: 6,
              }}
            >
              Dataset
            </div>
            <select
              data-part="field-input"
              value={datasetKey}
              onChange={(e) => setDatasetKey(e.target.value)}
              style={{ width: '100%', fontSize: 11 }}
            >
              {Object.keys(datasets).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Info */}
        <div data-part={RICH_PARTS.chartViewInfo}>
          <b>ℹ️ Info</b>
          <br />
          Series: {data.series.length}
          <br />
          Points: {data.labels.length}
          <br />
          Max: {Math.max(...data.series.flatMap((s) => s.values))}
        </div>
      </div>
    </div>
  );
}
