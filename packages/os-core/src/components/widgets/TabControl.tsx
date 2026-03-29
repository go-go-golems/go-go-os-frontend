import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { PARTS } from '../../parts';

export interface TabControlProps {
  tabs: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
  children: ReactNode;
}

export function TabControl({ tabs, activeTab, onTabChange, children }: TabControlProps) {
  const tabRefs = useRef<Array<HTMLDivElement | null>>([]);
  const baseId = useId().replace(/:/g, '');
  const panelId = `tab-panel-${baseId}`;

  const focusAndActivate = (index: number) => {
    onTabChange(index);
    tabRefs.current[index]?.focus();
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    if (tabs.length === 0) {
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusAndActivate((index + 1) % tabs.length);
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusAndActivate((index - 1 + tabs.length) % tabs.length);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusAndActivate(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      focusAndActivate(tabs.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTabChange(index);
    }
  };

  return (
    <div data-part={PARTS.tabControl}>
      <div data-part={PARTS.tabBar} role="tablist">
        {tabs.map((tab, i) => (
          <div
            key={`${tab}-${i}`}
            id={`tab-${baseId}-${i}`}
            ref={(node) => {
              tabRefs.current[i] = node;
            }}
            data-part={PARTS.tab}
            data-state={activeTab === i ? 'active' : undefined}
            role="tab"
            aria-selected={activeTab === i}
            aria-controls={panelId}
            tabIndex={activeTab === i ? 0 : -1}
            onKeyDown={(event) => onTabKeyDown(event, i)}
            onClick={() => onTabChange(i)}
          >
            {tab}
          </div>
        ))}
      </div>
      <div
        id={panelId}
        data-part="content-area"
        role="tabpanel"
        aria-labelledby={activeTab >= 0 ? `tab-${baseId}-${activeTab}` : undefined}
      >
        {children}
      </div>
    </div>
  );
}
