import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { SAMPLE_GAMES } from './sampleData';
import type { Game, GameFilter, GameSort } from './types';

export const GAME_FINDER_STATE_KEY = 'app_rw_game_finder' as const;

export interface GameFinderStateSeed {
  initialGames?: readonly Game[];
  view?: 'library' | 'detail';
  selectedGameId?: string | null;
  installingId?: string | null;
  search?: string;
  filter?: GameFilter;
  sortBy?: GameSort;
  launchedGameId?: string | null;
}

export interface GameFinderState {
  initialized: boolean;
  games: Game[];
  view: 'library' | 'detail';
  selectedGameId: string | null;
  installingId: string | null;
  search: string;
  filter: GameFilter;
  sortBy: GameSort;
  launchedGameId: string | null;
}

type GameFinderModuleState = GameFinderState | undefined;
type GameFinderStateInput = GameFinderStateSeed | GameFinderState | undefined;

function cloneGame(game: Game): Game {
  return {
    ...game,
    achievements: game.achievements.map((achievement) => ({ ...achievement })),
  };
}

export function createGameFinderStateSeed(
  seed: GameFinderStateSeed = {},
): GameFinderState {
  return {
    initialized: true,
    games: (seed.initialGames ?? SAMPLE_GAMES).map(cloneGame),
    view: seed.view ?? 'library',
    selectedGameId: seed.selectedGameId ?? null,
    installingId: seed.installingId ?? null,
    search: seed.search ?? '',
    filter: seed.filter ?? 'all',
    sortBy: seed.sortBy ?? 'recent',
    launchedGameId: seed.launchedGameId ?? null,
  };
}

function materializeGameFinderState(seed: GameFinderStateInput): GameFinderState {
  if (seed && typeof seed === 'object' && 'games' in seed && 'sortBy' in seed) {
    return {
      ...seed,
      games: seed.games.map(cloneGame),
    };
  }

  return createGameFinderStateSeed(seed);
}

const initialState: GameFinderState = {
  ...createGameFinderStateSeed(),
  initialized: false,
};

export const gameFinderSlice = createSlice({
  name: 'gameFinder',
  initialState,
  reducers: {
    initializeIfNeeded(state, action: PayloadAction<GameFinderStateInput>) {
      if (state.initialized) {
        return;
      }
      return materializeGameFinderState(action.payload);
    },
    replaceState(_state, action: PayloadAction<GameFinderStateInput>) {
      return materializeGameFinderState(action.payload);
    },
    setView(state, action: PayloadAction<'library' | 'detail'>) {
      state.view = action.payload;
    },
    setSelectedGameId(state, action: PayloadAction<string | null>) {
      state.selectedGameId = action.payload;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setFilter(state, action: PayloadAction<GameFilter>) {
      state.filter = action.payload;
    },
    setSortBy(state, action: PayloadAction<GameSort>) {
      state.sortBy = action.payload;
    },
    setInstallingId(state, action: PayloadAction<string | null>) {
      state.installingId = action.payload;
    },
    markInstalled(state, action: PayloadAction<string>) {
      const game = state.games.find((item) => item.id === action.payload);
      if (game) {
        game.installed = true;
      }
      if (state.installingId === action.payload) {
        state.installingId = null;
      }
    },
    setLaunchedGameId(state, action: PayloadAction<string | null>) {
      state.launchedGameId = action.payload;
    },
  },
});

export const gameFinderReducer = gameFinderSlice.reducer;
export const gameFinderActions = gameFinderSlice.actions;
export type GameFinderAction = ReturnType<
  (typeof gameFinderActions)[keyof typeof gameFinderActions]
>;

const selectRawGameFinderState = (rootState: unknown): GameFinderState | undefined =>
  typeof rootState === 'object' &&
  rootState !== null &&
  !Array.isArray(rootState)
    ? (rootState as Record<string, GameFinderModuleState>)[GAME_FINDER_STATE_KEY]
    : undefined;

export const selectGameFinderState = (rootState: unknown): GameFinderState =>
  selectRawGameFinderState(rootState) ?? initialState;
