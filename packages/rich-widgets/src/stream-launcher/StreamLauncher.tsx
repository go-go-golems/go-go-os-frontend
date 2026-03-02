import { useState, useRef, useEffect, type FC } from 'react';
import { Btn, RadioButton } from '@hypercard/engine';
import { RICH_PARTS as P } from '../parts';
import { EmptyState } from '../primitives/EmptyState';
import { SearchBar } from '../primitives/SearchBar';
import { Separator } from '../primitives/Separator';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import type { Stream, StreamSort } from './types';
import { CATEGORIES, SORT_OPTIONS } from './types';
import { STREAMS, CHAT_MESSAGES } from './sampleData';
import { drawStreamThumb } from './streamArt';

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const StreamThumb: FC<{
  stream: Stream;
  isPlaying: boolean;
  size?: 'normal' | 'large';
  onClick?: () => void;
}> = ({ stream, isPlaying, size = 'normal', onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const w = size === 'large' ? 280 : 130;
  const h = size === 'large' ? 180 : 80;

  useEffect(() => {
    if (canvasRef.current) drawStreamThumb(canvasRef.current, stream.thumb, w, h, isPlaying);
  }, [stream.thumb, isPlaying, w, h]);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      data-part={P.slCanvas}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    />
  );
};

const StreamCard: FC<{
  stream: Stream;
  isActive: boolean;
  onSelect: (id: string) => void;
}> = ({ stream, isActive, onSelect }) => {
  const isLive = stream.status === 'live';
  const isVod = stream.status === 'vod';

  return (
    <div
      data-part={P.slStreamCard}
      data-active={isActive || undefined}
      onClick={() => onSelect(stream.id)}
    >
      <StreamThumb
        stream={stream}
        isPlaying={isActive}
        onClick={() => onSelect(stream.id)}
      />
      <div data-part={P.slCardInfo}>
        <div data-part={P.slCardBadges}>
          {isLive && <span data-part={P.slBadgeLive}>{'\u25CF'} LIVE</span>}
          {isVod && <span data-part={P.slBadgeVod}>{'\uD83D\uDCFC'} VOD</span>}
          {stream.status === 'offline' && (
            <span data-part={P.slBadgeOffline}>{'\u25CB'} OFFLINE</span>
          )}
        </div>
        <div data-part={P.slCardTitle}>{stream.title}</div>
        <div data-part={P.slCardHost}>{stream.host}</div>
        <div data-part={P.slCardDesc}>{stream.desc}</div>
        <div data-part={P.slCardMeta}>
          <span>{'\uD83D\uDC41\uFE0F'} {stream.viewers.toLocaleString()}</span>
          <span>{'\u23F1\uFE0F'} {stream.duration}</span>
        </div>
      </div>
    </div>
  );
};

