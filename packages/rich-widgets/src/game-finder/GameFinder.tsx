import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Btn, RadioButton } from '@hypercard/engine';
import { RICH_PARTS as P } from '../parts';
import { EmptyState } from '../primitives/EmptyState';
import { ModalOverlay } from '../primitives/ModalOverlay';
import { ProgressBar } from '../primitives/ProgressBar';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { drawGameArt } from './gameArt';
import {
  type Game,
  type ArtType,
  type GameFilter,
  type GameSort,
  FILTER_OPTIONS,
  SORT_OPTIONS,
} from './types';
import { SAMPLE_GAMES } from './sampleData';

/* ── Sub-components ── */

function GameArt({
  type,
  width,
  height,
  onClick,
  className,
}: {
  type: ArtType;
  width: number;
  height: number;
  onClick?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawGameArt(ref.current, type, width, height);
  }, [type, width, height]);
  return (
    <canvas
      ref={ref}
      data-part={P.gfCanvas}
      className={className}
      style={{
        display: 'block',
        cursor: onClick ? 'pointer' : 'default',
        imageRendering: 'pixelated',
      }}
      onClick={onClick}
    />
  );
}

function StarRating({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <span style={{ fontSize: size, letterSpacing: 1 }}>
      {'\u2605'.repeat(rating)}
      {'\u2606'.repeat(5 - rating)}
    </span>
  );
}

function DownloadBar({
  game,
  onComplete,
}: {
  game: Game;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearInterval(iv);
          onCompleteRef.current();
          return 1;
        }
        return p + 0.02 + Math.random() * 0.03;
      });
    }, 150);
    return () => clearInterval(iv);
  }, []);

  const pct = Math.min(100, Math.round(progress * 100));
  return (
    <div data-part={P.gfDownloadBar}>
      <div data-part={P.gfDownloadStatus}>
        <span>{'Installing '}{game.title}{'\u2026'}</span>
        <span>{pct}%</span>
      </div>
      <ProgressBar value={pct} max={100} />
      <div data-part={P.gfDownloadMeta}>
        {game.size} total {'\u00B7'}{' '}
        {Math.round(progress * parseFloat(game.size) * 10) / 10}K downloaded
        {' \u00B7 '}ETA {Math.max(1, Math.round((1 - progress) * 8))}s
      </div>
    </div>
  );
}

