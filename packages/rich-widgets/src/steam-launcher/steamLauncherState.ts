import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { FRIENDS, GAMES } from './sampleData';
import type { Friend, GameFilter, SteamGame, SteamLauncherProps, SteamTab } from './types';

export const STEAM_LAUNCHER_STATE_KEY = 'app_rw_steam_launcher' as const;

export interface SteamLauncherStateSeed {
  initialGames?: readonly SteamGame[];
  initialFriends?: readonly Friend[];
  selectedGameId?: number | null;
  activeTab?: SteamTab;
  showFriends?: boolean;
  filter?: GameFilter;
  installing?: Record<number, boolean>;
  searchTerm?: string;
  launchingGameId?: number | null;
}

export interface SteamLauncherState {
  initialized: boolean;
  games: SteamGame[];
  friends: Friend[];
  selectedGameId: number | null;
  activeTab: SteamTab;
  showFriends: boolean;
  filter: GameFilter;
  installing: Record<number, boolean>;
  searchTerm: string;
  launchingGameId: number | null;
}

type SteamLauncherModuleState = SteamLauncherState | undefined;
type SteamLauncherStateInput = SteamLauncherStateSeed | SteamLauncherState | undefined;

function cloneGame(game: SteamGame): SteamGame {
  return { ...game };
}

function cloneFriend(friend: Friend): Friend {
  return { ...friend };
}

export function createSteamLauncherStateSeed(
  seed: SteamLauncherStateSeed = {},
): SteamLauncherState {
  const games = (seed.initialGames ?? GAMES).map(cloneGame);
  return {
    initialized: true,
    games,
    friends: (seed.initialFriends ?? FRIENDS).map(cloneFriend),
    selectedGameId: seed.selectedGameId ?? games[0]?.id ?? null,
    activeTab: seed.activeTab ?? 'library',
    showFriends: seed.showFriends ?? true,
    filter: seed.filter ?? 'all',
    installing: { ...(seed.installing ?? {}) },
    searchTerm: seed.searchTerm ?? '',
    launchingGameId: seed.launchingGameId ?? null,
  };
}

function materializeSteamLauncherState(seed: SteamLauncherStateInput): SteamLauncherState {
  if (seed && typeof seed === 'object' && 'games' in seed && 'activeTab' in seed) {
    return {
      ...seed,
      games: seed.games.map(cloneGame),
      friends: seed.friends.map(cloneFriend),
      installing: { ...seed.installing },
    };
  }

  return createSteamLauncherStateSeed(seed);
}

const initialState: SteamLauncherState = {
  ...createSteamLauncherStateSeed(),
  initialized: false,
};

export const steamLauncherSlice = createSlice({
  name: 'steamLauncher',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<SteamLauncherStateInput>) {
      if (state.initialized) return;
      return materializeSteamLauncherState(action.payload);
    },
    replaceState(_state, action: PayloadAction<SteamLauncherStateInput>) {
      return materializeSteamLauncherState(action.payload);
    },
    setSelectedGameId(state, action: PayloadAction<number | null>) {
      state.selectedGameId = action.payload;
    },
    setActiveTab(state, action: PayloadAction<SteamTab>) {
      state.activeTab = action.payload;
    },
    setShowFriends(state, action: PayloadAction<boolean>) {
      state.showFriends = action.payload;
    },
    setFilter(state, action: PayloadAction<GameFilter>) {
      state.filter = action.payload;
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
    startInstall(state, action: PayloadAction<number>) {
      state.installing = { ...state.installing, [action.payload]: true };
    },
    finishInstall(state, action: PayloadAction<number>) {
      state.installing = { ...state.installing, [action.payload]: false };
      const game = state.games.find((item) => item.id === action.payload);
      if (game) {
        game.installed = true;
        game.lastPlayed = 'Just installed';
      }
    },
    startLaunching(state, action: PayloadAction<number>) {
      state.launchingGameId = action.payload;
    },
    finishLaunching(state) {
      state.launchingGameId = null;
    },
  },
});

export const steamLauncherReducer = steamLauncherSlice.reducer;
export const steamLauncherActions = steamLauncherSlice.actions;
export type SteamLauncherAction = ReturnType<
  (typeof steamLauncherActions)[keyof typeof steamLauncherActions]
>;

const selectRawSteamLauncherState = (rootState: unknown): SteamLauncherState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, SteamLauncherModuleState>)[STEAM_LAUNCHER_STATE_KEY]
    : undefined;

export const selectSteamLauncherState = (rootState: unknown): SteamLauncherState =>
  selectRawSteamLauncherState(rootState) ?? initialState;
