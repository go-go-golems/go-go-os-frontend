import type { SteamGame, Friend } from './types';

export const GAMES: SteamGame[] = [
  { id: 1, name: 'Half-Life 2', icon: '\uD83D\uDD2B', size: '4.2 GB', installed: true, lastPlayed: 'Jan 12, 2026', hours: 142, genre: 'FPS' },
  { id: 2, name: 'Portal 2', icon: '\uD83C\uDF00', size: '8.1 GB', installed: true, lastPlayed: 'Feb 28, 2026', hours: 67, genre: 'Puzzle' },
  { id: 3, name: 'Counter-Strike 2', icon: '\uD83D\uDCA3', size: '25.3 GB', installed: true, lastPlayed: 'Mar 01, 2026', hours: 1893, genre: 'FPS' },
  { id: 4, name: 'Stardew Valley', icon: '\uD83C\uDF3E', size: '1.2 GB', installed: true, lastPlayed: 'Feb 14, 2026', hours: 312, genre: 'Simulation' },
  { id: 5, name: 'Celeste', icon: '\uD83C\uDF53', size: '1.8 GB', installed: false, lastPlayed: 'Never', hours: 0, genre: 'Platformer' },
  { id: 6, name: 'Hollow Knight', icon: '\uD83E\uDD8B', size: '3.4 GB', installed: false, lastPlayed: 'Never', hours: 0, genre: 'Metroidvania' },
  { id: 7, name: 'Disco Elysium', icon: '\uD83D\uDD75\uFE0F', size: '12.6 GB', installed: true, lastPlayed: 'Dec 03, 2025', hours: 89, genre: 'RPG' },
  { id: 8, name: 'Terraria', icon: '\u26CF\uFE0F', size: '0.8 GB', installed: true, lastPlayed: 'Feb 20, 2026', hours: 540, genre: 'Sandbox' },
  { id: 9, name: 'Hades', icon: '\uD83D\uDD25', size: '6.2 GB', installed: false, lastPlayed: 'Never', hours: 0, genre: 'Roguelike' },
  { id: 10, name: 'Factorio', icon: '\u2699\uFE0F', size: '2.1 GB', installed: true, lastPlayed: 'Feb 27, 2026', hours: 1200, genre: 'Strategy' },
  { id: 11, name: 'Elden Ring', icon: '\uD83D\uDC8D', size: '44.0 GB', installed: false, lastPlayed: 'Never', hours: 0, genre: 'RPG' },
  { id: 12, name: 'Civilization VI', icon: '\uD83C\uDFDB\uFE0F', size: '18.5 GB', installed: true, lastPlayed: 'Jan 30, 2026', hours: 670, genre: 'Strategy' },
];

export const FRIENDS: Friend[] = [
  { name: 'GordonFreeman', status: 'online', game: 'Counter-Strike 2', emoji: '\uD83E\uDDD4' },
  { name: 'CakeLover', status: 'online', game: 'Portal 2', emoji: '\uD83C\uDF82' },
  { name: 'xX_Farmer_Xx', status: 'away', game: null, emoji: '\uD83E\uDDD1\u200D\uD83C\uDF3E' },
  { name: 'PixelWizard', status: 'online', game: 'Terraria', emoji: '\uD83E\uDDD9' },
  { name: 'NightOwl99', status: 'offline', game: null, emoji: '\uD83E\uDD89' },
  { name: 'SpeedRunner', status: 'online', game: 'Celeste', emoji: '\uD83C\uDFC3' },
  { name: 'BaseBuilder', status: 'away', game: null, emoji: '\uD83C\uDFD7\uFE0F' },
];