function GameDetail({
  game,
  onBack,
  onInstall,
  onLaunch,
  installing,
}: {
  game: Game;
  onBack: () => void;
  onInstall: () => void;
  onLaunch: () => void;
  installing: boolean;
}) {
  const doneCount = game.achievements.filter((a) => a.done).length;
  const totalCount = game.achievements.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div data-part={P.gfDetail}>
      {/* Hero */}
      <div data-part={P.gfDetailHero}>
        <GameArt type={game.art} width={140} height={100} />
        <div data-part={P.gfDetailInfo}>
          <div data-part={P.gfDetailTitle}>{game.title}</div>
          <div data-part={P.gfDetailSub}>
            {game.dev} {'\u00B7'} {game.year}
          </div>
          <div data-part={P.gfDetailMeta}>
            <StarRating rating={game.rating} />
            <span data-part={P.gfGenreBadge}>{game.genre}</span>
            <span data-part={P.gfSizeBadge}>{game.size}</span>
          </div>
          <div data-part={P.gfDetailActions}>
            {game.installed ? (
              <Btn data-state="active" onClick={onLaunch}>
                {'\u25B6'} Play
              </Btn>
            ) : (
              <Btn onClick={onInstall} disabled={installing}>
                {installing ? 'Installing\u2026' : 'Install'}
              </Btn>
            )}
            <Btn onClick={onBack}>{'\u2190'} Back</Btn>
          </div>
        </div>
      </div>

      {installing && (
        <DownloadBar game={game} onComplete={() => {}} />
      )}

      {/* Description */}
      <div data-part={P.gfDescSection}>{game.desc}</div>

      {/* Stats */}
      <div data-part={P.gfStatsRow}>
        <div>
          <span data-part={P.gfStatsLabel}>Hours played:</span>{' '}
          <b>{game.hours}</b>
        </div>
        <div>
          <span data-part={P.gfStatsLabel}>Last played:</span>{' '}
          <b>{game.lastPlayed}</b>
        </div>
        <div>
          <span data-part={P.gfStatsLabel}>Size:</span> <b>{game.size}</b>
        </div>
        <div>
          <span data-part={P.gfStatsLabel}>Status:</span>{' '}
          <b>{game.installed ? 'Installed \u2713' : 'Not installed'}</b>
        </div>
      </div>

      {/* Achievements */}
      <div data-part={P.gfAchievementsSection}>
        <div data-part={P.gfAchievementsHeader}>
          Achievements ({doneCount}/{totalCount})
        </div>
        <div data-part={P.gfAchievementsBar}>
          <ProgressBar value={pct} max={100} />
          <span data-part={P.gfAchievementsPct}>{pct}%</span>
        </div>
        {game.achievements.map((a, i) => (
          <div
            key={i}
            data-part={P.gfAchievementRow}
            data-state={a.done ? 'done' : 'locked'}
          >
            <span data-part={P.gfAchievementIcon}>{a.icon}</span>
            <div data-part={P.gfAchievementInfo}>
              <div data-part={P.gfAchievementName}>{a.name}</div>
              <div data-part={P.gfAchievementDesc}>{a.desc}</div>
            </div>
            <span data-part={P.gfAchievementStatus}>
              {a.done ? '\u2713' : '\u25CB'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GameRow({
  game,
  isActive,
  onClick,
}: {
  game: Game;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      data-part={P.gfGameRow}
      data-state={isActive ? 'active' : undefined}
      onClick={onClick}
    >
      <span data-part={P.gfInstallDot}>
        {game.installed ? '\uD83D\uDFE2' : '\u26AA'}
      </span>
      <GameArt type={game.art} width={48} height={32} />
      <div data-part={P.gfGameRowInfo}>
        <div data-part={P.gfGameRowTitle}>{game.title}</div>
        <div data-part={P.gfGameRowSub}>
          {game.dev} {'\u00B7'} {game.year}
        </div>
      </div>
      <div data-part={P.gfGameRowRight}>
        <StarRating rating={game.rating} size={8} />
        <div data-part={P.gfGameRowHours}>{game.hours}h</div>
      </div>
    </div>
  );
}

/* ── Main ── */

export interface GameFinderProps {
  initialGames?: Game[];
}

export function GameFinder({ initialGames = SAMPLE_GAMES }: GameFinderProps) {
  const [view, setView] = useState<'library' | 'detail'>('library');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [games, setGames] = useState(initialGames);
  const [installing, setInstalling] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<GameFilter>('all');
  const [sortBy, setSortBy] = useState<GameSort>('recent');
  const [launchedGame, setLaunchedGame] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...games];
    if (filter === 'installed') list = list.filter((g) => g.installed);
    if (filter === 'notinstalled') list = list.filter((g) => !g.installed);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.dev.toLowerCase().includes(q) ||
          g.genre.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'hours') return b.hours - a.hours;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });
    return list;
  }, [games, filter, search, sortBy]);

  const totalHours = games.reduce((s, g) => s + g.hours, 0);
  const installedCount = games.filter((g) => g.installed).length;
  const totalAchievements = games.reduce(
    (s, g) => s + g.achievements.filter((a) => a.done).length,
    0,
  );
  const totalPossible = games.reduce(
    (s, g) => s + g.achievements.length,
    0,
  );

  const handleInstall = useCallback((gameId: string) => {
    setInstalling(gameId);
    setTimeout(() => {
      setGames((prev) =>
        prev.map((g) =>
          g.id === gameId ? { ...g, installed: true } : g,
        ),
      );
      setInstalling(null);
    }, 5000);
  }, []);

  const handleLaunch = useCallback((gameId: string) => {
    setLaunchedGame(gameId);
    setTimeout(() => setLaunchedGame(null), 3000);
  }, []);

  const detail = selectedGame
    ? games.find((g) => g.id === selectedGame) ?? null
    : null;

  return (
    <div data-part={P.gameFinder}>
      {/* Launch overlay */}
      {launchedGame && (
        <ModalOverlay onClose={() => setLaunchedGame(null)}>
          <div data-part={P.gfLaunchCard}>
            <GameArt
              type={
                games.find((g) => g.id === launchedGame)?.art ?? 'castle'
              }
              width={160}
              height={110}
            />
            <div data-part={P.gfLaunchTitle}>
              Launching{' '}
              {games.find((g) => g.id === launchedGame)?.title}{'\u2026'}
            </div>
            <div data-part={P.gfLaunchSub}>
              Preparing Macintosh environment
            </div>
            <div data-part={P.gfLaunchProgress}>
              <div data-part={P.gfLaunchProgressFill} />
            </div>
          </div>
        </ModalOverlay>
      )}

      <div data-part={P.gfBody}>
        {/* Sidebar */}
        <div data-part={P.gfSidebar}>
          <div data-part={P.gfNavSection}>
            {[
              { label: 'Library', key: 'library' as const },
              { label: 'Store', key: 'store' as const },
              { label: 'Friends', key: null },
              { label: 'Achievements', key: null },
            ].map((item) => (
              <div
                key={item.label}
                data-part={P.gfNavItem}
                onClick={
                  item.key === 'library'
                    ? () => {
                        setView('library');
                        setSelectedGame(null);
                      }
                    : undefined
                }
              >
                {item.label}
              </div>
            ))}
          </div>

          <div data-part={P.gfSidebarSection}>
            <div data-part={P.gfSidebarTitle}>Filter</div>
            {FILTER_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                data-part={P.gfFilterItem}
                data-state={filter === opt.value ? 'active' : undefined}
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </div>
            ))}
          </div>

          <div data-part={P.gfSidebarSection}>
            <div data-part={P.gfSidebarTitle}>Sort</div>
            {SORT_OPTIONS.map((opt) => (
              <RadioButton
                key={opt.value}
                label={opt.label}
                selected={sortBy === opt.value}
                onChange={() => setSortBy(opt.value)}
              />
            ))}
          </div>

          <div data-part={P.gfProfileStats}>
            <b>Profile Stats</b>
            <div>Games: {games.length}</div>
            <div>Installed: {installedCount}</div>
            <div>Hours: {Math.round(totalHours)}</div>
            <div>
              Achievements: {totalAchievements}/{totalPossible}
            </div>
            <ProgressBar value={totalAchievements} max={totalPossible || 1} />
          </div>
        </div>

        {/* Main */}
        <div data-part={P.gfMain}>
          {/* Search */}
          <div data-part={P.gfSearchBar}>
            <input
              data-part={P.gfSearchInput}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setView('library');
                setSelectedGame(null);
              }}
              placeholder="Search games\u2026"
            />
            <span data-part={P.gfSearchCount}>
              {filtered.length} games
            </span>
          </div>

          {view === 'detail' && detail ? (
            <GameDetail
              game={detail}
              onBack={() => {
                setView('library');
                setSelectedGame(null);
              }}
              onInstall={() => handleInstall(detail.id)}
              onLaunch={() => handleLaunch(detail.id)}
              installing={installing === detail.id}
            />
          ) : (
            <div data-part={P.gfGameList}>
              {/* Column header */}
              <div data-part={P.gfListHeader}>
                <span style={{ width: 18 }}>{'\u25CF'}</span>
                <span style={{ width: 48 }}>Art</span>
                <span style={{ flex: 1 }}>Title / Developer</span>
                <span style={{ width: 60, textAlign: 'right' }}>
                  Rating / Time
                </span>
              </div>
              {filtered.map((g) => (
                <GameRow
                  key={g.id}
                  game={g}
                  isActive={selectedGame === g.id}
                  onClick={() => {
                    setSelectedGame(g.id);
                    setView('detail');
                  }}
                />
              ))}
              {filtered.length === 0 && (
                <EmptyState icon={'\uD83D\uDD79\uFE0F'} message="No games found" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <WidgetStatusBar>
        <span>
          {installing
            ? `Installing ${games.find((g) => g.id === installing)?.title}\u2026`
            : detail
              ? `${detail.title} \u2014 ${detail.hours}h played`
              : 'Ready'}
        </span>
        <span>
          {'GameFinder v1.0 \u2502 '}{installedCount}/{games.length}
          {' installed \u2502 '}{totalAchievements}/{totalPossible}{' achievements'}
        </span>
      </WidgetStatusBar>
    </div>
  );
}
