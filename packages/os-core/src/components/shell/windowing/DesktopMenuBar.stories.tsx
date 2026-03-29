import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DesktopMenuBar } from './DesktopMenuBar';
import { WINDOWING_MENU_SECTIONS } from './storyFixtures';
import type { DesktopMenuSection } from './types';

interface MenuBarHarnessProps {
  sections: DesktopMenuSection[];
  initialActiveMenuId: string | null;
}

function MenuBarHarness({ sections, initialActiveMenuId }: MenuBarHarnessProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(initialActiveMenuId);
  const [lastCommand, setLastCommand] = useState('No command yet');

  return (
    <div style={{ width: 900, height: 180, position: 'relative', border: '1px solid #7f8899' }}>
      <DesktopMenuBar
        sections={sections}
        activeMenuId={activeMenuId}
        onActiveMenuChange={setActiveMenuId}
        onCommand={(commandId, menuId) => {
          setLastCommand(`${menuId}: ${commandId}`);
        }}
      />
      <div style={{ padding: '12px 10px', fontSize: 11 }}>Last command: {lastCommand}</div>
    </div>
  );
}

const meta = {
  title: 'Engine/Shell/Windowing/DesktopMenuBar',
  component: MenuBarHarness,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MenuBarHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    sections: WINDOWING_MENU_SECTIONS,
    initialActiveMenuId: null,
  },
};

export const FileMenuOpen: Story = {
  args: {
    sections: WINDOWING_MENU_SECTIONS,
    initialActiveMenuId: 'file',
  },
};

export const WindowMenuOpen: Story = {
  args: {
    sections: WINDOWING_MENU_SECTIONS,
    initialActiveMenuId: 'window',
  },
};

export const WithDisabledItems: Story = {
  args: {
    sections: WINDOWING_MENU_SECTIONS.map((section) => {
      if (section.id !== 'file') {
        return section;
      }
      return {
        ...section,
        items: section.items.map((entry) =>
          'separator' in entry ? entry : entry.id === 'close-window' ? { ...entry, disabled: true } : entry,
        ),
      };
    }),
    initialActiveMenuId: 'file',
  },
};
