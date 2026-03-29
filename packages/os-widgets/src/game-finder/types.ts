export interface Achievement {
  name: string;
  desc: string;
  done: boolean;
  icon: string;
}

export interface Game {
  id: string;
  title: string;
  genre: string;
  year: string;
  dev: string;
  size: string;
  rating: number;
  installed: boolean;
  hours: number;
  lastPlayed: string;
  art: ArtType;
  desc: string;
  achievements: Achievement[];
}

export type ArtType =
  | 'castle'
  | 'tank'
  | 'glider'
  | 'crystal'
  | 'puck'
  | 'prince'
  | 'loderunner'
  | 'simcity';

export type GameFilter = 'all' | 'installed' | 'notinstalled';
export type GameSort = 'recent' | 'name' | 'hours' | 'rating';

export const FILTER_OPTIONS: { value: GameFilter; label: string }[] = [
  { value: 'all', label: 'All Games' },
  { value: 'installed', label: 'Installed' },
  { value: 'notinstalled', label: 'Not Installed' },
];

export const SORT_OPTIONS: { value: GameSort; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'name', label: 'Name' },
  { value: 'hours', label: 'Play Time' },
  { value: 'rating', label: 'Rating' },
];
