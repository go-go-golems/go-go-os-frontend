import { DocBrowserProvider, useDocBrowser } from './DocBrowserContext';
import { DocCenterHome } from './DocCenterHome';
import { DocReaderScreen } from './DocReaderScreen';
import { DocSearchScreen } from './DocSearchScreen';
import { ModuleDocsScreen } from './ModuleDocsScreen';
import { TopicBrowserScreen } from './TopicBrowserScreen';
import './DocBrowserWindow.css';

function DocBrowserToolbar() {
  const { location, canGoBack, goBack, goHome, openSearch, openModuleDocs, openTopicBrowser } = useDocBrowser();

  const showModuleBtn = (location.screen === 'reader' || location.screen === 'module-docs') && location.moduleId;

  return (
    <div data-part="doc-browser-toolbar">
      <button
        type="button"
        data-part="doc-browser-nav-btn"
        onClick={goBack}
        disabled={!canGoBack}
        aria-label="Back"
      >
        {'\u25C0'}
      </button>
      <button
        type="button"
        data-part="doc-browser-nav-btn"
        data-state={location.screen === 'home' ? 'active' : undefined}
        onClick={goHome}
      >
        Home
      </button>
      <button
        type="button"
        data-part="doc-browser-nav-btn"
        data-state={location.screen === 'search' ? 'active' : undefined}
        onClick={() => openSearch()}
      >
        Search
      </button>
      <button
        type="button"
        data-part="doc-browser-nav-btn"
        data-state={location.screen === 'topic-browser' ? 'active' : undefined}
        onClick={() => openTopicBrowser()}
      >
        Topics
      </button>
      {showModuleBtn && (
        <button
          type="button"
          data-part="doc-browser-nav-btn"
          data-state={location.screen === 'module-docs' ? 'active' : undefined}
          onClick={() => openModuleDocs(location.moduleId!)}
        >
          Module
        </button>
      )}
      <div data-part="doc-browser-toolbar-spacer" />
    </div>
  );
}

function DocBrowserScreenRouter() {
  const { location } = useDocBrowser();

  switch (location.screen) {
    case 'home':
      return <DocCenterHome />;
    case 'search':
      return <DocSearchScreen initialQuery={location.query} />;
    case 'module-docs':
      return location.moduleId ? (
        <ModuleDocsScreen moduleId={location.moduleId} />
      ) : (
        <div data-part="doc-center-home">
          <div data-part="doc-center-message">No module selected.</div>
        </div>
      );
    case 'reader':
      return location.moduleId && location.slug ? (
        <DocReaderScreen moduleId={location.moduleId} slug={location.slug} />
      ) : (
        <div data-part="doc-center-home">
          <div data-part="doc-center-message">No document selected.</div>
        </div>
      );
    case 'topic-browser':
      return <TopicBrowserScreen initialTopic={location.topic} />;
  }
}

export interface DocBrowserWindowProps {
  initialScreen?: 'home' | 'search' | 'module-docs' | 'reader' | 'topic-browser';
  initialModuleId?: string;
  initialSlug?: string;
  initialQuery?: string;
  initialTopic?: string;
  onOpenDocNewWindow?: (moduleId: string, slug: string) => void;
}

export function resolveInitialDocBrowserScreen({
  screen,
  initialModuleId,
  initialSlug,
}: {
  screen?: 'home' | 'search' | 'module-docs' | 'reader' | 'topic-browser';
  initialModuleId?: string;
  initialSlug?: string;
}): 'home' | 'search' | 'module-docs' | 'reader' | 'topic-browser' {
  if (screen) {
    return screen;
  }
  if (initialModuleId && initialSlug) {
    return 'reader';
  }
  if (initialModuleId) {
    return 'module-docs';
  }
  return 'home';
}

function DocLinkContextMenu() {
  const { docLinkMenu, closeDocLinkMenu, openDoc, openDocNewWindow } = useDocBrowser();

  if (!docLinkMenu) return null;

  return (
    <>
      <div data-part="doc-link-menu-backdrop" onClick={closeDocLinkMenu} onContextMenu={(e) => { e.preventDefault(); closeDocLinkMenu(); }} />
      <div
        data-part="doc-link-menu"
        style={{ left: docLinkMenu.x, top: docLinkMenu.y }}
      >
        <button
          type="button"
          data-part="doc-link-menu-item"
          onClick={() => {
            openDoc(docLinkMenu.target.moduleId, docLinkMenu.target.slug);
            closeDocLinkMenu();
          }}
        >
          Open in This Window
        </button>
        {openDocNewWindow && (
          <button
            type="button"
            data-part="doc-link-menu-item"
            onClick={() => {
              openDocNewWindow(docLinkMenu.target.moduleId, docLinkMenu.target.slug);
              closeDocLinkMenu();
            }}
          >
            Open in New Window
          </button>
        )}
      </div>
    </>
  );
}

export function DocBrowserWindow({
  initialScreen: screen,
  initialModuleId,
  initialSlug,
  initialQuery,
  initialTopic,
  onOpenDocNewWindow,
}: DocBrowserWindowProps) {
  const resolvedScreen = resolveInitialDocBrowserScreen({
    screen,
    initialModuleId,
    initialSlug,
  });
  const initialParams = {
    moduleId: initialModuleId,
    slug: initialSlug,
    query: initialQuery,
    topic: initialTopic,
  };

  return (
    <DocBrowserProvider initialScreen={resolvedScreen} initialParams={initialParams} onOpenDocNewWindow={onOpenDocNewWindow}>
      <div data-part="doc-browser">
        <DocBrowserToolbar />
        <div data-part="doc-browser-content">
          <DocBrowserScreenRouter />
        </div>
        <DocLinkContextMenu />
      </div>
    </DocBrowserProvider>
  );
}
