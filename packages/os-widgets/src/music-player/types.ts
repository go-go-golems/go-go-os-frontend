export interface Playlist {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface AlbumMeta {
  artist: string;
  year: string;
  cover: string;
}

export interface Track {
  title: string;
  artist: string;
  album: string;
  duration: string;
}

export type ViewMode = 'list' | 'grid';

export function parseDuration(d: string): number {
  const [m, s] = d.split(':').map(Number);
  return m * 60 + s;
}

export function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
