import type { RuntimeBundleDefinition } from '@go-go-golems/os-core';
import type { Reducer } from '@reduxjs/toolkit';
import type { LaunchableAppModule } from './launchableAppModule';

export interface FederatedAppHostContract {
  remoteId: string;
  launcherModule: LaunchableAppModule;
  sharedReducers?: Record<string, Reducer>;
  docsMetadata?: Record<string, unknown>;
  runtimeBundles?: readonly RuntimeBundleDefinition[];
}
