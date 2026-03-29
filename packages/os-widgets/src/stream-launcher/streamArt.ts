import type { ThumbType } from './types';

const MONO = '"Chicago", "Geneva", "Charcoal", monospace';

/** Draw a dithered monochrome thumbnail for a stream type. */
export function drawStreamThumb(
  canvas: HTMLCanvasElement,
  type: ThumbType,
  w: number,
  h: number,
  isPlaying: boolean,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);

  // Scanline overlay
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);

  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#000';
  ctx.lineWidth = 1;

  const cx = w / 2;
  const cy = h / 2;

  switch (type) {
    case 'hypercard': {
      for (let i = 2; i >= 0; i--) {
        ctx.fillStyle = i === 0 ? '#eee' : '#fff';
        ctx.fillRect(10 + i * 4, 8 + i * 3, w - 28, h - 22);
        ctx.strokeRect(10 + i * 4, 8 + i * 3, w - 28, h - 22);
      }
      ctx.fillStyle = '#000';
      ctx.font = `bold 9px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText('Home', cx + 4, cy + 2);
      ctx.font = `7px ${MONO}`;
      ctx.fillText('\u25A3 \u25A3 \u25A3 \u25A3', cx + 4, cy + 14);
      break;
    }
    case 'resedit': {
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.fillStyle = '#000';
      ctx.fillRect(8, 8, w - 16, 14);
      ctx.fillStyle = '#fff';
      ctx.font = `8px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText('ICON id=128', cx, 18);
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          ctx.fillStyle = (x + y) % 2 ? '#000' : '#fff';
          ctx.fillRect(cx - 16 + x * 8, 28 + y * 8, 8, 8);
        }
      break;
    }
    case 'marathon': {
      ctx.fillStyle = '#ddd';
      ctx.fillRect(0, 0, w, h / 2);
      ctx.fillStyle = '#bbb';
      ctx.fillRect(0, h / 2, w, h / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cx - 20, cy - 10);
      ctx.moveTo(w, 0);
      ctx.lineTo(cx + 20, cy - 10);
      ctx.moveTo(0, h);
      ctx.lineTo(cx - 20, cy + 10);
      ctx.moveTo(w, h);
      ctx.lineTo(cx + 20, cy + 10);
      ctx.stroke();
      ctx.strokeRect(cx - 20, cy - 10, 40, 20);
      ctx.fillStyle = '#000';
      ctx.font = '7px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('HP:100', w - 4, h - 4);
      break;
    }
    case 'darkcastle': {
      ctx.fillStyle = '#ccc';
      ctx.fillRect(cx - 25, 15, 50, h - 15);
      for (let i = 0; i < 5; i++) ctx.fillRect(cx - 30 + i * 14, 10, 10, 12);
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 8, h - 25, 16, 25);
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - 3, cy + 5, 3, 5);
      ctx.fillRect(cx + 1, cy + 5, 3, 5);
      break;
    }
    case 'lofi': {
      ctx.strokeRect(cx - 18, 10, 36, 28);
      ctx.fillStyle = '#eee';
      ctx.fillRect(cx - 16, 12, 32, 24);
      ctx.fillStyle = '#000';
      ctx.font = '6px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u263A', cx, 28);
      ctx.strokeRect(cx - 8, 40, 16, 4);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx - 22, 20, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 22, 20, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, 8, 22, Math.PI, 0);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.font = `7px ${MONO}`;
      ctx.fillText('\u266A \u266B \u266A', cx, h - 6);
      break;
    }
    case 'midi': {
      ctx.fillStyle = '#ddd';
      ctx.fillRect(10, cy - 8, w - 20, 20);
      ctx.strokeRect(10, cy - 8, w - 20, 20);
      const keyW = (w - 24) / 10;
      for (let i = 0; i < 10; i++) ctx.strokeRect(12 + i * keyW, cy - 8, keyW, 20);
      for (let i = 0; i < 7; i++) {
        if (i !== 2 && i !== 6) {
          ctx.fillStyle = '#000';
          ctx.fillRect(20 + i * keyW, cy - 8, 6, 12);
        }
      }
      ctx.font = `8px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText('MIDI Ch.1', cx, 14);
      break;
    }
    case 'macpaint': {
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = '#000';
      for (let py = 0; py < 4; py++)
        for (let px = 0; px < 2; px++) ctx.strokeRect(8 + px * 10, 12 + py * 10, 9, 9);
      ctx.beginPath();
      ctx.moveTo(35, 20);
      ctx.quadraticCurveTo(cx + 10, 15, w - 20, cy);
      ctx.quadraticCurveTo(cx, h - 12, 35, cy + 10);
      ctx.stroke();
      break;
    }
    case 'pagemaker': {
      ctx.fillStyle = '#eee';
      ctx.fillRect(cx - 22, 6, 44, h - 12);
      ctx.strokeRect(cx - 22, 6, 44, h - 12);
      for (let py = 0; py < 5; py++) {
        ctx.fillStyle = '#bbb';
        ctx.fillRect(cx - 18, 12 + py * 10, 36, 6);
      }
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 18, 12, 16, 16);
      break;
    }
    case 'lan': {
      const positions: [number, number][] = [
        [cx, 15],
        [15, cy],
        [w - 15, cy],
        [cx, h - 15],
        [cx - 25, cy],
        [cx + 25, cy],
      ];
      positions.forEach(([px, py]) => {
        ctx.strokeRect(px - 8, py - 6, 16, 12);
        ctx.fillStyle = '#eee';
        ctx.fillRect(px - 7, py - 5, 14, 10);
      });
      ctx.setLineDash([2, 2]);
      for (let i = 1; i < positions.length; i++) {
        ctx.beginPath();
        ctx.moveTo(positions[0][0], positions[0][1]);
        ctx.lineTo(positions[i][0], positions[i][1]);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      break;
    }
    case 'keynote': {
      ctx.fillStyle = '#ddd';
      ctx.fillRect(0, h - 20, w, 20);
      ctx.beginPath();
      ctx.moveTo(10, h - 20);
      ctx.lineTo(cx, 10);
      ctx.lineTo(w - 10, h - 20);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = '#eee';
      ctx.fillRect(cx - 20, 14, 40, 28);
      ctx.strokeRect(cx - 20, 14, 40, 28);
      ctx.fillStyle = '#000';
      ctx.font = '6px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\uD83C\uDF4E', cx, 32);
      break;
    }
    case 'insdemac': {
      ctx.fillStyle = '#ddd';
      ctx.fillRect(cx - 18, 8, 36, h - 16);
      ctx.strokeRect(cx - 18, 8, 36, h - 16);
      ctx.fillStyle = '#000';
      ctx.fillRect(cx - 16, 8, 2, h - 16);
      ctx.font = `6px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText('Inside', cx + 2, 22);
      ctx.fillText('Mac', cx + 2, 30);
      ctx.fillText('Vol.I', cx + 2, 38);
      break;
    }
    case 'photoshop': {
      ctx.fillStyle = '#ccc';
      ctx.fillRect(15, 12, w - 35, h - 24);
      ctx.strokeRect(15, 12, w - 35, h - 24);
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(25, 18, 30, 25);
      ctx.setLineDash([]);
      ctx.fillStyle = '#000';
      for (let i = 0; i < 5; i++) ctx.fillRect(w - 16, 14 + i * 10, 10, 8);
      break;
    }
    default: {
      ctx.fillStyle = '#000';
      ctx.font = `10px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.fillText('\uD83D\uDCFA', cx, cy + 4);
    }
  }

  // Play button overlay when not playing
  if (!isPlaying) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 10);
    ctx.lineTo(cx - 8, cy + 10);
    ctx.lineTo(cx + 10, cy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
