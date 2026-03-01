import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppManifestDocument, ModuleDocsTOCResponse } from '../domain/types';
import { MOCK_INVENTORY } from '../mocks/fixtures/apps';
import { GetInfoWindow } from './GetInfoWindow';

const useGetReflectionQueryMock = vi.fn();
const useGetModuleDocsQueryMock = vi.fn();

vi.mock('../api/appsApi', () => ({
  useGetReflectionQuery: (...args: unknown[]) => useGetReflectionQueryMock(...args),
  useGetModuleDocsQuery: (...args: unknown[]) => useGetModuleDocsQueryMock(...args),
}));

function render(app: AppManifestDocument): string {
  return renderToStaticMarkup(<GetInfoWindow app={app} />);
}

describe('GetInfoWindow docs states', () => {
  beforeEach(() => {
    useGetReflectionQueryMock.mockReset();
    useGetModuleDocsQueryMock.mockReset();

    useGetReflectionQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    useGetModuleDocsQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: undefined,
    });
  });

  it('renders docs-unavailable state when docs hint is absent/disabled', () => {
    const app: AppManifestDocument = {
      ...MOCK_INVENTORY,
      docs: { available: false },
    };

    const html = render(app);

    expect(html).toContain('Documentation');
    expect(html).toContain('This module does not publish structured docs metadata yet.');
    expect(useGetModuleDocsQueryMock).not.toHaveBeenCalled();
  });

  it('renders docs-available state with navigable doc links', () => {
    const toc: ModuleDocsTOCResponse = {
      module_id: 'inventory',
      docs: [
        {
          module_id: 'inventory',
          slug: 'overview',
          title: 'Inventory Overview',
          doc_type: 'overview',
          summary: 'High-level module map.',
        },
        {
          module_id: 'inventory',
          slug: 'api-reference',
          title: 'Inventory API Reference',
          doc_type: 'api-reference',
          summary: 'API contract details.',
        },
      ],
    };

    useGetModuleDocsQueryMock.mockReturnValue({
      data: toc,
      isLoading: false,
      isError: false,
      error: undefined,
    });

    const html = render(MOCK_INVENTORY);

    expect(html).toContain('Yes (v1)');
    expect(html).toContain('Pages:</dt><dd>2');
    expect(html).toContain('href="/api/apps/inventory/docs/overview"');
    expect(html).toContain('href="/api/apps/inventory/docs/api-reference"');
    expect(html).toContain('Inventory Overview');
    expect(html).toContain('Inventory API Reference');
  });

  it('renders docs-endpoint error state when docs query fails', () => {
    useGetModuleDocsQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500 },
    });

    const html = render(MOCK_INVENTORY);

    expect(html).toContain('Documentation');
    expect(html).toContain('Docs endpoint failed: Request failed (500)');
  });
});
