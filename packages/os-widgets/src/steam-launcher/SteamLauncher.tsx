import { useContext, useEffect, useReducer, type FC } from 'react';
import { Btn } from '@go-go-golems/os-core';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { EmptyState } from '../primitives/EmptyState';
import { ModalOverlay } from '../primitives/ModalOverlay';
import { WidgetStatusBar } from '../primitives/WidgetStatusBar';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { FRIENDS, GAMES } from './sampleData';
import {
  createSteamLauncherStateSeed,
  selectSteamLauncherState,
  steamLauncherActions,
  steamLauncherReducer,
  STEAM_LAUNCHER_STATE_KEY,
  type SteamLauncherAction,
  type SteamLauncherState,
} from './steamLauncherState';
import { TABS } from './types';
import type {
  Friend,
  GameFilter,
  SteamGame,
  SteamLauncherProps,
  SteamTab,
} from './types';

const TabBar: FC<{
  tabs: typeof TABS;
  active: SteamTab;
  onChange: (id: SteamTab) => void;
}> = ({ tabs, active, onChange }) => (
  <div data-part={P.stTabBar}>
    {tabs.map((tab) => (
      <div
        key={tab.id}
        data-part={P.stTab}
        data-selected={active === tab.id || undefined}
        onClick={() => onChange(tab.id)}
      >
        {tab.icon} {tab.label}
      </div>
    ))}
  </div>
);

const GameRow: FC<{
  game: SteamGame;
  selected: boolean;
  onSelect: () => void;
}> = ({ game, selected, onSelect }) => (
  <div
    data-part={P.stGameRow}
    data-selected={selected || undefined}
    onClick={onSelect}
  >
    <span data-part={P.stGameIcon}>{game.icon}</span>
    <span data-part={P.stGameName}>{game.name}</span>
    <span data-part={P.stInstallDot}>{game.installed ? '●' : '○'}</span>
  </div>
);

