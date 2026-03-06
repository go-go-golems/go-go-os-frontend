const MERMAID_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js';

interface MermaidApi {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, code: string) => Promise<{ svg: string }>;
}

declare global {
  interface Window {
    mermaid?: MermaidApi;
  }
}

let mermaidLoader: Promise<MermaidApi> | null = null;

export function loadMermaid(): Promise<MermaidApi> {
  if (window.mermaid) {
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });
    return Promise.resolve(window.mermaid);
  }

  if (!mermaidLoader) {
    mermaidLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = MERMAID_CDN;
      script.async = true;
      script.onload = () => {
        if (!window.mermaid) {
          reject(new Error('Mermaid failed to initialize'));
          return;
        }
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });
        resolve(window.mermaid);
      };
      script.onerror = () => reject(new Error('Failed to load Mermaid runtime'));
      document.head.appendChild(script);
    });
  }

  return mermaidLoader;
}

export async function renderMermaidDiagram(code: string, renderId: string) {
  const mermaid = await loadMermaid();
  return mermaid.render(renderId, code);
}
