import { useState, type FC } from 'react';
import { Btn } from '@hypercard/engine';
import { RICH_PARTS as P } from '../parts';
import type { SteamGame, SteamTab, GameFilter, Friend } from './types';
import { TABS } from './types';
import { GAMES, FRIENDS } from './sampleData';

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const TabBar: FC<{
  tabs: typeof TABS;
  active: SteamTab;
  onChange: (id: SteamTab) => void;
}> = ({ tabs, active, onChange }) => (
  <div data-part={P.stTabBar}>
    {tabs.map(t => (
      <div
        key={t.id}
        data-part={P.stTab}
        data-selected={active === t.id || undefined}
        onClick={() => onChange(t.id)}
      >
        {t.icon} {t.label}
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
    <span data-part={P.stInstallDot}>
      {game.installed ? '\u25CF' : '\u25CB'}
    </span>
  </div>
);

const GameDetail: FC<{
  game: SteamGame;
  installing: boolean;
  onLaunch: () => void;
}> = ({ game, installing, onLaunch }) => {
  const infoRows: [string, string][] = [
    ['Status', game.installed ? '\u2705 Installed' : '\u2B1C Not Installed'],
    ['Size on Disk', game.size],
    ['Hours Played', `${game.hours} hrs`],
    ['Last Played', game.lastPlayed],
    ['Genre', game.genre],
  ];

  return (
    <div data-part={P.stDetail}>
      {/* Hero */}
      <div data-part={P.stDetailHero}>
        <div data-part={P.stDetailHeroIcon}>{game.icon}</div>
        <div data-part={P.stDetailHeroName}>{game.name}</div>
        <div data-part={P.stDetailHeroGenre}>{game.genre}</div>
      </div>

      {/* Actions */}
      <div data-part={P.stDetailActions}>
        {game.installed ? (
          <Btn onClick={onLaunch}>{'\u25B6'} Play</Btn>
        ) : installing ? (
          <Btn disabled>{'\u23F3'} Installing{'\u2026'}</Btn>
        ) : (
          <Btn onClick={onLaunch}>{'\uD83D\uDCE5'} Install</Btn>
        )}
        <Btn>{'\u2699\uFE0F'} Properties</Btn>
        <Btn>{'\uD83D\uDDD1\uFE0F'} Uninstall</Btn>
      </div>

      {/* Info table */}
      <div data-part={P.stInfoTable}>
        {infoRows.map(([label, val], i) => (
          <div key={label} data-part={P.stInfoRow} data-even={i % 2 === 0 || undefined}>
            <span data-part={P.stInfoLabel}>{label}</span>
            <span>{val}</span>
          </div>
        ))}
      </div>

      {/* Achievements bar */}
      <div data-part={P.stAchievements}>
        <div data-part={P.stAchievementsTitle}>Achievements</div>
        <div data-part={P.stAchievementsBar}>
          <div
            data-part={P.stAchievementsFill}
            style={{ width: `${game.installed ? Math.floor(game.hours % 80) + 10 : 0}%` }}
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
      {friend.game && (
        <div data-part={P.stFriendGame}>{'\uD83C\uDFAE'} {friend.game}</div>
      )}
    </div>
  </div>
);

const FriendsList: FC<{
  friends: Friend[];
  onClose: () => void;
}> = ({ friends, onClose }) => {
  const online = friends.filter(f => f.status === 'online');
  const away = friends.filter(f => f.status === 'away');
  const offline = friends.filter(f => f.status === 'offline');

  return (
    <div data-part={P.stFriends}>
      <div data-part={P.stFriendsHeader}>
        <span>Friends</span>
        <Btn onClick={onClose}>{'\u2715'}</Btn>
      </div>
      <div data-part={P.stFriendsList}>
        <div data-part={P.stFriendsGroup}>
          ONLINE {'\u2014'} {online.length}
        </div>
        {online.map(f => (
          <FriendRow key={f.name} friend={f} />
        ))}
        <div data-part={P.stFriendsGroup}>
          AWAY {'\u2014'} {away.length}
        </div>
        {away.map(f => (
          <FriendRow key={f.name} friend={f} />
        ))}
        <div data-part={P.stFriendsGroup}>
          OFFLINE {'\u2014'} {offline.length}
        </div>
        {offline.map(f => (
          <FriendRow key={f.name} friend={f} />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Store tab                                                          */
/* ------------------------------------------------------------------ */
const StoreTab: FC<{ games: SteamGame[] }> = ({ games }) => {
  const notInstalled = games.filter(g => !g.installed);
  return (
    <div data-part={P.stStore}>
      <div data-part={P.stStoreTitle}>{'\uD83C\uDFF7\uFE0F'} Weekend Sale</div>
      <div data-part={P.stStoreGrid}>
        {notInstalled.map(g => (
          <div key={g.id} data-part={P.stStoreCard}>
            <div data-part={P.stStoreCardIcon}>{g.icon}</div>
            <div data-part={P.stStoreCardName}>{g.name}</div>
            <div data-part={P.stStoreCardMeta}>{g.genre} {'\u2014'} {g.size}</div>
            <div data-part={P.stStoreCardPrice}>
              <span data-part={P.stStoreOldPrice}>$59.99</span>
              <span data-part={P.stStoreDiscount}>-75%</span>
              <span data-part={P.stStoreNewPrice}>$14.99</span>
            </div>
            <Btn>{'\uD83D\uDED2'} Add to Cart</Btn>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Community tab                                                      */
/* ------------------------------------------------------------------ */
const CommunityTab: FC = () => (
  <div data-part={P.stCommunity}>
    <div style={{ fontSize: 48, marginBottom: 8 }}>{'\uD83D\uDC65'}</div>
    <div data-part={P.stCommunityTitle}>Community Hub</div>
    <div data-part={P.stCommunityDesc}>
      Discussions, guides, screenshots, and workshop content from the Steam community.
    </div>
    <div data-part={P.stCommunityActions}>
      <Btn>{'\uD83D\uDCAC'} Discussions</Btn>
      <Btn>{'\uD83D\uDCF8'} Screenshots</Btn>
      <Btn>{'\uD83C\uDFA8'} Workshop</Btn>
      <Btn>{'\uD83D\uDCD6'} Guides</Btn>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Downloads tab                                                      */
/* ------------------------------------------------------------------ */
const DownloadsTab: FC<{
  games: SteamGame[];
  installing: Record<number, boolean>;
}> = ({ games, installing }) => {
  const activeIds = Object.keys(installing).filter(k => installing[Number(k)]);
  return (
    <div data-part={P.stDownloads}>
      {activeIds.length > 0 ? (
        activeIds.map(k => {
          const g = games.find(g2 => g2.id === Number(k));
          if (!g) return null;
          return (
            <div key={k} data-part={P.stDownloadItem}>
              <div data-part={P.stDownloadName}>
                {g.icon} {g.name}
              </div>
              <div data-part={P.stDownloadBar}>
                <div data-part={P.stDownloadFill} style={{ width: '45%' }} />
              </div>
              <div data-part={P.stDownloadMeta}>
                Downloading{'\u2026'} 2.1 GB / {g.size} {'\u2014'} 12.4 MB/s
              </div>
            </div>
          );
        })
      ) : (
        <div data-part={P.stEmptyState}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{'\uD83D\uDCED'}</div>
          No downloads in progress.
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export interface SteamLauncherProps {
  /** Games to display. Defaults to sample data. */
  games?: SteamGame[];
  /** Friends to display. Defaults to sample data. */
  friends?: Friend[];
  /** Height constraint. */
  height?: number | string;
}

export const SteamLauncher: FC<SteamLauncherProps> = ({
  games = GAMES,
  friends = FRIENDS,
  height,
}) => {
  const [selectedGame, setSelectedGame] = useState<SteamGame>(games[0]);
  const [activeTab, setActiveTab] = useState<SteamTab>('library');
  const [showFriends, setShowFriends] = useState(true);
  const [filter, setFilter] = useState<GameFilter>('all');
  const [installing, setInstalling] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [launching, setLaunching] = useState<SteamGame | null>(null);

  const filteredGames = games.filter(g => {
    if (filter === 'installed' && !g.installed) return false;
    if (filter === 'notinstalled' && g.installed) return false;
    if (searchTerm && !g.name.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    return true;
  });

  const handleLaunch = (game: SteamGame) => {
    if (!game.installed) {
      setInstalling(prev => ({ ...prev, [game.id]: true }));
      setTimeout(() => setInstalling(prev => ({ ...prev, [game.id]: false })), 3000);
      return;
    }
    setLaunching(game);
    setTimeout(() => setLaunching(null), 2500);
  };

  const installedCount = games.filter(g => g.installed).length;
  const totalSize = games
    .filter(g => g.installed)
    .reduce((a, g) => a + parseFloat(g.size), 0)
    .toFixed(1);

  return (
    <div data-part={P.steamLauncher} style={height ? { height } : undefined}>
      {/* Toolbar / filter */}
      <div data-part={P.stToolbar}>
        <div data-part={P.stFilterGroup}>
          {(['all', 'installed', 'notinstalled'] as GameFilter[]).map(f => (
            <Btn
              key={f}
              onClick={() => setFilter(f)}
              data-active={filter === f || undefined}
            >
              {f === 'all' ? 'All' : f === 'installed' ? 'Installed' : 'Not Installed'}
            </Btn>
          ))}
        </div>
        <Btn onClick={() => setShowFriends(!showFriends)}>
          {'\uD83D\uDC65'} Friends
        </Btn>
      </div>

      {/* Tabs */}
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Content */}
      <div data-part={P.stContent}>
        {activeTab === 'library' && (
          <div data-part={P.stLibrary}>
            {/* Game list sidebar */}
            <div data-part={P.stGameList}>
              <div data-part={P.stGameListHeader}>
                Library {'\u2014'} {filteredGames.length} games
              </div>
              <div data-part={P.stSearchBar}>
                <input
                  data-part={P.stSearchInput}
                  placeholder="Search\u2026"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div data-part={P.stGameListBody}>
                {filteredGames.map(g => (
                  <GameRow
                    key={g.id}
                    game={g}
                    selected={selectedGame?.id === g.id}
                    onSelect={() => setSelectedGame(g)}
                  />
                ))}
                {filteredGames.length === 0 && (
                  <div data-part={P.stEmptyState}>No games found.</div>
                )}
              </div>
            </div>

            {/* Game detail */}
            {selectedGame && (
              <GameDetail
                game={selectedGame}
                installing={!!installing[selectedGame.id]}
                onLaunch={() => handleLaunch(selectedGame)}
              />
            )}

            {/* Friends */}
            {showFriends && (
              <FriendsList
                friends={friends}
                onClose={() => setShowFriends(false)}
              />
            )}
          </div>
        )}

        {activeTab === 'store' && <StoreTab games={games} />}
        {activeTab === 'community' && <CommunityTab />}
        {activeTab === 'downloads' && (
          <DownloadsTab games={games} installing={installing} />
        )}
      </div>

      {/* Launching dialog */}
      {launching && (
        <div data-part={P.stLaunchOverlay}>
          <div data-part={P.stLaunchDialog}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{launching.icon}</div>
            <div data-part={P.stLaunchTitle}>Preparing to launch</div>
            <div data-part={P.stLaunchName}>{launching.name}</div>
            <div data-part={P.stLaunchBar}>
              <div data-part={P.stLaunchFill} />
            </div>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div data-part={P.stStatusBar}>
        <span>{'\uD83D\uDFE2'} Online</span>
        <span data-part={P.stStatusSep} />
        <span>{'\uD83D\uDCDA'} {installedCount} games installed</span>
        <div style={{ flex: 1 }} />
        <span>{'\uD83D\uDCBE'} {totalSize} GB used</span>
      </div>
    </div>
  );
};
