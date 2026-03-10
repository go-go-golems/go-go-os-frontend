export {
  appsApi,
  useGetAppsQuery,
  useGetModuleDocsQuery,
  useGetOSDocsQuery,
  useGetReflectionQuery,
  useLazyGetModuleDocQuery,
} from './api/appsApi';
export { docsRegistry, DocsRegistry } from './domain/docsRegistry';
export {
  createHelpDocsMount,
  createModuleDocsMount,
  createVmmetaCardDocsMount,
  createVmmetaPackDocsMount,
  registerDefaultDocsMounts,
} from './domain/docsMountAdapters';
export { createDocsCatalogStore, docsCatalogStore, serializeDocsSearchQuery, useDocsCatalogSnapshot } from './domain/docsCatalogStore';
// Components
export { AppIcon } from './components/AppIcon';
export { AppsFolderWindow } from './components/AppsFolderWindow';
export { GetInfoWindow } from './components/GetInfoWindow';
export { HealthDashboardWindow } from './components/HealthDashboardWindow';
export { ModuleBrowserWindow } from './components/ModuleBrowserWindow';
export type {
  AppManifestDocsHint,
  AppManifestDocument,
  AppsManifestResponse,
  DocObject,
  DocObjectKind,
  DocObjectPath,
  DocObjectSummary,
  DocsMount,
  DocsMountPath,
  DocsResolveMatch,
  DocsSearchQuery,
  ModuleDocDocument,
  ModuleDocsTOCResponse,
  ModuleReflectionDocument,
  OSDocFacet,
  OSDocModuleFacet,
  OSDocResult,
  OSDocsQuery,
  OSDocsResponse,
  ReflectionAPI,
  ReflectionCapability,
  ReflectionSchemaRef,
} from './domain/types';
export {
  buildDocObjectPath,
  buildDocsMountPath,
  isDocObjectPath,
  matchesDocsSearchQuery,
  mountPathFromObjectPath,
  parseDocsObjectPath,
} from './domain/docsObjects';
export { appsBrowserReducer, appsBrowserSlice } from './features/appsBrowser/appsBrowserSlice';
