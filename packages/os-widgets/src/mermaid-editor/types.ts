export type MermaidPresetId =
  | 'flowchart'
  | 'sequence'
  | 'classDiagram'
  | 'pie'
  | 'gantt';

export interface MermaidPreset {
  id: MermaidPresetId;
  label: string;
  code: string;
}
