import {
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Btn, RadioButton } from '@go-go-golems/os-core';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { EmptyState } from '../primitives/EmptyState';
import { ModalOverlay } from '../primitives/ModalOverlay';
import { ProgressBar } from '../primitives/ProgressBar';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { drawGameArt } from './gameArt';
import {
  type Game,
  type ArtType,
  FILTER_OPTIONS,
  SORT_OPTIONS,
} from './types';
import { SAMPLE_GAMES } from './sampleData';
import {
  createGameFinderStateSeed,
  GAME_FINDER_STATE_KEY,
  gameFinderActions,
  gameFinderReducer,
  selectGameFinderState,
  type GameFinderAction,
  type GameFinderState,
} from './gameFinderState';

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

function DownloadBar({ game }: { game: Game }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress((value) => (value >= 1 ? 1 : value + 0.02 + Math.random() * 0.03));
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
        {game.size} total {'\u00B7'} {Math.round(progress * parseFloat(game.size) * 10) / 10}K downloaded
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
  const doneCount = game.achievements.filter((achievement) => achievement.done).length;
  const totalCount = game.achievements.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div data-part={P.gfDetail}>
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

      {installing && <DownloadBar game={game} />}

      <div data-part={P.gfDescSection}>{game.desc}</div>

      <div data-part={P.gfStatsRow}>
        <div><span data-part={P.gfStatsLabel}>Hours played:</span> <b>{game.hours}</b></div>
        <div><span data-part={P.gfStatsLabel}>Last played:</span> <b>{game.lastPlayed}</b></div>
        <div><span data-part={P.gfStatsLabel}>Size:</span> <b>{game.size}</b></div>
        <div><span data-part={P.gfStatsLabel}>Status:</span> <b>{game.installed ? 'Installed \u2713' : 'Not installed'}</b></div>
      </div>

      <div data-part={P.gfAchievementsSection}>
        <div data-part={P.gfAchievementsHeader}>
          Achievements ({doneCount}/{totalCount})
        </div>
        <div data-part={P.gfAchievementsBar}>
          <ProgressBar value={pct} max={100} />
          <span data-part={P.gfAchievementsPct}>{pct}%</span>
        </div>
        {game.achievements.map((achievement, index) => (
          <div
            key={index}
            data-part={P.gfAchievementRow}
            data-state={achievement.done ? 'done' : 'locked'}
          >
            <span data-part={P.gfAchievementIcon}>{achievement.icon}</span>
            <div data-part={P.gfAchievementInfo}>
              <div data-part={P.gfAchievementName}>{achievement.name}</div>
              <div data-part={P.gfAchievementDesc}>{achievement.desc}</div>
            </div>
            <span data-part={P.gfAchievementStatus}>{achievement.done ? '\u2713' : '\u25CB'}</span>
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
    <div data-part={P.gfGameRow} data-state={isActive ? 'active' : undefined} onClick={onClick}>
      <span data-part={P.gfInstallDot}>{game.installed ? '\uD83D\uDFE2' : '\u26AA'}</span>
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

export interface GameFinderProps {
  initialGames?: Game[];
}

function createInitialSeed(props: GameFinderProps): GameFinderState {
  return createGameFinderStateSeed({
    initialGames: props.initialGames ?? SAMPLE_GAMES,
  });
}

function GameFinderFrame({
  state,
  dispatch,
}: {
  state: GameFinderState;
  dispatch: (action: GameFinderAction) => void;
}) {
  const { view, selectedGameId, games, installingId, search, filter, sortBy, launchedGameId } = state;

  const filtered = useMemo(() => {
    const list = [...games];
    const filteredGames = list
      .filter((game) => (filter === 'installed' ? game.installed : filter === 'notinstalled' ? !game.installed : true))
      .filter((game) => {
        if (!search) return true;
        const query = search.toLowerCase();
        return (
          game.title.toLowerCase().includes(query) ||
          game.dev.toLowerCase().includes(query) ||
          game.genre.toLowerCase().includes(query)
        );
      });

    filteredGames.sort((left, right) => {
      if (sortBy === 'name') return left.title.localeCompare(right.title);
      if (sortBy === 'hours') return right.hours - left.hours;
      if (sortBy === 'rating') return right.rating - left.rating;
      return 0;
    });
    return filteredGames;
  }, [filter, games, search, sortBy]);

  const totalHours = games.reduce((sum, game) => sum + game.hours, 0);
  const installedCount = games.filter((game) => game.installed).length;
  const totalAchievements = games.reduce(
    (sum, game) => sum + game.achievements.filter((achievement) => achievement.done).length,
    0,
  );
  const totalPossible = games.reduce((sum, game) => sum + game.achievements.length, 0);
  const detail = selectedGameId ? games.find((game) => game.id === selectedGameId) ?? null : null;

  const handleInstall = (gameId: string) => {
    dispatch(gameFinderActions.setInstallingId(gameId));
    setTimeout(() => dispatch(gameFinderActions.markInstalled(gameId)), 5000);
  };

  const handleLaunch = (gameId: string) => {
    dispatch(gameFinderActions.setLaunchedGameId(gameId));
    setTimeout(() => dispatch(gameFinderActions.setLaunchedGameId(null)), 3000);
  };

  return (
    <div data-part={P.gameFinder}>
      {launchedGameId && (
        <ModalOverlay onClose={() => dispatch(gameFinderActions.setLaunchedGameId(null))}>
          <div data-part={P.gfLaunchCard}>
            <GameArt
              type={games.find((game) => game.id === launchedGameId)?.art ?? 'castle'}
              width={160}
              height={110}
            />
            <div data-part={P.gfLaunchTitle}>
              Launching {games.find((game) => game.id === launchedGameId)?.title}{'\u2026'}
            </div>
            <div data-part={P.gfLaunchSub}>Preparing Macintosh environment</div>
            <div data-part={P.gfLaunchProgress}>
              <div data-part={P.gfLaunchProgressFill} />
            </div>
          </div>
        </ModalOverlay>
      )}

      <div data-part={P.gfBody}>
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
                        dispatch(gameFinderActions.setView('library'));
                        dispatch(gameFinderActions.setSelectedGameId(null));
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
            {FILTER_OPTIONS.map((option) => (
              <div
                key={option.value}
                data-part={P.gfFilterItem}
                data-state={filter === option.value ? 'active' : undefined}
                onClick={() => dispatch(gameFinderActions.setFilter(option.value))}
              >
                {option.label}
              </div>
            ))}
          </div>

          <div data-part={P.gfSidebarSection}>
            <div data-part={P.gfSidebarTitle}>Sort</div>
            {SORT_OPTIONS.map((option) => (
              <RadioButton
                key={option.value}
                label={option.label}
                selected={sortBy === option.value}
                onChange={() => dispatch(gameFinderActions.setSortBy(option.value))}
              />
            ))}
          </div>

          <div data-part={P.gfProfileStats}>
            <b>Profile Stats</b>
            <div>Games: {games.length}</div>
            <div>Installed: {installedCount}</div>
            <div>Hours: {Math.round(totalHours)}</div>
            <div>Achievements: {totalAchievements}/{totalPossible}</div>
            <ProgressBar value={totalAchievements} max={totalPossible || 1} />
          </div>
        </div>

        <div data-part={P.gfMain}>
          <div data-part={P.gfSearchBar}>
            <input
              data-part={P.gfSearchInput}
              value={search}
              onChange={(event) => {
                dispatch(gameFinderActions.setSearch(event.target.value));
                dispatch(gameFinderActions.setView('library'));
                dispatch(gameFinderActions.setSelectedGameId(null));
              }}
              placeholder="Search games\u2026"
            />
            <span data-part={P.gfSearchCount}>{filtered.length} games</span>
          </div>

          {view === 'detail' && detail ? (
            <GameDetail
              game={detail}
              onBack={() => {
                dispatch(gameFinderActions.setView('library'));
                dispatch(gameFinderActions.setSelectedGameId(null));
              }}
              onInstall={() => handleInstall(detail.id)}
              onLaunch={() => handleLaunch(detail.id)}
              installing={installingId === detail.id}
            />
          ) : (
            <div data-part={P.gfGameList}>
              <div data-part={P.gfListHeader}>
                <span style={{ width: 18 }}>{'\u25CF'}</span>
                <span style={{ width: 48 }}>Art</span>
                <span style={{ flex: 1 }}>Title / Developer</span>
                <span style={{ width: 60, textAlign: 'right' }}>Rating / Time</span>
              </div>
              {filtered.map((game) => (
                <GameRow
                  key={game.id}
                  game={game}
                  isActive={selectedGameId === game.id}
                  onClick={() => {
                    dispatch(gameFinderActions.setSelectedGameId(game.id));
                    dispatch(gameFinderActions.setView('detail'));
                  }}
                />
              ))}
              {filtered.length === 0 && <EmptyState icon={'\uD83D\uDD79\uFE0F'} message="No games found" />}
            </div>
          )}
        </div>
      </div>

      <WidgetStatusBar>
        <span>
          {installingId
            ? `Installing ${games.find((game) => game.id === installingId)?.title}\u2026`
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

function StandaloneGameFinder(props: GameFinderProps) {
  const [state, dispatch] = useReducer(gameFinderReducer, createInitialSeed(props));
  return <GameFinderFrame state={state} dispatch={dispatch} />;
}

function ConnectedGameFinder(props: GameFinderProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectGameFinderState);

  useEffect(() => {
    reduxDispatch(gameFinderActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.initialGames, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return <GameFinderFrame state={effectiveState} dispatch={(action) => reduxDispatch(action)} />;
}

export function GameFinder(props: GameFinderProps) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    GAME_FINDER_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedGameFinder {...props} />;
  }

  return <StandaloneGameFinder {...props} />;
}
