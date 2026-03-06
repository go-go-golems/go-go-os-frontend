import type { Meta, StoryObj } from '@storybook/react';
import { MacWrite } from './MacWrite';
import { SAMPLE_DOCUMENT } from './sampleData';
import { fixedFrameDecorator, fullscreenDecorator } from '../storybook/frameDecorators';
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

const meetingNotes = `# Weekly Sync

## Decisions

- Move search state into a seedable store wrapper.
- Collapse duplicate toolbar selectors into the shared primitive layer.
- Add state-specific stories before Redux migration.

## Follow-up

1. Audit all widgets.
2. Expand Storybook coverage.
3. Migrate cross-window state into Redux slices.
`;

const markdownEdgeCases = `# Edge Cases

> Blockquotes should still feel native to the widget chrome.

## Mixed formatting

This sentence uses **bold**, *italics*, \`inline code\`, and ~~strikethrough~~ in one line.

### Checklist

- [x] Story frames are shared
- [ ] Search and modal states are externally seedable
- [ ] Redux-backed scenarios cover cross-widget behavior

\`\`\`json
{
  "state": "draft",
  "stories": 7,
  "widget": "MacWrite"
}
\`\`\`
`;

export const Default: Story = {
  args: {
    initialContent: SAMPLE_DOCUMENT,
  },
  decorators: [fullscreenDecorator],
};

export const Empty: Story = {
  args: {
    initialContent: '',
  },
  decorators: [fullscreenDecorator],
};

export const EditOnly: Story = {
  args: {
    initialContent: SAMPLE_DOCUMENT,
    initialViewMode: 'edit',
  },
  decorators: [fullscreenDecorator],
};

export const PreviewOnly: Story = {
  args: {
    initialContent: SAMPLE_DOCUMENT,
    initialViewMode: 'preview',
  },
  decorators: [fullscreenDecorator],
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
  decorators: [fullscreenDecorator],
};

export const LongDocument: Story = {
  args: {
    initialContent: Array.from(
      { length: 20 },
      (_, i) =>
        `## Section ${i + 1}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.\n\n- Item ${i * 3 + 1}\n- Item ${i * 3 + 2}\n- Item ${i * 3 + 3}\n`,
    ).join('\n'),
  },
  decorators: [fullscreenDecorator],
};

export const MeetingNotes: Story = {
  args: {
    initialContent: meetingNotes,
  },
  decorators: [fullscreenDecorator],
};

export const MarkdownEdgeCases: Story = {
  args: {
    initialContent: markdownEdgeCases,
  },
  decorators: [fullscreenDecorator],
};

export const CompactPreview: Story = {
  args: {
    initialContent: meetingNotes,
    initialViewMode: 'preview',
  },
  decorators: [fixedFrameDecorator(760, 420)],
};
