import { describe, expect, it } from 'vitest';
import { buildDocObjectPath } from '../../domain/docsObjects';
import { buildDocSearchLocation, type DocBrowserState, docBrowserReducer } from './DocBrowserContext';

describe('docBrowserReducer', () => {
  function createState(screen: DocBrowserState['current']['screen']): DocBrowserState {
    return {
      current: { screen },
      history: [],
    };
  }

  it('tracks navigation history across home -> search -> reader', () => {
    const fromHome = createState('home');
    const toSearch = docBrowserReducer(fromHome, {
      type: 'navigate',
      location: { screen: 'search', query: 'inventory' },
    });
    const toReader = docBrowserReducer(toSearch, {
      type: 'navigate',
      location: { screen: 'reader', path: buildDocObjectPath('module', 'inventory', 'overview') },
    });

    expect(toReader.current).toEqual({ screen: 'reader', path: '/docs/objects/module/inventory/overview' });
    expect(toReader.history).toEqual([{ screen: 'home' }, { screen: 'search', query: 'inventory' }]);
  });

  it('returns to previous location on back', () => {
    const state: DocBrowserState = {
      current: { screen: 'reader', path: '/docs/objects/module/inventory/overview' },
      history: [{ screen: 'home' }, { screen: 'search', query: 'inventory' }],
    };

    const next = docBrowserReducer(state, { type: 'back' });

    expect(next.current).toEqual({ screen: 'search', query: 'inventory' });
    expect(next.history).toEqual([{ screen: 'home' }]);
  });

  it('keeps state unchanged when back is pressed with empty history', () => {
    const state = createState('home');

    const next = docBrowserReducer(state, { type: 'back' });

    expect(next).toEqual(state);
  });

  it('builds structured search locations for facet-driven navigation', () => {
    expect(buildDocSearchLocation('inventory')).toEqual({ query: 'inventory' });
    expect(buildDocSearchLocation({ kinds: ['module'], query: '   ' })).toEqual({
      query: undefined,
      searchQuery: {
        query: undefined,
        kinds: ['module'],
        owners: undefined,
        topics: undefined,
        docTypes: undefined,
      },
    });
  });
});