const GameDetail: FC<{
  game: SteamGame;
  installing: boolean;
  onLaunch: () => void;
}> = ({ game, installing, onLaunch }) => {
  const infoRows: [string, string][] = [
    ['Status', game.installed ? '✅ Installed' : '⬜ Not Installed'],
    ['Size on Disk', game.size],
    ['Hours Played', `${game.hours} hrs`],
    ['Last Played', game.lastPlayed],
    ['Genre', game.genre],
  ];

  return (
    <div data-part={P.stDetail}>
      <div data-part={P.stDetailHero}>
        <div data-part={P.stDetailHeroIcon}>{game.icon}</div>
        <div data-part={P.stDetailHeroName}>{game.name}</div>
        <div data-part={P.stDetailHeroGenre}>{game.genre}</div>
      </div>
      <div data-part={P.stDetailActions}>
        {game.installed ? (
          <Btn onClick={onLaunch}>▶ Play</Btn>
        ) : installing ? (
          <Btn disabled>⏳ Installing…</Btn>
        ) : (
          <Btn onClick={onLaunch}>📥 Install</Btn>
        )}
        <Btn>⚙️ Properties</Btn>
        <Btn>🗑️ Uninstall</Btn>
      </div>
      <div data-part={P.stInfoTable}>
        {infoRows.map(([label, value], index) => (
          <div
            key={label}
            data-part={P.stInfoRow}
            data-even={index % 2 === 0 || undefined}
          >
            <span data-part={P.stInfoLabel}>{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
      <div data-part={P.stAchievements}>
        <div data-part={P.stAchievementsTitle}>Achievements</div>
        <div data-part={P.stAchievementsBar}>
          <div
            data-part={P.stAchievementsFill}
            style={{
              width: `${game.installed ? Math.floor(game.hours % 80) + 10 : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const FriendRow: FC<{ friend: Friend }> = ({ friend }) => (
  <div data-part={P.stFriendRow} data-status={friend.status}>
    <span>{friend.emoji}</span>
    <div data-part={P.stFriendInfo}>
      <div data-part={P.stFriendName}>{friend.name}</div>
      {friend.game && <div data-part={P.stFriendGame}>🎮 {friend.game}</div>}
    </div>
  </div>
);

const FriendsList: FC<{
  friends: Friend[];
  onClose: () => void;
}> = ({ friends, onClose }) => {
  const online = friends.filter((friend) => friend.status === 'online');
  const away = friends.filter((friend) => friend.status === 'away');
  const offline = friends.filter((friend) => friend.status === 'offline');

  return (
    <div data-part={P.stFriends}>
      <div data-part={P.stFriendsHeader}>
        <span>Friends</span>
        <Btn onClick={onClose}>✕</Btn>
      </div>
      <div data-part={P.stFriendsList}>
        <div data-part={P.stFriendsGroup}>ONLINE — {online.length}</div>
        {online.map((friend) => (
          <FriendRow key={friend.name} friend={friend} />
        ))}
        <div data-part={P.stFriendsGroup}>AWAY — {away.length}</div>
        {away.map((friend) => (
          <FriendRow key={friend.name} friend={friend} />
        ))}
        <div data-part={P.stFriendsGroup}>OFFLINE — {offline.length}</div>
        {offline.map((friend) => (
          <FriendRow key={friend.name} friend={friend} />
        ))}
      </div>
    </div>
  );
};

const StoreTab: FC<{ games: SteamGame[] }> = ({ games }) => {
  const notInstalled = games.filter((game) => !game.installed);
  return (
    <div data-part={P.stStore}>
      <div data-part={P.stStoreTitle}>🏷️ Weekend Sale</div>
      <div data-part={P.stStoreGrid}>
        {notInstalled.map((game) => (
          <div key={game.id} data-part={P.stStoreCard}>
            <div data-part={P.stStoreCardIcon}>{game.icon}</div>
            <div data-part={P.stStoreCardName}>{game.name}</div>
            <div data-part={P.stStoreCardMeta}>
              {game.genre} — {game.size}
            </div>
            <div data-part={P.stStoreCardPrice}>
              <span data-part={P.stStoreOldPrice}>$59.99</span>
              <span data-part={P.stStoreDiscount}>-75%</span>
              <span data-part={P.stStoreNewPrice}>$14.99</span>
            </div>
            <Btn>🛒 Add to Cart</Btn>
          </div>
        ))}
      </div>
    </div>
  );
};

const CommunityTab: FC = () => (
  <div data-part={P.stCommunity}>
    <div style={{ fontSize: 48, marginBottom: 8 }}>👥</div>
    <div data-part={P.stCommunityTitle}>Community Hub</div>
    <div data-part={P.stCommunityDesc}>
      Discussions, guides, screenshots, and workshop content from the Steam community.
    </div>
    <div data-part={P.stCommunityActions}>
      <Btn>💬 Discussions</Btn>
      <Btn>📸 Screenshots</Btn>
      <Btn>🎨 Workshop</Btn>
      <Btn>📖 Guides</Btn>
    </div>
  </div>
);

const DownloadsTab: FC<{
  games: SteamGame[];
  installing: Record<number, boolean>;
}> = ({ games, installing }) => {
  const activeIds = Object.keys(installing).filter(
    (gameId) => installing[Number(gameId)],
  );

  return (
    <div data-part={P.stDownloads}>
      {activeIds.length > 0 ? (
        activeIds.map((gameId) => {
          const game = games.find((item) => item.id === Number(gameId));
          if (!game) return null;
          return (
            <div key={gameId} data-part={P.stDownloadItem}>
              <div data-part={P.stDownloadName}>
                {game.icon} {game.name}
              </div>
              <div data-part={P.stDownloadBar}>
                <div data-part={P.stDownloadFill} style={{ width: '45%' }} />
              </div>
              <div data-part={P.stDownloadMeta}>
                Downloading… 2.1 GB / {game.size} — 12.4 MB/s
              </div>
            </div>
          );
        })
      ) : (
        <EmptyState icon="📭" message="No downloads in progress." />
      )}
    </div>
  );
};

function createInitialSeed(props: SteamLauncherProps): SteamLauncherState {
  return createSteamLauncherStateSeed({
    initialGames: props.games ?? GAMES,
    initialFriends: props.friends ?? FRIENDS,
  });
}

function SteamLauncherFrame({
  state,
  dispatch,
  height,
}: {
  state: SteamLauncherState;
  dispatch: (action: SteamLauncherAction) => void;
  height?: number | string;
}) {
  const filteredGames = state.games.filter((game) => {
    if (state.filter === 'installed' && !game.installed) return false;
    if (state.filter === 'notinstalled' && game.installed) return false;
    if (
      state.searchTerm &&
      !game.name.toLowerCase().includes(state.searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const selectedGame =
    state.selectedGameId === null
      ? null
      : state.games.find((game) => game.id === state.selectedGameId) ?? null;
  const launching =
    state.launchingGameId === null
      ? null
      : state.games.find((game) => game.id === state.launchingGameId) ?? null;

  useEffect(() => {
    if (selectedGame || filteredGames.length === 0) return;
    dispatch(
      steamLauncherActions.setSelectedGameId(filteredGames[0]?.id ?? null),
    );
  }, [dispatch, filteredGames, selectedGame]);

  const installedCount = state.games.filter((game) => game.installed).length;
  const totalSize = state.games
    .filter((game) => game.installed)
    .reduce((sum, game) => sum + parseFloat(game.size), 0)
    .toFixed(1);

  const handleLaunch = (game: SteamGame) => {
    if (!game.installed) {
      dispatch(steamLauncherActions.startInstall(game.id));
      setTimeout(() => {
        dispatch(steamLauncherActions.finishInstall(game.id));
      }, 3000);
      return;
    }

    dispatch(steamLauncherActions.startLaunching(game.id));
    setTimeout(() => {
      dispatch(steamLauncherActions.finishLaunching());
    }, 2500);
  };

  return (
    <div data-part={P.steamLauncher} style={height ? { height } : undefined}>
      <WidgetToolbar>
        <div data-part={P.stFilterGroup}>
          {(['all', 'installed', 'notinstalled'] as GameFilter[]).map((filter) => (
            <Btn
              key={filter}
              onClick={() => dispatch(steamLauncherActions.setFilter(filter))}
              data-active={state.filter === filter || undefined}
            >
              {filter === 'all'
                ? 'All'
                : filter === 'installed'
                  ? 'Installed'
                  : 'Not Installed'}
            </Btn>
          ))}
        </div>
        <Btn
          onClick={() =>
            dispatch(steamLauncherActions.setShowFriends(!state.showFriends))
          }
        >
          👥 Friends
        </Btn>
      </WidgetToolbar>

      <TabBar
        tabs={TABS}
        active={state.activeTab}
        onChange={(tab) => dispatch(steamLauncherActions.setActiveTab(tab))}
      />

      <div data-part={P.stContent}>
        {state.activeTab === 'library' && (
          <div data-part={P.stLibrary}>
            <div data-part={P.stGameList}>
              <div data-part={P.stGameListHeader}>
                Library — {filteredGames.length} games
              </div>
              <div data-part={P.stSearchBar}>
                <input
                  data-part={P.stSearchInput}
                  placeholder="Search…"
                  value={state.searchTerm}
                  onChange={(event) =>
                    dispatch(
                      steamLauncherActions.setSearchTerm(event.target.value),
                    )
                  }
                />
              </div>
              <div data-part={P.stGameListBody}>
                {filteredGames.map((game) => (
                  <GameRow
                    key={game.id}
                    game={game}
                    selected={selectedGame?.id === game.id}
                    onSelect={() =>
                      dispatch(steamLauncherActions.setSelectedGameId(game.id))
                    }
                  />
                ))}
                {filteredGames.length === 0 && (
                  <EmptyState message="No games found." />
                )}
              </div>
            </div>

            {selectedGame && (
              <GameDetail
                game={selectedGame}
                installing={!!state.installing[selectedGame.id]}
                onLaunch={() => handleLaunch(selectedGame)}
              />
            )}

            {state.showFriends && (
              <FriendsList
                friends={state.friends}
                onClose={() =>
                  dispatch(steamLauncherActions.setShowFriends(false))
                }
              />
            )}
          </div>
        )}

        {state.activeTab === 'store' && <StoreTab games={state.games} />}
        {state.activeTab === 'community' && <CommunityTab />}
        {state.activeTab === 'downloads' && (
          <DownloadsTab games={state.games} installing={state.installing} />
        )}
      </div>

      {launching && (
        <ModalOverlay onClose={() => dispatch(steamLauncherActions.finishLaunching())}>
          <div data-part={P.stLaunchDialog}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{launching.icon}</div>
            <div data-part={P.stLaunchTitle}>Preparing to launch</div>
            <div data-part={P.stLaunchName}>{launching.name}</div>
            <div data-part={P.stLaunchBar}>
              <div data-part={P.stLaunchFill} />
            </div>
          </div>
        </ModalOverlay>
      )}

      <WidgetStatusBar>
        <span>🟢 Online</span>
        <span data-part={P.stStatusSep} />
        <span>📚 {installedCount} games installed</span>
        <div style={{ flex: 1 }} />
        <span>💾 {totalSize} GB used</span>
      </WidgetStatusBar>
    </div>
  );
}

function StandaloneSteamLauncher(props: SteamLauncherProps) {
  const [state, dispatch] = useReducer(steamLauncherReducer, createInitialSeed(props));
  return <SteamLauncherFrame state={state} dispatch={dispatch} height={props.height} />;
}

function ConnectedSteamLauncher(props: SteamLauncherProps) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectSteamLauncherState);

  useEffect(() => {
    reduxDispatch(steamLauncherActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.friends, props.games, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return (
    <SteamLauncherFrame
      state={effectiveState}
      dispatch={(action) => reduxDispatch(action)}
      height={props.height}
    />
  );
}

export const SteamLauncher: FC<SteamLauncherProps> = (props) => {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    STEAM_LAUNCHER_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedSteamLauncher {...props} />;
  }

  return <StandaloneSteamLauncher {...props} />;
};
