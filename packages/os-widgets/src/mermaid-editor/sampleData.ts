import type { MermaidPreset } from './types';

export const MERMAID_PRESETS: MermaidPreset[] = [
  {
    id: 'flowchart',
    label: 'Flowchart',
    code: `graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Do Something]
  B -->|No| D[Do Nothing]
  C --> E[End]
  D --> E`,
  },
  {
    id: 'sequence',
    label: 'Sequence',
    code: `sequenceDiagram
  Alice->>Bob: Hello Bob
  Bob-->>Alice: Hi Alice
  Alice->>Bob: How are you?
  Bob-->>Alice: I am good thanks!`,
  },
  {
    id: 'classDiagram',
    label: 'Class Diagram',
    code: `classDiagram
  Animal <|-- Duck
  Animal <|-- Fish
  Animal : +int age
  Animal : +String gender
  Animal: +isMammal()
  Duck : +String beakColor
  Duck: +swim()
  Fish : +int sizeInFeet
  Fish: +canEat()`,
  },
  {
    id: 'pie',
    label: 'Pie',
    code: `pie title Favorite Pets
  "Dogs" : 45
  "Cats" : 30
  "Birds" : 15
  "Fish" : 10`,
  },
  {
    id: 'gantt',
    label: 'Gantt',
    code: `gantt
  title Project Schedule
  dateFormat YYYY-MM-DD
  section Design
  Wireframes     :a1, 2024-01-01, 7d
  Mockups        :a2, after a1, 5d
  section Dev
  Frontend       :b1, after a2, 10d
  Backend        :b2, after a2, 12d
  section Launch
  Testing        :c1, after b2, 5d
  Deploy         :c2, after c1, 2d`,
  },
];

export const DEFAULT_MERMAID_PRESET = MERMAID_PRESETS[0];
