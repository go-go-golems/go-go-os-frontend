import type { ConfirmApiClient } from '../types';
import { ConfirmApiError } from '../api/confirmApiClient';
import { completeRequestById, removeRequest, type ConfirmRuntimeAnyAction } from '../state/confirmRuntimeSlice';

export interface ReconcileSubmitConflict409Options {
  requestId: string;
  error: unknown;
  apiClient: ConfirmApiClient;
  dispatch: (action: ConfirmRuntimeAnyAction) => void;
  closeRequestWindow: (requestId: string) => void;
  now?: () => string;
}

export async function reconcileSubmitConflict409(options: ReconcileSubmitConflict409Options): Promise<boolean> {
  const { requestId, error, apiClient, dispatch, closeRequestWindow } = options;
  const now = options.now ?? (() => new Date().toISOString());
  if (!(error instanceof ConfirmApiError) || error.status !== 409) {
    return false;
  }

  try {
    const latest = await apiClient.getRequest(requestId);
    if (latest.status && latest.status !== 'pending') {
      dispatch(
        completeRequestById({
          requestId: latest.id,
          completedAt: latest.completedAt ?? now(),
        }),
      );
      closeRequestWindow(latest.id);
      return true;
    }
  } catch {
    // Fall back to local cleanup.
  }

  dispatch(removeRequest(requestId));
  closeRequestWindow(requestId);
  return true;
}
