import type { Playlist, AlbumMeta, Track } from './types';

export const PLAYLISTS: Playlist[] = [
  { id: 'liked', name: 'Liked Songs', icon: '\u2764\uFE0F', count: 847 },
  { id: 'discover', name: 'Discover Weekly', icon: '\uD83D\uDD2E', count: 30 },
  { id: 'chill', name: 'Lo-Fi Chill Beats', icon: '\uD83C\uDF19', count: 62 },
  { id: 'workout', name: 'Workout Mix', icon: '\uD83D\uDCAA', count: 45 },
  { id: 'road', name: 'Road Trip', icon: '\uD83D\uDE97', count: 88 },
  { id: 'classics', name: 'Classic Rock', icon: '\uD83C\uDFB8', count: 120 },
  { id: 'jazz', name: 'Late Night Jazz', icon: '\uD83C\uDFB7', count: 54 },
  { id: 'indie', name: 'Indie Discoveries', icon: '\uD83C\uDF3F', count: 37 },
  { id: '80s', name: '80s Synthwave', icon: '\uD83D\uDD79\uFE0F', count: 41 },
  { id: 'focus', name: 'Deep Focus', icon: '\uD83E\uDDE0', count: 70 },
];

export const ALBUMS: Record<string, AlbumMeta> = {
  liked: { artist: 'Various Artists', year: '', cover: '\u2764\uFE0F' },
  discover: { artist: 'Made for You', year: '2026', cover: '\uD83D\uDD2E' },
  chill: { artist: 'Various Artists', year: '2025', cover: '\uD83C\uDF19' },
  workout: { artist: 'Various Artists', year: '2024', cover: '\uD83D\uDCAA' },
  road: { artist: 'Various Artists', year: '2025', cover: '\uD83D\uDE97' },
  classics: { artist: 'Various Artists', year: '1970\u20131990', cover: '\uD83C\uDFB8' },
  jazz: { artist: 'Various Artists', year: '1955\u20132020', cover: '\uD83C\uDFB7' },
  indie: { artist: 'Various Artists', year: '2023\u20132026', cover: '\uD83C\uDF3F' },
  '80s': { artist: 'Various Artists', year: '1980\u20131989', cover: '\uD83D\uDD79\uFE0F' },
  focus: { artist: 'Various Artists', year: '2024', cover: '\uD83E\uDDE0' },
};

const TRACKS_DB: Record<string, Track[]> = {
  liked: [
    { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: '5:55' },
    { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', duration: '6:30' },
    { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', duration: '8:02' },
    { title: 'Imagine', artist: 'John Lennon', album: 'Imagine', duration: '3:07' },
    { title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', duration: '5:01' },
    { title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', duration: '4:54' },
    { title: 'Hey Jude', artist: 'The Beatles', album: 'Single', duration: '7:11' },
    { title: 'Wish You Were Here', artist: 'Pink Floyd', album: 'Wish You Were Here', duration: '5:34' },
    { title: 'Under Pressure', artist: 'Queen & David Bowie', album: 'Hot Space', duration: '4:04' },
    { title: 'Comfortably Numb', artist: 'Pink Floyd', album: 'The Wall', duration: '6:24' },
  ],
  discover: [
    { title: 'Neon Pulse', artist: 'Synthwave Collective', album: 'Digital Dreams', duration: '4:12' },
    { title: 'Midnight Drive', artist: 'Chrome Skies', album: 'After Hours', duration: '3:48' },
    { title: 'Electric Garden', artist: 'Moss & Wire', album: 'Verdant', duration: '5:02' },
    { title: 'Glass Towers', artist: 'The Architects', album: 'Skyline', duration: '3:33' },
    { title: 'Velvet Rain', artist: 'Luna Park', album: 'Carousel', duration: '4:27' },
    { title: 'Phantom Thread', artist: 'Ghost Looms', album: 'Textile', duration: '6:01' },
  ],
  chill: [
    { title: 'Rainy Afternoon', artist: 'Sleepy Fish', album: 'Puddles', duration: '2:43' },
    { title: 'Coffee & Pages', artist: 'Kupla', album: 'Bookshop', duration: '3:11' },
    { title: 'Warm Blankets', artist: 'Idealism', album: 'Cozy', duration: '2:58' },
    { title: 'Window Fog', artist: 'In Love With a Ghost', album: 'Healing', duration: '3:22' },
    { title: 'Soft Landing', artist: 'Vanilla', album: 'Drift', duration: '2:34' },
    { title: 'Sunday Morning', artist: 'Jinsang', album: 'Solitude', duration: '3:47' },
    { title: 'Paper Cranes', artist: 'Tomppabeats', album: 'Harbor', duration: '2:15' },
    { title: 'Golden Hour', artist: 'Saib', album: 'Sunset', duration: '3:05' },
  ],
  workout: [
    { title: 'Lose Yourself', artist: 'Eminem', album: '8 Mile', duration: '5:26' },
    { title: 'Stronger', artist: 'Kanye West', album: 'Graduation', duration: '5:12' },
    { title: 'Till I Collapse', artist: 'Eminem', album: 'The Eminem Show', duration: '4:57' },
    { title: 'Eye of the Tiger', artist: 'Survivor', album: 'Eye of the Tiger', duration: '4:05' },
    { title: 'Power', artist: 'Kanye West', album: 'MBDTF', duration: '4:52' },
  ],
};

const GENERIC_NAMES = ['Echoes', 'Drift', 'Cascade', 'Tremor', 'Pulse', 'Bloom', 'Sway', 'Haze'];
const GENERIC_ARTISTS = ['The Wanderers', 'Neon Dusk', 'Amber Waves', 'Static Hymn', 'Violet Ashes'];

export function getTracksForPlaylist(id: string): Track[] {
  if (TRACKS_DB[id]) return TRACKS_DB[id];
  return Array.from({ length: 8 }, (_, i) => ({
    title: GENERIC_NAMES[i % GENERIC_NAMES.length] + (i > 7 ? ` ${i}` : ''),
    artist: GENERIC_ARTISTS[i % GENERIC_ARTISTS.length],
    album: 'Unknown Album',
    duration: `${3 + (i % 4)}:${String((i * 17) % 60).padStart(2, '0')}`,
  }));
}
