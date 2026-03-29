import { RICH_PARTS as P } from '../parts';

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 160, height = 32 }: SparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);
  const barWidth = Math.max(1, Math.floor(width / data.length) - 1);

  return (
    <svg data-part={P.sparkline} width={width} height={height}>
      {data.map((value, i) => {
        const barHeight = (value / max) * (height - 2);
        return (
          <rect
            key={i}
            x={i * (barWidth + 1)}
            y={height - barHeight - 1}
            width={barWidth}
            height={barHeight}
          />
        );
      })}
    </svg>
  );
}
