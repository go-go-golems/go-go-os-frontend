import { assertValidAppId } from '../contracts/appManifest';

export interface ParsedAppKey {
  appId: string;
  instanceId: string;
}

function assertValidInstanceId(instanceId: string): void {
  const trimmed = instanceId.trim();
  if (trimmed.length === 0) {
    throw new Error('Invalid app key instance id: expected a non-empty instance id.');
  }
  if (trimmed.includes(':')) {
    throw new Error(`Invalid app key instance id "${instanceId}": ':' is not allowed.`);
  }
}

export function formatAppKey(appId: string, instanceId: string): string {
  assertValidAppId(appId);
  assertValidInstanceId(instanceId);
  return `${appId}:${instanceId}`;
}

export function parseAppKey(appKey: string): ParsedAppKey {
  const separatorIndex = appKey.indexOf(':');
  if (separatorIndex <= 0) {
    throw new Error(`Invalid app key "${appKey}": expected format <appId>:<instanceId>.`);
  }
  const appId = appKey.slice(0, separatorIndex);
  const instanceId = appKey.slice(separatorIndex + 1);
  assertValidAppId(appId);
  assertValidInstanceId(instanceId);
  return { appId, instanceId };
}

export function isAppKeyForApp(appKey: string, appId: string): boolean {
  try {
    const parsed = parseAppKey(appKey);
    return parsed.appId === appId;
  } catch {
    return false;
  }
}
