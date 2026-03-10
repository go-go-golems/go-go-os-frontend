import { mountPathFromObjectPath, type DocObjectPath, type DocsMountPath } from '../../domain/docsObjects';
import { DocBrowserProvider, useDocBrowser } from './DocBrowserContext';
import { DocCenterHome } from './DocCenterHome';
import { DocReaderScreen } from './DocReaderScreen';
import { DocSearchScreen } from './DocSearchScreen';
import { ModuleDocsScreen } from './ModuleDocsScreen';
import { TopicBrowserScreen } from './TopicBrowserScreen';
import './DocBrowserWindow.css';

function DocBrowserToolbar() {
  const { location, canGoBack, goBack, goHome, openSearch, openCollection, openTopicBrowser } = useDocBrowser();
  const activeMountPath =
    location.mountPath ??
    (location.path ? mountPathFromObjectPath(location.path) ?? undefined : undefined);
  const showCollectionBtn = (location.screen === 'reader' || location.screen === 'collection') && activeMountPath;

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
      {showCollectionBtn && (
        <button
          type="button"
          data-part="doc-browser-nav-btn"
          data-state={location.screen === 'collection' ? 'active' : undefined}
          onClick={() => openCollection(activeMountPath!)}
        >
          Collection
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
    case 'collection':
      return location.mountPath ? (
        <ModuleDocsScreen mountPath={location.mountPath} />
      ) : (
        <div data-part="doc-center-home">
          <div data-part="doc-center-message">No collection selected.</div>
        </div>
      );
    case 'reader':
      return location.path ? (
        <DocReaderScreen path={location.path} />
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
  initialScreen?: 'home' | 'search' | 'collection' | 'reader' | 'topic-browser';
  initialMountPath?: DocsMountPath;
  initialPath?: DocObjectPath;
  initialQuery?: string;
  initialTopic?: string;
  onOpenDocNewWindow?: (path: DocObjectPath) => void;
}

export function resolveInitialDocBrowserScreen({
  screen,
  initialMountPath,
  initialPath,
}: {
  screen?: 'home' | 'search' | 'collection' | 'reader' | 'topic-browser';
  initialMountPath?: DocsMountPath;
  initialPath?: DocObjectPath;
}): 'home' | 'search' | 'collection' | 'reader' | 'topic-browser' {
  if (screen) {
    return screen;
  }
  if (initialPath) {
    return 'reader';
  }
  if (initialMountPath) {
    return 'collection';
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
            openDoc(docLinkMenu.target.path);
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
              openDocNewWindow(docLinkMenu.target.path);
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
  initialMountPath,
  initialPath,
  initialQuery,
  initialTopic,
  onOpenDocNewWindow,
}: DocBrowserWindowProps) {
  const resolvedScreen = resolveInitialDocBrowserScreen({
    screen,
    initialMountPath,
    initialPath,
  });
  const initialParams = {
    mountPath: initialMountPath,
    path: initialPath,
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
