import type { GraphNavNode, GraphNavEdge } from './types';

export const SAMPLE_NODES: GraphNavNode[] = [
  { id: 'n1', label: 'Alice', type: 'Person', props: { age: 32, role: 'Engineer', city: 'San Francisco' } },
  { id: 'n2', label: 'Bob', type: 'Person', props: { age: 28, role: 'Designer', city: 'New York' } },
  { id: 'n3', label: 'Acme Corp', type: 'Company', props: { founded: 2015, industry: 'Tech', employees: 240 } },
  { id: 'n4', label: 'GraphDB', type: 'Project', props: { language: 'Rust', stars: 4200, status: 'Active' } },
  { id: 'n5', label: 'WebApp', type: 'Project', props: { language: 'TypeScript', stars: 1800, status: 'Active' } },
  { id: 'n6', label: 'Carol', type: 'Person', props: { age: 45, role: 'CTO', city: 'Austin' } },
  { id: 'n7', label: 'Dave', type: 'Person', props: { age: 37, role: 'PM', city: 'Seattle' } },
  { id: 'n8', label: 'Neo Systems', type: 'Company', props: { founded: 2008, industry: 'Database', employees: 580 } },
  { id: 'n9', label: 'ML Pipeline', type: 'Project', props: { language: 'Python', stars: 7600, status: 'Archived' } },
  { id: 'n10', label: 'Eve', type: 'Person', props: { age: 29, role: 'Data Scientist', city: 'Boston' } },
  { id: 'n11', label: 'Frank', type: 'Person', props: { age: 41, role: 'Architect', city: 'Denver' } },
  { id: 'n12', label: 'Vertex AI', type: 'Company', props: { founded: 2020, industry: 'AI/ML', employees: 90 } },
];

export const SAMPLE_EDGES: GraphNavEdge[] = [
  { source: 'n1', target: 'n3', label: 'WORKS_AT' },
  { source: 'n2', target: 'n3', label: 'WORKS_AT' },
  { source: 'n6', target: 'n3', label: 'LEADS' },
  { source: 'n1', target: 'n4', label: 'CONTRIBUTES' },
  { source: 'n2', target: 'n5', label: 'CONTRIBUTES' },
  { source: 'n1', target: 'n2', label: 'KNOWS' },
  { source: 'n1', target: 'n6', label: 'REPORTS_TO' },
  { source: 'n7', target: 'n3', label: 'WORKS_AT' },
  { source: 'n7', target: 'n5', label: 'MANAGES' },
  { source: 'n6', target: 'n8', label: 'ADVISES' },
  { source: 'n8', target: 'n4', label: 'SPONSORS' },
  { source: 'n10', target: 'n9', label: 'CONTRIBUTES' },
  { source: 'n10', target: 'n12', label: 'WORKS_AT' },
  { source: 'n11', target: 'n8', label: 'WORKS_AT' },
  { source: 'n11', target: 'n4', label: 'CONTRIBUTES' },
  { source: 'n6', target: 'n11', label: 'KNOWS' },
  { source: 'n10', target: 'n1', label: 'KNOWS' },
  { source: 'n12', target: 'n9', label: 'SPONSORS' },
  { source: 'n7', target: 'n2', label: 'KNOWS' },
];

export const NODE_FILTER_TYPES = ['All', 'Person', 'Company', 'Project'] as const;
