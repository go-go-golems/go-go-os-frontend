import type { Meta, StoryObj } from '@storybook/react';
import { MacWrite } from './MacWrite';
import { SAMPLE_DOCUMENT } from './sampleData';
import '@hypercard/rich-widgets/theme';

const meta: Meta<typeof MacWrite> = {
  title: 'RichWidgets/MacWrite',
  component: MacWrite,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MacWrite>;

export const Default: Story = {
  args: {
    initialContent: SAMPLE_DOCUMENT,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  args: {
    initialContent: '',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const EditOnly: Story = {
  args: {
    initialContent: SAMPLE_DOCUMENT,
    initialViewMode: 'edit',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const PreviewOnly: Story = {
  args: {
    initialContent: SAMPLE_DOCUMENT,
    initialViewMode: 'preview',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const CodeHeavy: Story = {
  args: {
    initialContent: `# Code Documentation

## JavaScript Example

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(\`Fibonacci(10) = \${result}\`);
\`\`\`

## Python Example

\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
\`\`\`

Some \`inline code\` mixed with **bold** and *italic* text.
`,
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const LongDocument: Story = {
  args: {
    initialContent: Array.from(
      { length: 20 },
      (_, i) =>
        `## Section ${i + 1}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.\n\n- Item ${i * 3 + 1}\n- Item ${i * 3 + 2}\n- Item ${i * 3 + 3}\n`,
    ).join('\n'),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};
