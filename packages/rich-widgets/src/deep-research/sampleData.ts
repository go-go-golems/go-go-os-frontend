import type { ResearchStep } from './types';

export const DEMO_STEPS: ResearchStep[] = [
  { type: 'status', text: 'Formulating research plan...' },
  { type: 'status', text: 'Searching: initial query analysis' },
  {
    type: 'source',
    title: 'Wikipedia \u2014 Overview',
    url: 'en.wikipedia.org/wiki/...',
    snippet:
      'A comprehensive overview of the topic with historical context and key developments.',
  },
  { type: 'status', text: 'Analyzing source content...' },
  {
    type: 'thinking',
    text: 'The initial sources suggest this topic has multiple facets. I need to explore the technical aspects more deeply and find recent developments.',
  },
  {
    type: 'source',
    title: 'Nature \u2014 Recent Study',
    url: 'nature.com/articles/...',
    snippet:
      'Peer-reviewed research published in 2025 presenting new findings in this domain.',
  },
  { type: 'status', text: 'Searching: recent developments 2025' },
  {
    type: 'source',
    title: 'ArXiv \u2014 Technical Paper',
    url: 'arxiv.org/abs/2501...',
    snippet:
      'Pre-print describing a novel approach that significantly improves upon prior methods.',
  },
  {
    type: 'thinking',
    text: 'These papers reveal a clear trend. Let me verify with industry sources and look for contradicting viewpoints to ensure balanced coverage.',
  },
  { type: 'status', text: 'Cross-referencing findings...' },
  {
    type: 'source',
    title: 'MIT Technology Review',
    url: 'technologyreview.com/...',
    snippet:
      'Industry analysis covering practical applications and commercial implications.',
  },
  {
    type: 'source',
    title: 'Stanford HAI Report',
    url: 'hai.stanford.edu/...',
    snippet:
      'Policy perspective addressing societal impact, ethics, and governance frameworks.',
  },
  { type: 'status', text: 'Synthesizing 5 sources into report...' },
  {
    type: 'thinking',
    text: 'I now have sufficient high-quality sources covering technical, practical, and policy dimensions. Synthesizing into a comprehensive report.',
  },
  { type: 'done' },
];

export function generateReport(query: string, depthLevel: string): string {
  return `# Research Report

## Query: "${query}"

Based on analysis of 5 high-quality sources, here is a comprehensive synthesis of findings.

### Key Findings

\u2022 Recent peer-reviewed studies (Nature, 2025) demonstrate significant advances in this area, with measurable improvements over previous approaches.

\u2022 Technical pre-prints on ArXiv propose novel methodologies that address longstanding limitations, showing promise for near-term practical applications.

\u2022 Industry analysis from MIT Technology Review confirms growing commercial interest, with several major organizations investing in implementation.

### Analysis

The convergence of academic research and industry adoption suggests this field is at an inflection point. The Stanford HAI report adds important context about governance and ethical considerations that will shape future development.

### Conclusion

The evidence strongly supports continued momentum in this domain. Key areas to watch include regulatory developments and the transition from research prototypes to production systems.

---
\uD83D\uDCCE 5 sources cited \u00B7 Research depth: ${depthLevel} \u00B7 ${new Date().toLocaleDateString()}`;
}
