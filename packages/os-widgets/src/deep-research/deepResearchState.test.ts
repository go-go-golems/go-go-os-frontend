import { describe, expect, it } from 'vitest';
import {
  createDeepResearchStateSeed,
  deepResearchActions,
  deepResearchReducer,
} from './deepResearchState';

describe('deepResearchState', () => {
  it('creates a normalized seed', () => {
    expect(
      createDeepResearchStateSeed({
        query: 'agentic search',
        progress: 140,
        academicOnly: true,
      }),
    ).toMatchObject({
      initialized: true,
      query: 'agentic search',
      progress: 100,
      academicOnly: true,
      depthLevel: 'standard',
      webSearch: true,
    });
  });

  it('starts and finishes a research run', () => {
    const seeded = createDeepResearchStateSeed({
      query: 'migration risk',
      initialSteps: [{ type: 'status', text: 'Old step' }],
      report: 'Old report',
      progress: 88,
    });

    const running = deepResearchReducer(seeded, deepResearchActions.startResearchRun());
    const completed = deepResearchReducer(
      deepResearchReducer(
        deepResearchReducer(
          running,
          deepResearchActions.appendStep({ type: 'status', text: 'Scanning sources' }),
        ),
        deepResearchActions.setProgress(42),
      ),
      deepResearchActions.finishResearch('Final report'),
    );

    expect(running).toMatchObject({
      isResearching: true,
      steps: [],
      report: '',
      progress: 0,
      runRevision: 1,
    });
    expect(completed).toMatchObject({
      isResearching: false,
      progress: 100,
      report: 'Final report',
    });
    expect(completed.steps).toEqual([{ type: 'status', text: 'Scanning sources' }]);
  });
});
