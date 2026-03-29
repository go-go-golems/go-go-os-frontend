export type ViewMode = 'edit' | 'split' | 'preview';

export interface FormatAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  category: 'format' | 'heading' | 'insert' | 'view' | 'file';
}

export interface WordCount {
  words: number;
  chars: number;
  lines: number;
}
