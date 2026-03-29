import type { ChartDataset, ChartTooltip, MarkerShape, PatternFactory } from './types';

const FONT = '"Geneva", "Chicago", monospace';

// ── Fill Patterns (classic Mac dithered fills) ───────────────────────
export const PATTERNS: PatternFactory[] = [
  // Diagonal hash
  (ctx, color) => {
    const p = document.createElement('canvas');
    p.width = 6;
    p.height = 6;
    const pc = p.getContext('2d')!;
    pc.fillStyle = '#fff';
    pc.fillRect(0, 0, 6, 6);
    pc.strokeStyle = color;
    pc.lineWidth = 1;
    pc.beginPath();
    pc.moveTo(0, 6);
    pc.lineTo(6, 0);
    pc.stroke();
    return ctx.createPattern(p, 'repeat');
  },
  // Dots
  (ctx, color) => {
    const p = document.createElement('canvas');
    p.width = 4;
    p.height = 4;
    const pc = p.getContext('2d')!;
    pc.fillStyle = '#fff';
    pc.fillRect(0, 0, 4, 4);
    pc.fillStyle = color;
    pc.fillRect(0, 0, 2, 2);
    return ctx.createPattern(p, 'repeat');
  },
  // Horizontal lines
  (ctx, color) => {
    const p = document.createElement('canvas');
    p.width = 4;
    p.height = 4;
    const pc = p.getContext('2d')!;
    pc.fillStyle = '#fff';
    pc.fillRect(0, 0, 4, 4);
    pc.fillStyle = color;
    pc.fillRect(0, 0, 4, 2);
    return ctx.createPattern(p, 'repeat');
  },
  // Cross hatch
  (ctx, color) => {
    const p = document.createElement('canvas');
    p.width = 6;
    p.height = 6;
    const pc = p.getContext('2d')!;
    pc.fillStyle = '#fff';
    pc.fillRect(0, 0, 6, 6);
    pc.strokeStyle = color;
    pc.lineWidth = 1;
    pc.beginPath();
    pc.moveTo(0, 6);
    pc.lineTo(6, 0);
    pc.moveTo(0, 0);
    pc.lineTo(6, 6);
    pc.stroke();
    return ctx.createPattern(p, 'repeat');
  },
  // Vertical lines
  (ctx, color) => {
    const p = document.createElement('canvas');
    p.width = 4;
    p.height = 4;
    const pc = p.getContext('2d')!;
    pc.fillStyle = '#fff';
    pc.fillRect(0, 0, 4, 4);
    pc.fillStyle = color;
    pc.fillRect(0, 0, 2, 4);
    return ctx.createPattern(p, 'repeat');
  },
  // Dense dots
  (ctx, color) => {
    const p = document.createElement('canvas');
    p.width = 3;
    p.height = 3;
    const pc = p.getContext('2d')!;
    pc.fillStyle = '#fff';
    pc.fillRect(0, 0, 3, 3);
    pc.fillStyle = color;
    pc.fillRect(0, 0, 1, 1);
    pc.fillRect(1, 2, 1, 1);
    return ctx.createPattern(p, 'repeat');
  },
];

export const MARKER_SHAPES: MarkerShape[] = [
  'square',
  'diamond',
  'circle',
  'triangle',
  'cross',
];

const DASH_PATTERNS: number[][] = [[], [6, 3], [2, 2], [8, 3, 2, 3], [4, 4]];

const PAD = { top: 20, right: 20, bottom: 40, left: 50 };

function drawMarker(
  ctx: CanvasRenderingContext2D,
  shape: MarkerShape,
  x: number,
  y: number,
  size: number,
) {
  ctx.beginPath();
  switch (shape) {
    case 'square':
      ctx.rect(x - size, y - size, size * 2, size * 2);
      break;
    case 'diamond':
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      break;
    case 'circle':
      ctx.arc(x, y, size, 0, Math.PI * 2);
      break;
    case 'triangle':
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x - size, y + size);
      ctx.closePath();
      break;
    case 'cross':
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
      break;
  }
}

function drawAxesAndGrid(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  maxVal: number,
  labels: string[],
  isBarChart: boolean,
) {
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  // Grid
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  for (let i = 0; i <= 5; i++) {
    const y = PAD.top + (ch / 5) * i;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + cw, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Axes
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + ch);
  ctx.lineTo(PAD.left + cw, PAD.top + ch);
  ctx.stroke();

  // Y labels
  ctx.fillStyle = '#000';
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const val = Math.round(maxVal * (1 - i / 5));
    ctx.fillText(String(val), PAD.left - 6, PAD.top + (ch / 5) * i + 4);
  }

  // X labels
  ctx.textAlign = 'center';
  const step = isBarChart ? cw / labels.length : cw / (labels.length - 1);
  labels.forEach((label, i) => {
    const x = isBarChart
      ? PAD.left + step * i + step / 2
      : PAD.left + step * i;
    ctx.fillText(label, x, PAD.top + ch + 16);
  });
}

