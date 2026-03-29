export const DEFAULT_MARKDOWN = `<!-- align: center -->
# Welcome to MacSlides
## A Classic Presentation Tool

*Create beautiful slides with Markdown*

---

# Getting Started

Use **Markdown** to write your slides

Separate slides with \`---\`

- Simple and intuitive
- Classic Mac experience
- What you see is what you get

---

# Formatting Guide

## Text Styles
- **Bold** for emphasis
- *Italic* for style
- \`Code\` for technical bits

## Lists work great
1. First point
2. Second point
3. Third point

---

<!-- align: center -->
# Thank You!

*Built with love for the classic Mac*

🖥️ 🍎 💾`;

export function createDenseDeckMarkdown(): string {
  return [
    DEFAULT_MARKDOWN,
    '# Roadmap\n\n- Import widget\n- Clean shell chrome\n- Add CSS parts\n- Add Storybook',
    '<!-- align: left -->\n# Notes\n\n1. Audit state\n2. Audit styles\n3. Add stories\n4. Revisit Redux',
    '<!-- align: center -->\n# Demo Slide\n\n**Centered** preview content\n\n- With\n- Mixed\n- Density',
  ].join('\n---\n');
}

export function createEmptyDeckMarkdown(): string {
  return '';
}
