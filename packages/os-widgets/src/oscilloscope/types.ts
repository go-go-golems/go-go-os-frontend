export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'noise';

export const WAVEFORM_TYPES: WaveformType[] = [
  'sine',
  'square',
  'triangle',
  'sawtooth',
  'noise',
];

export const WAVEFORM_ICONS: Record<WaveformType, string> = {
  sine: '∿',
  square: '⊓',
  triangle: '△',
  sawtooth: '⫽',
  noise: '~',
};