function drawTooltip(
  ctx: CanvasRenderingContext2D,
  W: number,
  tooltip: ChartTooltip,
) {
  const { x, y, label, items } = tooltip;
  const tw = 120;
  const th = 14 + items.length * 14;
  const tx = Math.min(x + 10, W - tw - 4);
  const ty = Math.max(y - th - 10, 4);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.fillRect(tx, ty, tw, th);
  ctx.strokeRect(tx, ty, tw, th);
  ctx.fillStyle = '#000';
  ctx.font = `bold 10px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(label, tx + 4, ty + 11);
  ctx.font = `10px ${FONT}`;
  items.forEach((item, i) => {
    ctx.fillText(`${item.name}: ${item.value}`, tx + 4, ty + 25 + i * 14);
  });
}

export function drawLineChart(
  canvas: HTMLCanvasElement,
  data: ChartDataset,
  tooltip: ChartTooltip | null,
) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;
  const allVals = data.series.flatMap((s) => s.values);
  const maxVal = Math.ceil(Math.max(...allVals) / 10) * 10;

  drawAxesAndGrid(ctx, W, H, maxVal, data.labels, false);

  // Series
  data.series.forEach((series, si) => {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.setLineDash(DASH_PATTERNS[si % DASH_PATTERNS.length]);
    ctx.beginPath();
    series.values.forEach((val, vi) => {
      const x = PAD.left + (cw / (data.labels.length - 1)) * vi;
      const y = PAD.top + ch - (val / maxVal) * ch;
      if (vi === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Markers
    series.values.forEach((val, vi) => {
      const x = PAD.left + (cw / (data.labels.length - 1)) * vi;
      const y = PAD.top + ch - (val / maxVal) * ch;
      drawMarker(ctx, MARKER_SHAPES[si % MARKER_SHAPES.length], x, y, 4);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  });

  if (tooltip) drawTooltip(ctx, W, tooltip);
}

export function drawBarChart(
  canvas: HTMLCanvasElement,
  data: ChartDataset,
  tooltip: ChartTooltip | null,
) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;
  const allVals = data.series.flatMap((s) => s.values);
  const maxVal = Math.ceil(Math.max(...allVals) / 10) * 10;

  drawAxesAndGrid(ctx, W, H, maxVal, data.labels, true);

  const nGroups = data.labels.length;
  const nSeries = data.series.length;
  const groupW = cw / nGroups;
  const barPad = groupW * 0.15;
  const barW = (groupW - barPad * 2) / nSeries;

  data.series.forEach((series, si) => {
    series.values.forEach((val, gi) => {
      const gx = PAD.left + groupW * gi;
      const bx = gx + barPad + barW * si;
      const bh = (val / maxVal) * ch;
      const by = PAD.top + ch - bh;
      const pattern = PATTERNS[si % PATTERNS.length](ctx, '#000');
      ctx.fillStyle = pattern ?? '#000';
      ctx.fillRect(bx, by, barW - 1, bh);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, barW - 1, bh);
    });
  });

  if (tooltip) drawTooltip(ctx, W, tooltip);
}

export function drawPieChart(
  canvas: HTMLCanvasElement,
  data: ChartDataset,
) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2 - 60;
  const cy = H / 2;
  const r = Math.min(cx - 30, cy - 30);
  const values = data.series[0].values;
  const total = values.reduce((a, b) => a + b, 0);

  let angle = -Math.PI / 2;
  values.forEach((val, i) => {
    const slice = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    const pattern = PATTERNS[i % PATTERNS.length](ctx, '#000');
    ctx.fillStyle = pattern ?? '#000';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    angle += slice;
  });

  // Legend
  const lx = W / 2 + 40;
  const ly = 30;
  ctx.font = `bold 10px ${FONT}`;
  ctx.fillStyle = '#000';
  ctx.textAlign = 'left';
  ctx.fillText('Legend', lx, ly);

  values.forEach((val, i) => {
    const iy = ly + 18 + i * 22;
    const pattern = PATTERNS[i % PATTERNS.length](ctx, '#000');
    ctx.fillStyle = pattern ?? '#000';
    ctx.fillRect(lx, iy - 8, 14, 14);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, iy - 8, 14, 14);
    ctx.fillStyle = '#000';
    ctx.font = `10px ${FONT}`;
    ctx.fillText(
      `${data.labels[i]} (${Math.round((val / total) * 100)}%)`,
      lx + 20,
      iy + 3,
    );
  });
}

export function drawScatterChart(
  canvas: HTMLCanvasElement,
  data: ChartDataset,
) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;
  const allVals = data.series.flatMap((s) => s.values);
  const maxVal = Math.ceil(Math.max(...allVals) / 10) * 10;

  drawAxesAndGrid(ctx, W, H, maxVal, data.labels, false);

  data.series.forEach((series, si) => {
    series.values.forEach((val, vi) => {
      const x = PAD.left + (cw / (data.labels.length - 1)) * vi;
      const y = PAD.top + ch - (val / maxVal) * ch;
      drawMarker(ctx, MARKER_SHAPES[si % MARKER_SHAPES.length], x, y, 5);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  });
}

export function getTooltipForPosition(
  mx: number,
  my: number,
  width: number,
  height: number,
  data: ChartDataset,
  isBarChart: boolean,
): ChartTooltip | null {
  const cw = width - PAD.left - PAD.right;
  const relX = mx - PAD.left;

  if (
    relX < 0 ||
    relX > cw ||
    my < PAD.top ||
    my > height - PAD.bottom
  ) {
    return null;
  }

  const nLabels = data.labels.length;
  const step = isBarChart ? cw / nLabels : cw / (nLabels - 1);
  const idx = isBarChart
    ? Math.min(Math.floor(relX / step), nLabels - 1)
    : Math.min(Math.round(relX / step), nLabels - 1);

  return {
    x: mx,
    y: my,
    label: data.labels[idx],
    items: data.series.map((s) => ({ name: s.name, value: s.values[idx] })),
  };
}
