export type DepthLevel = 'quick' | 'standard' | 'thorough';

export interface StatusStep {
  type: 'status';
  text: string;
}

export interface SourceStep {
  type: 'source';
  title: string;
  url: string;
  snippet: string;
}

export interface ThinkingStep {
  type: 'thinking';
  text: string;
}

export interface DoneStep {
  type: 'done';
}

export type ResearchStep = StatusStep | SourceStep | ThinkingStep | DoneStep;

export const DEPTH_LEVELS: { value: DepthLevel; label: string; time: string }[] = [
  { value: 'quick', label: 'Quick', time: '~2 min' },
  { value: 'standard', label: 'Standard', time: '~5 min' },
  { value: 'thorough', label: 'Thorough', time: '~15 min' },
];
