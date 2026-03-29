import { useEffect, useState, type FC } from 'react';
import { Btn } from '@go-go-golems/os-core';
import { RICH_PARTS as P } from '../parts';
import { fmtTime, type YtVideo } from './types';

export const VideoPlayer: FC<{
  video: YtVideo;
  playing: boolean;
  onToggle: () => void;
  elapsed: number;
  totalSec: number;
  onSeek: (seconds: number) => void;
}> = ({ video, playing, onToggle, elapsed, totalSec, onSeek }) => {
  const progress = totalSec > 0 ? Math.min(100, (elapsed / totalSec) * 100) : 0;
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const intervalId = setInterval(() => setScanY((value) => (value + 2) % 100), 50);
    return () => clearInterval(intervalId);
  }, [playing]);

  return (
    <div data-part={P.ytPlayerWrap}>
      <div data-part={P.ytScreen}>
        <div data-part={P.ytScanlines} />
        {playing && <div data-part={P.ytMovingScan} style={{ top: `${scanY}%` }} />}
        <div data-part={P.ytVignette} />
        <div
          data-part={P.ytScreenContent}
          style={{ filter: playing ? 'none' : 'grayscale(0.5)' }}
        >
          {video.thumb}
        </div>
        {!playing && <div data-part={P.ytPausedLabel}>⏸ PAUSED</div>}
        {!playing && (
          <div data-part={P.ytPlayOverlay} onClick={onToggle}>
            <div data-part={P.ytPlayBtn}>▶</div>
          </div>
        )}
      </div>
      <div data-part={P.ytTransport}>
        <Btn onClick={onToggle}>{playing ? '⏸' : '▶'}</Btn>
        <Btn>⏮</Btn>
        <Btn>⏭</Btn>
        <span data-part={P.ytTimeLabel}>{fmtTime(elapsed)}</span>
        <div
          data-part={P.ytProgressBar}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            onSeek(Math.floor(((event.clientX - rect.left) / rect.width) * totalSec));
          }}
        >
          <div
            data-part={P.ytBufferBar}
            style={{ width: `${Math.min(100, progress + 15)}%` }}
          />
          <div data-part={P.ytProgressFill} style={{ width: `${progress}%` }} />
        </div>
        <span data-part={P.ytTimeLabel}>{video.time}</span>
        <Btn>🔈</Btn>
      </div>
    </div>
  );
};
