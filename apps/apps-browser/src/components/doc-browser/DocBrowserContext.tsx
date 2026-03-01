import { createContext, useCallback, useContext, useMemo, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import type { DocLinkTarget } from './docLinkInteraction';

export type DocBrowserScreen = 'home' | 'search' | 'module-docs' | 'reader' | 'topic-browser';

export interface DocBrowserLocation {
  screen: DocBrowserScreen;
  moduleId?: string;
  slug?: string;
  query?: string;
  topic?: string;
}

export interface DocBrowserState {
  current: DocBrowserLocation;
  history: DocBrowserLocation[];
}

export type DocBrowserAction =
  | { type: 'navigate'; location: DocBrowserLocation }
  | { type: 'back' };

export function docBrowserReducer(state: DocBrowserState, action: DocBrowserAction): DocBrowserState {
  switch (action.type) {
    case 'navigate':
      return {
        current: action.location,
        history: [...state.history, state.current],
      };
    case 'back': {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        current: prev,
        history: state.history.slice(0, -1),
      };
    }
  }
}

export interface DocLinkMenuState {
  x: number;
  y: number;
  target: DocLinkTarget;
}

interface DocBrowserContextValue {
  location: DocBrowserLocation;
  canGoBack: boolean;
  navigateTo: (screen: DocBrowserScreen, params?: Omit<DocBrowserLocation, 'screen'>) => void;
  goBack: () => void;
  goHome: () => void;
  openSearch: (query?: string) => void;
  openModuleDocs: (moduleId: string) => void;
  openDoc: (moduleId: string, slug: string) => void;
  openTopicBrowser: (topic?: string) => void;
  openDocNewWindow?: (moduleId: string, slug: string) => void;
  docLinkMenu: DocLinkMenuState | null;
  showDocLinkMenu: (x: number, y: number, target: DocLinkTarget) => void;
  closeDocLinkMenu: () => void;
}

const DocBrowserContext = createContext<DocBrowserContextValue | null>(null);

export function useDocBrowser(): DocBrowserContextValue {
  const ctx = useContext(DocBrowserContext);
  if (!ctx) {
    throw new Error('useDocBrowser must be used within DocBrowserProvider');
  }
  return ctx;
}

export interface DocBrowserProviderProps {
  initialScreen?: DocBrowserScreen;
  initialParams?: Omit<DocBrowserLocation, 'screen'>;
  onOpenDocNewWindow?: (moduleId: string, slug: string) => void;
  children: ReactNode;
}

export function DocBrowserProvider({ initialScreen = 'home', initialParams, onOpenDocNewWindow, children }: DocBrowserProviderProps) {
  const [state, dispatch] = useReducer(docBrowserReducer, {
    current: { screen: initialScreen, ...initialParams },
    history: [],
  });
  const [docLinkMenu, setDocLinkMenu] = useState<DocLinkMenuState | null>(null);

  const navigateTo = useCallback(
    (screen: DocBrowserScreen, params?: Omit<DocBrowserLocation, 'screen'>) => {
      dispatch({ type: 'navigate', location: { screen, ...params } });
    },
    [],
  );

  const goBack = useCallback(() => dispatch({ type: 'back' }), []);

  const goHome = useCallback(() => {
    dispatch({ type: 'navigate', location: { screen: 'home' } });
  }, []);

  const openSearch = useCallback(
    (query?: string) => {
      dispatch({ type: 'navigate', location: { screen: 'search', query } });
    },
    [],
  );

  const openModuleDocs = useCallback(
    (moduleId: string) => {
      dispatch({ type: 'navigate', location: { screen: 'module-docs', moduleId } });
    },
    [],
  );

  const openDoc = useCallback(
    (moduleId: string, slug: string) => {
      dispatch({ type: 'navigate', location: { screen: 'reader', moduleId, slug } });
    },
    [],
  );

  const openTopicBrowser = useCallback(
    (topic?: string) => {
      dispatch({ type: 'navigate', location: { screen: 'topic-browser', topic } });
    },
    [],
  );

  const showDocLinkMenu = useCallback(
    (x: number, y: number, target: DocLinkTarget) => {
      setDocLinkMenu({ x, y, target });
    },
    [],
  );

  const closeDocLinkMenu = useCallback(() => {
    setDocLinkMenu(null);
  }, []);

  const value = useMemo<DocBrowserContextValue>(
    () => ({
      location: state.current,
      canGoBack: state.history.length > 0,
      navigateTo,
      goBack,
      goHome,
      openSearch,
      openModuleDocs,
      openDoc,
      openTopicBrowser,
      openDocNewWindow: onOpenDocNewWindow,
      docLinkMenu,
      showDocLinkMenu,
      closeDocLinkMenu,
    }),
    [state.current, state.history.length, navigateTo, goBack, goHome, openSearch, openModuleDocs, openDoc, openTopicBrowser, onOpenDocNewWindow, docLinkMenu, showDocLinkMenu, closeDocLinkMenu],
  );

  return <DocBrowserContext.Provider value={value}>{children}</DocBrowserContext.Provider>;
}
