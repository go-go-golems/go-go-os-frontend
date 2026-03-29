import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChartDataset, ChartTooltip, ChartType } from './types';
import {
  drawBarChart,
  drawLineChart,
  drawPieChart,
  drawScatterChart,
  getTooltipForPosition,
} from './rendering';

export function ChartCanvas({
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

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={(event) => {
        if (chartType === 'pie') return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        setTooltip(
          getTooltipForPosition(mouseX, mouseY, width, height, data, chartType === 'bar'),
        );
      }}
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
