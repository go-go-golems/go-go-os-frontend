import { describe, expect, it } from 'vitest';
import {
  createMacSlidesStateSeed,
  macSlidesActions,
  macSlidesReducer,
} from './macSlidesState';

describe('macSlidesState', () => {
  it('creates a normalized seed', () => {
    expect(
      createMacSlidesStateSeed({
        initialMarkdown: '# Demo',
        initialSlide: -3,
        paletteOpen: true,
      }),
    ).toEqual({
      initialized: true,
      markdown: '# Demo',
      currentSlide: 0,
      paletteOpen: true,
      presentationOpen: false,
    });
  });

  it('updates markdown and ui flags', () => {
    const seeded = createMacSlidesStateSeed({
      initialMarkdown: '# Start',
    });

    const state = macSlidesReducer(
      seeded,
      macSlidesActions.replaceState({
        ...seeded,
        currentSlide: 2,
        paletteOpen: true,
        presentationOpen: true,
      }),
    );

    expect(
      macSlidesReducer(
        state,
        macSlidesActions.setMarkdown('# Updated'),
      ),
    ).toMatchObject({
      markdown: '# Updated',
      currentSlide: 2,
      paletteOpen: true,
      presentationOpen: true,
    });
  });
});
