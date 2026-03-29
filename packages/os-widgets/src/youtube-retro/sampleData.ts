import type { YtChannel, YtVideo, YtComment } from './types';

export const CHANNELS: YtChannel[] = [
  { id: 'tech', name: 'RetroTechReview', icon: '\u{1F5A5}\uFE0F', subs: '1.2M' },
  { id: 'cook', name: 'PixelKitchen', icon: '\uD83C\uDF73', subs: '890K' },
  { id: 'music', name: 'SynthwaveRadio', icon: '\uD83C\uDFB9', subs: '2.4M' },
  { id: 'game', name: '8BitGamer', icon: '\uD83D\uDD79\uFE0F', subs: '3.1M' },
  { id: 'science', name: 'CuriousMinds', icon: '\uD83D\uDD2C', subs: '1.8M' },
  { id: 'art', name: 'DitherStudios', icon: '\uD83C\uDFA8', subs: '560K' },
];

export const VIDEOS: YtVideo[] = [
  { id: 1, title: 'Building a Macintosh SE from Scratch', channel: 'RetroTechReview', channelIcon: '\u{1F5A5}\uFE0F', views: '2.4M', time: '24:31', uploaded: '3 days ago', likes: '142K', dislikes: '1.2K', thumb: '\u{1F5A5}\uFE0F', category: 'tech', desc: 'In this episode we take apart a classic Macintosh SE, clean every component, replace the capacitors, and put it all back together. Watch as this 1987 machine comes back to life!' },
  { id: 2, title: 'Why System 7 Was Peak UI Design', channel: 'RetroTechReview', channelIcon: '\u{1F5A5}\uFE0F', views: '1.8M', time: '18:42', uploaded: '1 week ago', likes: '98K', dislikes: '3.4K', thumb: '\uD83D\uDCBE', category: 'tech', desc: 'System 7 introduced a level of elegance and usability that modern operating systems still struggle to match. Let\u2019s explore what made it so special.' },
  { id: 3, title: 'The Perfect Sourdough in a Retro Kitchen', channel: 'PixelKitchen', channelIcon: '\uD83C\uDF73', views: '980K', time: '32:15', uploaded: '2 days ago', likes: '67K', dislikes: '890', thumb: '\uD83C\uDF5E', category: 'cook', desc: 'Using only tools available in 1987, we bake the most incredible sourdough bread. No digital thermometers, no modern ovens \u2014 just pure analog cooking.' },
  { id: 4, title: 'Synthwave Mix \u2014 Neon Nights Vol. 4', channel: 'SynthwaveRadio', channelIcon: '\uD83C\uDFB9', views: '5.2M', time: '1:42:08', uploaded: '5 days ago', likes: '210K', dislikes: '2.1K', thumb: '\uD83C\uDF03', category: 'music', desc: 'Two hours of the best synthwave and retrowave tracks. Perfect for late-night coding sessions or cruising through neon-lit streets.' },
  { id: 5, title: 'Beating Dark Souls on a PowerBook 100', channel: '8BitGamer', channelIcon: '\uD83D\uDD79\uFE0F', views: '4.1M', time: '45:22', uploaded: '1 day ago', likes: '320K', dislikes: '5.6K', thumb: '\u2694\uFE0F', category: 'game', desc: 'They said it was impossible. They were almost right. Watch me attempt to beat Dark Souls on a 1991 PowerBook 100 with a trackball.' },
  { id: 6, title: 'Can You Speedrun Mario on Original Hardware?', channel: '8BitGamer', channelIcon: '\uD83D\uDD79\uFE0F', views: '3.3M', time: '28:55', uploaded: '4 days ago', likes: '189K', dislikes: '2.3K', thumb: '\uD83C\uDF44', category: 'game', desc: 'We attempt world-record Mario speedruns using only original NES hardware. No emulators, no save states, no excuses.' },
  { id: 7, title: 'Quantum Computing Explained with Marbles', channel: 'CuriousMinds', channelIcon: '\uD83D\uDD2C', views: '7.8M', time: '22:10', uploaded: '2 weeks ago', likes: '445K', dislikes: '4.2K', thumb: '\uD83D\uDD2E', category: 'science', desc: 'Using nothing but marbles and wooden tracks, we build a physical model that demonstrates the core principles of quantum computing.' },
  { id: 8, title: 'Pixel Art Masterclass \u2014 Dithering Techniques', channel: 'DitherStudios', channelIcon: '\uD83C\uDFA8', views: '620K', time: '35:48', uploaded: '6 days ago', likes: '52K', dislikes: '310', thumb: '\uD83C\uDFA8', category: 'art', desc: 'Learn the lost art of dithering \u2014 turning limited color palettes into stunning artwork. We cover Floyd-Steinberg, ordered, and Bayer matrix dithering.' },
  { id: 9, title: 'I Made a CPU Out of Cardboard', channel: 'CuriousMinds', channelIcon: '\uD83D\uDD2C', views: '12M', time: '41:03', uploaded: '3 weeks ago', likes: '890K', dislikes: '7.8K', thumb: '\uD83D\uDCE6', category: 'science', desc: 'A fully functioning 4-bit CPU made entirely from cardboard, paper clips, and LEDs. It can add numbers up to 15!' },
  { id: 10, title: 'Making Ramen From Absolute Zero', channel: 'PixelKitchen', channelIcon: '\uD83C\uDF73', views: '1.5M', time: '27:33', uploaded: '1 week ago', likes: '102K', dislikes: '1.1K', thumb: '\uD83C\uDF5C', category: 'cook', desc: 'Starting with raw wheat, water from a spring, and homemade soy sauce \u2014 we create ramen completely from scratch. Every single ingredient.' },
  { id: 11, title: 'The Forgotten History of HyperCard', channel: 'RetroTechReview', channelIcon: '\u{1F5A5}\uFE0F', views: '890K', time: '38:20', uploaded: '2 weeks ago', likes: '71K', dislikes: '560', thumb: '\uD83C\uDCCF', category: 'tech', desc: 'HyperCard was the world\u2019s first widely-used hypermedia system. It inspired the web, and then Apple killed it. Here\u2019s the full story.' },
  { id: 12, title: 'Lo-Fi Hip Hop \u2014 Rainy Day Study Session', channel: 'SynthwaveRadio', channelIcon: '\uD83C\uDFB9', views: '8.9M', time: '2:15:44', uploaded: '1 month ago', likes: '560K', dislikes: '3.2K', thumb: '\uD83C\uDF27\uFE0F', category: 'music', desc: 'Over two hours of relaxing lo-fi beats for studying, reading, or just vibing on a rainy afternoon.' },
];

export const COMMENTS: YtComment[] = [
  { user: 'MacFan1984', icon: '\uD83E\uDDD1\u200D\uD83D\uDCBB', text: 'This brings back so many memories. System 7 was truly ahead of its time.', time: '2 hours ago', likes: 342 },
  { user: 'PixelNostalgic', icon: '\uD83D\uDC7E', text: 'I can hear the startup chime just watching this. Incredible work!', time: '5 hours ago', likes: 218 },
  { user: 'RetroCollector', icon: '\uD83D\uDCFC', text: 'I have three of these in my garage. Maybe it\u2019s time to restore one.', time: '1 day ago', likes: 156 },
  { user: 'TechHistorian', icon: '\uD83D\uDCDA', text: 'The attention to detail here is unmatched. Subscribed immediately.', time: '1 day ago', likes: 89 },
  { user: 'AnalogDreams', icon: '\uD83D\uDCFB', text: 'They don\u2019t make them like this anymore. Beautiful craftsmanship.', time: '2 days ago', likes: 67 },
  { user: 'VintageVibes', icon: '\uD83C\uDF9E\uFE0F', text: 'Watching this on my actual Macintosh Plus. Meta!', time: '3 days ago', likes: 1204 },
];
