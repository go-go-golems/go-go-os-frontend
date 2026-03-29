export interface PluginRuntimeBundleConfig {
  packageIds: string[];
  bundleCode: string;
  capabilities?: {
    domain?: 'all' | string[];
    system?: 'all' | string[];
  };
}

export interface RuntimeSurfaceMeta {
  id: string;
  type: string;
  title?: string;
  icon?: string;
  ui: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface RuntimeBundleDefinition {
  id: string;
  name: string;
  icon: string;
  homeSurface: string;
  plugin: PluginRuntimeBundleConfig;
  surfaces: Record<string, RuntimeSurfaceMeta>;
}
