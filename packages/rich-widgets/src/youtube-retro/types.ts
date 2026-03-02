export interface YtChannel {
  id: string;
  name: string;
  icon: string;
  subs: string;
}

export interface YtVideo {
  id: number;
  title: string;
  channel: string;
  channelIcon: string;
  views: string;
  time: string;
  uploaded: string;
  likes: string;
  dislikes: string;
  thumb: string;
  category: string;
  desc: string;
}

export interface YtComment {
  user: string;
  icon: string;
  text: string;
  time: string;
  likes: number;
}

export interface YtCategory {
  id: string;
  label: string;
  icon: string;
}

export type YtView = 'home' | 'watch';

export const CATEGORIES: YtCategory[] = [
  { id: 'all', label: 'All', icon: '\uD83D\uDCFA' },
  { id: 'tech', label: 'Technology', icon: '\u{1F5A5}\uFE0F' },
  { id: 'game', label: 'Gaming', icon: '\uD83D\uDD79\uFE0F' },
  { id: 'music', label: 'Music', icon: '\uD83C\uDFB9' },
  { id: 'cook', label: 'Cooking', icon: '\uD83C\uDF73' },
  { id: 'science', label: 'Science', icon: '\uD83D\uDD2C' },
  { id: 'art', label: 'Art', icon: '\uD83C\uDFA8' },
];

export function parseDuration(d: string): number {
  const p = d.split(':').map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
}

export function fmtTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}
