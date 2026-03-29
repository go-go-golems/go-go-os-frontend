import { describe, expect, it } from 'vitest';
import {
  createMacBrowserStateSeed,
  macBrowserActions,
  macBrowserReducer,
} from './macBrowserState';

describe('macBrowserState', () => {
  it('creates seeded state', () => {
    const state = createMacBrowserStateSeed({
      url: 'mac://about',
      editing: true,
      editContent: '# Draft',
    });
    expect(state.url).toBe('mac://about');
    expect(state.editing).toBe(true);
    expect(state.editContent).toBe('# Draft');
  });

  it('navigates and saves custom pages', () => {
    let state = createMacBrowserStateSeed();
    state = macBrowserReducer(state, macBrowserActions.navigate('mac://help'));
    state = macBrowserReducer(
      state,
      macBrowserActions.saveCustomPage({ url: 'mac://custom-test', content: '# Custom' }),
    );
    expect(state.url).toBe('mac://custom-test');
    expect(state.customPages['mac://custom-test']).toBe('# Custom');
  });
});
