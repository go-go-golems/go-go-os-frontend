import { describe, expect, it, vi } from 'vitest';
import { ConfirmApiError } from '../api/confirmApiClient';
import type { ConfirmApiClient, ConfirmRequest } from '../types';
import { reconcileSubmitConflict409 } from './reconcileSubmitConflict409';

function createRequest(overrides?: Partial<ConfirmRequest>): ConfirmRequest {
  return {
    id: overrides?.id ?? 'req-1',
    sessionId: 'global',
    widgetType: 'confirm',
    status: overrides?.status,
    completedAt: overrides?.completedAt,
  };
}

function createApiClient(getRequestImpl: ConfirmApiClient['getRequest']): ConfirmApiClient {
  return {
    getRequest: getRequestImpl,
    submitResponse: async () => null,
    submitScriptEvent: async () => null,
    touchRequest: async () => {},
  };
}

describe('reconcileSubmitConflict409', () => {
  it('returns false for non-409 errors', async () => {
    const dispatch = vi.fn();
    const closeRequestWindow = vi.fn();
    const apiClient = createApiClient(async () => createRequest({ status: 'completed' }));

    const handled = await reconcileSubmitConflict409({
      requestId: 'req-1',
      error: new Error('boom'),
      apiClient,
      dispatch,
      closeRequestWindow,
    });

    expect(handled).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
    expect(closeRequestWindow).not.toHaveBeenCalled();
  });

  it('completes and closes with latest request when refetch shows non-pending', async () => {
    const dispatch = vi.fn();
    const closeRequestWindow = vi.fn();
    const apiClient = createApiClient(async () =>
      createRequest({ id: 'req-latest', status: 'completed', completedAt: '2026-02-24T12:00:00Z' }),
    );

    const handled = await reconcileSubmitConflict409({
      requestId: 'req-1',
      error: new ConfirmApiError(409, 'already completed'),
      apiClient,
      dispatch,
      closeRequestWindow,
      now: () => '2026-02-24T13:00:00Z',
    });

    expect(handled).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'confirmRuntime/completeRequestById',
      payload: {
        requestId: 'req-latest',
        completedAt: '2026-02-24T12:00:00Z',
      },
    });
    expect(closeRequestWindow).toHaveBeenCalledWith('req-latest');
  });

  it('falls back to local remove-and-close when latest still pending', async () => {
    const dispatch = vi.fn();
    const closeRequestWindow = vi.fn();
    const apiClient = createApiClient(async () => createRequest({ status: 'pending' }));

    const handled = await reconcileSubmitConflict409({
      requestId: 'req-1',
      error: new ConfirmApiError(409, 'conflict'),
      apiClient,
      dispatch,
      closeRequestWindow,
    });

    expect(handled).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'confirmRuntime/removeRequest',
      payload: 'req-1',
    });
    expect(closeRequestWindow).toHaveBeenCalledWith('req-1');
  });

  it('falls back to local remove-and-close when refetch fails', async () => {
    const dispatch = vi.fn();
    const closeRequestWindow = vi.fn();
    const apiClient = createApiClient(async () => {
      throw new Error('network down');
    });

    const handled = await reconcileSubmitConflict409({
      requestId: 'req-1',
      error: new ConfirmApiError(409, 'conflict'),
      apiClient,
      dispatch,
      closeRequestWindow,
    });

    expect(handled).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'confirmRuntime/removeRequest',
      payload: 'req-1',
    });
    expect(closeRequestWindow).toHaveBeenCalledWith('req-1');
  });
});
