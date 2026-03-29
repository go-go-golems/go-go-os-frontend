import type { ArtType } from './types';

/** Draw retro pixel art for a game onto a canvas. */
export function drawGameArt(
  canvas: HTMLCanvasElement,
  type: ArtType,
  w: number,
  h: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = w;
  canvas.height = h;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const MONO = '"Chicago","Geneva","Charcoal",monospace';

  switch (type) {
    case 'castle': {
      ctx.fillStyle = '#ddd';
      ctx.fillRect(cx - 35, 20, 70, h - 20);
      ctx.fillRect(cx - 55, 30, 20, h - 30);
      ctx.fillRect(cx + 35, 30, 20, h - 30);
      for (let i = 0; i < 9; i++) ctx.fillRect(cx - 55 + i * 14, 16, 8, 12);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 35, 20, 70, h - 20);
      ctx.strokeRect(cx - 55, 30, 20, h - 30);
      ctx.strokeRect(cx + 35, 30, 20, h - 30);
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 10, h - 35, 20, 35);
      ctx.fillStyle = '#555';
      (
        [
          [-20, 40],
          [15, 40],
          [-20, 60],
          [15, 60],
          [-42, 50],
          [42, 50],
        ] as [number, number][]
      ).forEach(([ox, oy]) => ctx.fillRect(cx + ox, oy, 8, 10));
      break;
    }
    case 'tank': {
      ctx.fillStyle = '#ddd';
      ctx.fillRect(0, h * 0.6, w, h * 0.4);
      ctx.strokeStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.6);
      ctx.lineTo(w, h * 0.6);
      ctx.stroke();
      ctx.fillStyle = '#999';
      ctx.fillRect(cx - 20, h * 0.55, 40, 16);
      ctx.fillStyle = '#888';
      ctx.fillRect(cx - 24, h * 0.62, 48, 12);
      ctx.strokeRect(cx - 24, h * 0.62, 48, 12);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(cx - 10, h * 0.48, 20, 12);
      ctx.fillStyle = '#777';
      ctx.fillRect(cx + 10, h * 0.5, 25, 4);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 20, h * 0.55, 40, 16);
      ctx.fillStyle = '#bbb';
      ctx.fillRect(15, h * 0.52, 14, 10);
      ctx.strokeRect(15, h * 0.52, 14, 10);
      ctx.fillRect(w - 30, h * 0.52, 14, 10);
      ctx.strokeRect(w - 30, h * 0.52, 14, 10);
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = '#666';
      ctx.beginPath();
      ctx.moveTo(22, h * 0.48);
      ctx.lineTo(cx, 15);
      ctx.lineTo(w - 22, h * 0.48);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#000';
      ctx.font = `8px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText('AppleTalk', cx, 12);
      break;
    }
    case 'glider': {
      ctx.fillStyle = '#eee';
      ctx.fillRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#ccc';
      ctx.fillRect(10, h - 30, 30, 26);
      ctx.strokeRect(10, h - 30, 30, 26);
      ctx.fillStyle = '#bbb';
      ctx.fillRect(w - 45, h - 40, 35, 36);
      ctx.strokeRect(w - 45, h - 40, 35, 36);
      ctx.fillRect(w - 43, h - 36, 31, 2);
      ctx.fillRect(w - 43, h - 22, 31, 2);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(cx - 8, h - 6, 16, 4);
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = '#999';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 6, h - 8);
        ctx.lineTo(cx + i * 6, h - 35);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 10);
      ctx.lineTo(cx + 20, cy);
      ctx.lineTo(cx - 5, cy + 4);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'crystal': {
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(cx, cy) - 12, 0, Math.PI * 2);
      ctx.fillStyle = '#f0f0f0';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      const crystalPos: [number, number][] = [
        [cx, cy - 15],
        [cx - 20, cy + 10],
        [cx + 20, cy + 10],
        [cx - 10, cy - 5],
        [cx + 12, cy - 8],
      ];
      crystalPos.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + 5, y);
        ctx.lineTo(x, y + 6);
        ctx.lineTo(x - 5, y);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      ctx.fillStyle = '#000';
      (
        [
          [cx - 30, cy - 20],
          [cx + 28, cy - 22],
          [cx - 25, cy + 20],
          [cx + 30, cy + 18],
          [cx, cy + 25],
        ] as [number, number][]
      ).forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    case 'puck': {
      ctx.fillStyle = '#ddd';
      ctx.fillRect(10, 15, w - 20, h - 30);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 15, w - 20, h - 30);
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, 15);
      ctx.lineTo(cx, h - 15);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#000';
      ctx.fillRect(12, cy - 15, 4, 30);
      ctx.fillRect(w - 16, cy - 15, 4, 30);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(30, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w - 30, cy - 5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx + 10, cy + 5, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'prince': {
      ctx.fillStyle = '#ccc';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 0.5;
      for (let y2 = 0; y2 < h; y2 += 10)
        for (let x2 = 0; x2 < w; x2 += 20)
          ctx.strokeRect(x2 + (y2 % 20 ? 10 : 0), y2, 20, 10);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(0, h * 0.65, w, 6);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.65);
      ctx.lineTo(w, h * 0.65);
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 2, h * 0.45, 4, 14);
      ctx.fillRect(cx - 5, h * 0.48, 10, 2);
      ctx.fillRect(cx - 3, h * 0.59, 3, 6);
      ctx.fillRect(cx, h * 0.59, 3, 6);
      ctx.beginPath();
      ctx.arc(cx, h * 0.43, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx + 5, h * 0.46, 12, 1.5);
      ctx.fillRect(cx + 4, h * 0.44, 2, 5);
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(15 + i * 12, h * 0.65);
        ctx.lineTo(21 + i * 12, h * 0.75);
        ctx.lineTo(27 + i * 12, h * 0.65);
        ctx.stroke();
      }
      ctx.fillStyle = '#000';
      ctx.font = '7px Monaco, monospace';
      ctx.textAlign = 'right';
      ctx.fillText('TIME: 47:23', w - 4, 10);
      break;
    }
    case 'loderunner': {
      ctx.strokeStyle = '#bbb';
      ctx.lineWidth = 0.5;
      for (let y2 = 0; y2 < h; y2 += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y2);
        ctx.lineTo(w, y2);
        ctx.stroke();
      }
      ctx.fillStyle = '#999';
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000';
      (
        [
          [5, 30, w - 10],
          [20, 50, 50],
          [w - 70, 50, 50],
          [30, 70, w - 60],
        ] as [number, number, number][]
      ).forEach(([x, y, ww]) => {
        ctx.fillRect(x, y, ww, 4);
        ctx.strokeRect(x, y, ww, 4);
      });
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      (
        [
          [40, 30, 20],
          [w - 45, 50, 20],
        ] as [number, number, number][]
      ).forEach(([x, y, hh]) => {
        ctx.strokeRect(x, y, 8, hh);
        for (let r = y + 4; r < y + hh; r += 4) {
          ctx.beginPath();
          ctx.moveTo(x, r);
          ctx.lineTo(x + 8, r);
          ctx.stroke();
        }
      });
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 3, 23, 6, 7);
      ctx.beginPath();
      ctx.arc(cx, 21, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '8px serif';
      ctx.fillText('$', 30, 48);
      ctx.fillText('$', 60, 48);
      ctx.fillText('$', w - 55, 48);
      ctx.fillStyle = '#555';
      ctx.fillRect(w - 35, 43, 6, 7);
      break;
    }
    case 'simcity': {
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 0.5;
      for (let x2 = 0; x2 < w; x2 += 12) {
        ctx.beginPath();
        ctx.moveTo(x2, 0);
        ctx.lineTo(x2, h);
        ctx.stroke();
      }
      for (let y2 = 0; y2 < h; y2 += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y2);
        ctx.lineTo(w, y2);
        ctx.stroke();
      }
      ctx.fillStyle = '#aaa';
      ctx.fillRect(0, cy - 3, w, 6);
      ctx.fillRect(cx - 3, 0, 6, h);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, cy - 3, w, 6);
      ctx.strokeRect(cx - 3, 0, 6, h);
      ctx.fillStyle = '#ddd';
      (
        [
          [8, 8, 20, 24],
          [32, 8, 16, 16],
          [8, 38, 24, 16],
          [cx + 8, 8, 28, 20],
          [cx + 8, 34, 16, 20],
        ] as [number, number, number, number][]
      ).forEach(([x, y, ww, hh]) => {
        ctx.fillRect(x, y, ww, hh);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, ww, hh);
      });
      ctx.fillStyle = '#bbb';
      (
        [
          [cx + 8, cy + 6, 24, 18],
          [8, cy + 6, 18, 24],
        ] as [number, number, number, number][]
      ).forEach(([x, y, ww, hh]) => {
        ctx.fillRect(x, y, ww, hh);
        ctx.strokeRect(x, y, ww, hh);
      });
      ctx.fillRect(cx + 14, cy, 4, 8);
      ctx.fillStyle = '#888';
      ctx.fillRect(w - 35, h - 30, 28, 24);
      ctx.strokeRect(w - 35, h - 30, 28, 24);
      ctx.fillStyle = '#000';
      ctx.font = '7px Monaco, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('POP: 51,203', 4, h - 4);
      break;
    }
  }
}
