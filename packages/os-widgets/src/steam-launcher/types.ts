export interface SteamGame {
  id: number;
  name: string;
  icon: string;
  size: string;
  installed: boolean;
  lastPlayed: string;
  hours: number;
  genre: string;
}

export type FriendStatus = 'online' | 'away' | 'offline';

export interface Friend {
  name: string;
  status: FriendStatus;
  game: string | null;
  emoji: string;
}

export interface SteamLauncherProps {
  games?: SteamGame[];
  friends?: Friend[];
  height?: number | string;
}

export type SteamTab = 'library' | 'store' | 'community' | 'downloads';
export type GameFilter = 'all' | 'installed' | 'notinstalled';

export const TABS: { id: SteamTab; label: string; icon: string }[] = [
  { id: 'library', label: 'Library', icon: '\uD83D\uDCDA' },
  { id: 'store', label: 'Store', icon: '\uD83C\uDFEA' },
  { id: 'community', label: 'Community', icon: '\uD83D\uDC65' },
  { id: 'downloads', label: 'Downloads', icon: '\uD83D\uDCE5' },
];
