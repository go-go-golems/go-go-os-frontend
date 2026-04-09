import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RadioButton } from './RadioButton';
import { TabControl } from './TabControl';

const meta = {
  title: 'Engine/Widgets/TabControl',
  component: TabControl,
  tags: ['autodocs'],
} satisfies Meta<typeof TabControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoTabs: Story = {
  args: { tabs: ['General', 'Sound'], activeTab: 0, onTabChange: () => {}, children: null },
  render: () => {
    const [tab, setTab] = useState(0);
    return (
      <TabControl tabs={['General', 'Sound']} activeTab={tab} onTabChange={setTab}>
        {tab === 0 && <div style={{ padding: 12, fontSize: 12 }}>Desktop Pattern: Standard</div>}
        {tab === 1 && <div style={{ padding: 12, fontSize: 12 }}>Speaker Volume: 60%</div>}
      </TabControl>
    );
  },
};

export const ThreeTabs: Story = {
  args: { tabs: ['General', 'Sound', 'Mouse'], activeTab: 0, onTabChange: () => {}, children: null },
  render: () => {
    const [tab, setTab] = useState(0);
    return (
      <TabControl tabs={['General', 'Sound', 'Mouse']} activeTab={tab} onTabChange={setTab}>
        {tab === 0 && (
          <div style={{ padding: 12, fontSize: 12 }}>
            <div style={{ marginBottom: 6 }}>Desktop Pattern: Standard</div>
            <div>Time: {new Date().toLocaleTimeString()}</div>
          </div>
        )}
        {tab === 1 && (
          <div style={{ padding: 12, fontSize: 12 }}>
            <div style={{ marginBottom: 6 }}>Speaker Volume</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10 }}>🔈</span>
              <div
                style={{
                  width: 120,
                  height: 8,
                  border: '2px solid #000',
                  background: '#fff',
                  position: 'relative',
                }}
              >
                <div style={{ width: '60%', height: '100%', background: '#000' }} />
              </div>
              <span style={{ fontSize: 10 }}>🔊</span>
            </div>
          </div>
        )}
        {tab === 2 && (
          <div style={{ padding: 12, fontSize: 12 }}>
            <div style={{ marginBottom: 6 }}>Double-Click Speed</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <RadioButton label="Slow" selected onChange={() => {}} />
              <RadioButton label="Fast" selected={false} onChange={() => {}} />
            </div>
          </div>
        )}
      </TabControl>
    );
  },
};

export const ManyTabs: Story = {
  args: { tabs: [], activeTab: 0, onTabChange: () => {}, children: null },
  render: () => {
    const names = ['General', 'Sound', 'Mouse', 'Keyboard', 'Display', 'Network'];
    const [tab, setTab] = useState(0);
    return (
      <TabControl tabs={names} activeTab={tab} onTabChange={setTab}>
        <div style={{ padding: 12, fontSize: 12 }}>{names[tab]} settings panel</div>
      </TabControl>
    );
  },
};