const PlayerView: FC<{
  stream: Stream;
  onClose: () => void;
}> = ({ stream, onClose }) => {
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0.34);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setProgress(p => (p >= 1 ? 0 : p + 0.002)), 200);
    return () => clearInterval(iv);
  }, [playing]);

  const handleVolClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setVolume(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setProgress(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };

  return (
    <div data-part={P.slPlayer}>
      {/* Video area */}
      <div data-part={P.slPlayerMain}>
        <div data-part={P.slVideoArea}>
          <div data-part={P.slVideoFrame}>
            <StreamThumb
              stream={stream}
              isPlaying={playing}
              size="large"
              onClick={() => setPlaying(!playing)}
            />
            <div data-part={P.slVideoOverlay}>
              {stream.status === 'live' && (
                <span data-part={P.slOverlayLive}>{'\u25CF'} LIVE</span>
              )}
              <span>{'\uD83D\uDC41\uFE0F'} {stream.viewers.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div data-part={P.slControls}>
          <div data-part={P.slProgressArea}>
            <span data-part={P.slProgressPct}>{Math.floor(progress * 100)}%</span>
            <div data-part={P.slProgressBar} onClick={handleSeek}>
              <div
                data-part={P.slProgressFill}
                style={{ width: `${progress * 100}%` }}
              />
              <div
                data-part={P.slProgressThumb}
                style={{ left: `calc(${progress * 100}% - 4px)` }}
              />
            </div>
            <span data-part={P.slDuration}>{stream.duration}</span>
          </div>
          <div data-part={P.slTransport}>
            <Btn onClick={() => setProgress(Math.max(0, progress - 0.05))}>{'\u23EE'}</Btn>
            <Btn onClick={() => setPlaying(!playing)}>
              {playing ? '\u23F8' : '\u25B6'}
            </Btn>
            <Btn onClick={() => setProgress(Math.min(1, progress + 0.05))}>{'\u23ED'}</Btn>
            <Separator />
            <div data-part={P.slVolume}>
              <span data-part={P.slVolIcon}>{'\uD83D\uDD08'}</span>
              <div data-part={P.slVolBar} onClick={handleVolClick}>
                <div
                  data-part={P.slVolFill}
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
              <span data-part={P.slVolIcon}>{'\uD83D\uDD0A'}</span>
            </div>
            <div style={{ flex: 1 }} />
            <Btn
              onClick={() => setShowChat(!showChat)}
              data-active={showChat || undefined}
            >
              {'\uD83D\uDCAC'} Chat
            </Btn>
            <Btn onClick={onClose}>{'\u2715'} Close</Btn>
          </div>
        </div>

        {/* Stream info */}
        <div data-part={P.slStreamInfo}>
          <div data-part={P.slStreamInfoRow}>
            <div data-part={P.slHostAvatar}>{'\uD83D\uDC64'}</div>
            <div data-part={P.slStreamInfoText}>
              <div data-part={P.slStreamInfoTitle}>{stream.title}</div>
              <div data-part={P.slStreamInfoSub}>
                {stream.host} {'\u00B7'} {stream.cat}
              </div>
            </div>
            <Btn>{'\u2B50'} Follow</Btn>
          </div>
          <div data-part={P.slStreamInfoDesc}>{stream.desc}</div>
        </div>
      </div>

      {/* Chat panel */}
      {showChat && (
        <div data-part={P.slChat}>
          <div data-part={P.slChatHeader}>{'\uD83D\uDCAC'} Live Chat</div>
          <div data-part={P.slChatMessages}>
            {CHAT_MESSAGES.map((m, i) => (
              <div key={i} data-part={P.slChatMsg}>
                <span data-part={P.slChatUser}>{m.user}:</span>{' '}
                <span data-part={P.slChatText}>{m.msg}</span>
              </div>
            ))}
          </div>
          <div data-part={P.slChatInputRow}>
            <input
              data-part={P.slChatInput}
              placeholder="Say something\u2026"
              onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
            />
            <Btn>Send</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export interface StreamLauncherProps {
  /** Initial streams to display. Defaults to STREAMS sample data. */
  streams?: Stream[];
  /** Initial category filter. */
  initialCategory?: string;
  /** Height constraint. */
  height?: number | string;
}

export const StreamLauncher: FC<StreamLauncherProps> = ({
  streams = STREAMS,
  initialCategory = 'All',
  height,
}) => {
  const [category, setCategory] = useState(initialCategory);
  const [activeStream, setActiveStream] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<StreamSort>('viewers');

  const filtered = streams
    .filter(s => category === 'All' || s.cat === category)
    .filter(
      s =>
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.host.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sortBy === 'viewers' ? b.viewers - a.viewers : a.title.localeCompare(b.title),
    );

  const liveCount = streams.filter(s => s.status === 'live').length;
  const totalViewers = streams.reduce((sum, s) => sum + s.viewers, 0);
  const playing = activeStream ? streams.find(s => s.id === activeStream) ?? null : null;

  return (
    <div data-part={P.streamLauncher} style={height ? { height } : undefined}>
      {/* Sidebar */}
      <div data-part={P.slSidebar}>
        <div data-part={P.slSidebarTitle}>{'\uD83D\uDCFA'} Channels</div>
        <div data-part={P.slCategoryList}>
          {CATEGORIES.map(cat => (
            <div
              key={cat}
              data-part={P.slCategoryItem}
              data-selected={category === cat || undefined}
              onClick={() => {
                setCategory(cat);
                setActiveStream(null);
              }}
            >
              {cat}
            </div>
          ))}
        </div>

        <div data-part={P.slSortSection}>
          <div data-part={P.slSortTitle}>Sort by</div>
          {SORT_OPTIONS.map(opt => (
            <RadioButton
              key={opt.value}
              label={opt.label}
              selected={sortBy === opt.value}
              onChange={() => setSortBy(opt.value)}
            />
          ))}
        </div>

        <div data-part={P.slSidebarStats}>
          {'\uD83D\uDCCA'} {streams.length} streams<br />
          {'\uD83D\uDCE1'} {liveCount} live now<br />
          {'\uD83D\uDCFC'} {streams.filter(s => s.status === 'vod').length} archived
        </div>
      </div>

      {/* Main area */}
      <div data-part={P.slMain}>
        {playing ? (
          <PlayerView stream={playing} onClose={() => setActiveStream(null)} />
        ) : (
          <>
            {/* Search bar */}
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search streams…"
              count={filtered.length}
            />

            {/* Stream list */}
            <div data-part={P.slStreamList}>
              {filtered.length === 0 ? (
                <EmptyState icon={'\uD83D\uDCFA'} message="No streams found" />
              ) : (
                filtered.map(s => (
                  <StreamCard
                    key={s.id}
                    stream={s}
                    isActive={activeStream === s.id}
                    onSelect={setActiveStream}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Status bar */}
      <WidgetStatusBar>
        <span>
          {playing
            ? `\u25B6 Now playing: ${playing.title}`
            : 'Select a stream to watch'}
        </span>
        <span>
          {'\uD83D\uDCFA'} Stream Launcher v1.0 {'\u2502'} {category}
        </span>
      </WidgetStatusBar>
    </div>
  );
};
