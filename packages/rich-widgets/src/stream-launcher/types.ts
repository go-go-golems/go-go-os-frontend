export type StreamStatus = 'live' | 'vod' | 'offline';

export type ThumbType =
  | 'hypercard'
  | 'resedit'
  | 'marathon'
  | 'darkcastle'
  | 'lofi'
  | 'midi'
  | 'macpaint'
  | 'pagemaker'
  | 'lan'
  | 'keynote'
  | 'insdemac'
  | 'photoshop';

export interface Stream {
  id: string;
  title: string;
  host: string;
  cat: string;
  viewers: number;
  status: StreamStatus;
  desc: string;
  duration: string;
  thumb: ThumbType;
}

export interface ChatMessage {
  user: string;
  msg: string;
}

export interface StreamLauncherProps {
  streams?: Stream[];
  initialCategory?: string;
  height?: number | string;
}

export type StreamSort = 'viewers' | 'title';

export const CATEGORIES = [
  'All',
  '\u{1F5A5}\uFE0F Tech',
  '\uD83C\uDFAE Gaming',
  '\uD83C\uDFB5 Music',
  '\uD83C\uDFA8 Creative',
  '\uD83D\uDCE1 Live',
  '\uD83D\uDCFC Archive',
];

export const SORT_OPTIONS: { value: StreamSort; label: string }[] = [
  { value: 'viewers', label: '\uD83D\uDC41\uFE0F Viewers' },
  { value: 'title', label: '\uD83D\uDD24 Title' },
];
