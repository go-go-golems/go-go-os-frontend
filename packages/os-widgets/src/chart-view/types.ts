export type ChartType = 'line' | 'bar' | 'pie' | 'scatter';

export interface ChartSeries {
  name: string;
  values: number[];
}

export interface ChartDataset {
  labels: string[];
  series: ChartSeries[];
}

export interface ChartTooltip {
  x: number;
  y: number;
  label: string;
  items: Array<{ name: string; value: number }>;
}

export type MarkerShape = 'square' | 'diamond' | 'circle' | 'triangle' | 'cross';

export type PatternFactory = (
  ctx: CanvasRenderingContext2D,
  color: string,
) => CanvasPattern | null;
