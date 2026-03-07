export interface ChatProfileSelection {
  profile?: string;
  registry?: string;
}

export type ChatProfilePolicy =
  | { kind: 'none' }
  | { kind: 'fixed'; profile: string }
  | { kind: 'selectable'; scopeKey?: string };

export interface ChatProfileListItem {
  slug: string;
  display_name?: string;
  description?: string;
  default_prompt?: string;
  extensions?: Record<string, unknown>;
  is_default?: boolean;
  version?: number;
}

export interface ChatProfileDocument {
  registry: string;
  slug: string;
  display_name?: string;
  description?: string;
  runtime?: Record<string, unknown>;
  policy?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
  is_default: boolean;
}

export interface ChatMiddlewareSchemaDocument {
  name: string;
  version: number;
  display_name?: string;
  description?: string;
  schema: Record<string, unknown>;
}

export interface ChatExtensionSchemaDocument {
  key: string;
  schema: Record<string, unknown>;
}
