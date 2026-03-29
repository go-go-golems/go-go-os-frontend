import type { ReactNode } from 'react';
import type { RuntimePackageDefinition } from './runtime-packages';
import type { RuntimeSurfaceTypeDefinition } from './runtime-packs';

export const TEST_UI_RUNTIME_PACKAGE: RuntimePackageDefinition = {
  packageId: 'ui',
  version: 'test',
  installPrelude: `
const __ui = {
  text(content) { return { kind: 'text', text: String(content) }; },
  button(label, props = {}) { return { kind: 'button', props: { label: String(label), ...props } }; },
  column(children = []) { return { kind: 'column', children: Array.isArray(children) ? children : [] }; },
  panel(children = []) { return { kind: 'panel', children: Array.isArray(children) ? children : [] }; },
};
globalThis.registerRuntimePackageApi('ui', { ui: __ui });
`.trim(),
  surfaceTypes: ['ui.card.v1'],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function renderTestNode(node: unknown, keyHint: string): ReactNode {
  if (!isRecord(node) || typeof node.kind !== 'string') {
    return null;
  }

  if (node.kind === 'panel' || node.kind === 'column') {
    const children = Array.isArray(node.children) ? node.children : [];
    return (
      <div key={keyHint}>
        {children.map((child, index) => renderTestNode(child, `${keyHint}:${index}`))}
      </div>
    );
  }

  if (node.kind === 'text' && typeof node.text === 'string') {
    return <span key={keyHint}>{node.text}</span>;
  }

  if (node.kind === 'button' && isRecord(node.props) && typeof node.props.label === 'string') {
    return <button key={keyHint}>{node.props.label}</button>;
  }

  return null;
}

export const TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE: RuntimeSurfaceTypeDefinition<unknown> = {
  packId: 'ui.card.v1',
  validateTree: (value) => value,
  render: ({ tree }) => <>{renderTestNode(tree, 'test-ui-root')}</>,
};
