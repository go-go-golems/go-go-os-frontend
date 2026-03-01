import { DocBrowserProvider, useDocBrowser } from './DocBrowserContext';
import { DocCenterHome } from './DocCenterHome';
import { DocReaderScreen } from './DocReaderScreen';
import './DocBrowserWindow.css';

function DocBrowserToolbar() {
  const { location, canGoBack, goBack, goHome, openSearch, openModuleDocs } = useDocBrowser();

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
      return <PlaceholderScreen label="Search & Filter" detail={location.query ? `query: "${location.query}"` : undefined} />;
    case 'module-docs':
      return <PlaceholderScreen label="Module Docs" detail={location.moduleId} />;
    case 'reader':
      return location.moduleId && location.slug ? (
        <DocReaderScreen moduleId={location.moduleId} slug={location.slug} />
      ) : (
        <PlaceholderScreen label="Doc Reader" detail="Missing moduleId or slug" />
      );
    case 'topic-browser':
      return <PlaceholderScreen label="Topic Browser" detail={location.topic} />;
  }
}

function PlaceholderScreen({ label, detail }: { label: string; detail?: string }) {
  return (
    <div data-part="doc-center-home">
      <div data-part="doc-center-message">
        {label}
        {detail && (
          <>
            <br />
            <span style={{ fontSize: 10, fontFamily: 'monospace' }}>{detail}</span>
          </>
        )}
        <br />
        <span style={{ fontSize: 10, fontStyle: 'italic' }}>(not yet implemented)</span>
      </div>
    </div>
  );
}

export interface DocBrowserWindowProps {
  initialModuleId?: string;
  initialSlug?: string;
}

export function DocBrowserWindow({ initialModuleId, initialSlug }: DocBrowserWindowProps) {
  const initialScreen = initialModuleId && initialSlug ? 'reader' : initialModuleId ? 'module-docs' : 'home';
  const initialParams = initialModuleId ? { moduleId: initialModuleId, slug: initialSlug } : undefined;

  return (
    <DocBrowserProvider initialScreen={initialScreen} initialParams={initialParams}>
      <div data-part="doc-browser">
        <DocBrowserToolbar />
        <div data-part="doc-browser-content">
          <DocBrowserScreenRouter />
        </div>
      </div>
    </DocBrowserProvider>
  );
}
