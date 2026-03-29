import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import type { RuntimeDebugEvent } from '../../cards/runtime';
import { RuntimeDebugPane } from './RuntimeDebugPane';

function makeEvents(): RuntimeDebugEvent[] {
  const now = new Date();
  return [
    {
      id: 1,
      ts: new Date(now.getTime() - 12000).toISOString(),
      kind: 'ui.emit',
      stackId: 'bookTrackerDebug',
      cardId: 'browse',
      cardType: 'list',
      nodeKey: 'browseList',
      eventName: 'rowClick',
      payload: { row: { id: 'b1', title: 'Dune' } },
    },
    {
      id: 2,
      ts: new Date(now.getTime() - 9000).toISOString(),
      kind: 'action.execute.start',
      stackId: 'bookTrackerDebug',
      cardId: 'browse',
      cardType: 'list',
      actionType: 'nav.go',
    },
    {
      id: 3,
      ts: new Date(now.getTime() - 7000).toISOString(),
      kind: 'selector.resolve',
      stackId: 'bookTrackerDebug',
      cardId: 'bookDetail',
      cardType: 'detail',
      selectorName: 'books.byParam',
      scope: 'shared',
      payload: { found: true },
    },
    {
      id: 4,
      ts: new Date(now.getTime() - 4000).toISOString(),
      kind: 'state.mutation',
      stackId: 'bookTrackerDebug',
      cardId: 'bookDetail',
      cardType: 'detail',
      actionType: 'state.setField',
      scope: 'card',
      payload: { path: 'edits.title', value: 'Dune Messiah' },
    },
  ];
}

function DemoPane() {
  const [collapsed, setCollapsed] = useState(false);
  const [kindFilter, setKindFilter] = useState('all');
  const [textFilter, setTextFilter] = useState('');
  const [events] = useState<RuntimeDebugEvent[]>(() => makeEvents());
  const [selectedId, setSelectedId] = useState<number | null>(events[events.length - 1]?.id ?? null);

  const kinds = useMemo(() => Array.from(new Set(events.map((event) => event.kind))).sort(), [events]);

  const filteredEvents = useMemo(() => {
    const text = textFilter.trim().toLowerCase();
    return events.filter((event) => {
      if (kindFilter !== 'all' && event.kind !== kindFilter) return false;
      if (!text) return true;
      return JSON.stringify(event).toLowerCase().includes(text);
    });
  }, [events, kindFilter, textFilter]);

  const selectedEvent = events.find((event) => event.id === selectedId) ?? null;

  const stats = useMemo(() => {
    const out: Record<string, number> = {};
    for (const event of events) {
      out[event.kind] = (out[event.kind] ?? 0) + 1;
    }
    return out;
  }, [events]);

  return (
    <div style={{ width: 900, height: 520, display: 'flex', border: '1px solid #ddd' }}>
      <div style={{ flex: 1, padding: 16 }}>Host Content</div>
      <RuntimeDebugPane
        title="Runtime Debug"
        collapsed={collapsed}
        events={events}
        filteredEvents={filteredEvents}
        selectedEvent={selectedEvent}
        kinds={kinds}
        kindFilter={kindFilter}
        textFilter={textFilter}
        snapshot={{
          navigation: { current: { card: 'bookDetail', param: 'b1' } },
          books: { total: 5 },
        }}
        stats={stats}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        onClear={() => undefined}
        onSelectEvent={setSelectedId}
        onKindFilterChange={setKindFilter}
        onTextFilterChange={setTextFilter}
      />
    </div>
  );
}

const meta = {
  title: 'Engine/Shell/RuntimeDebugPane',
  component: RuntimeDebugPane,
  render: () => <DemoPane />,
  args: {
    collapsed: false,
    events: [],
    filteredEvents: [],
    selectedEvent: null,
    kinds: [],
    kindFilter: 'all',
    textFilter: '',
    onToggleCollapsed: () => undefined,
    onClear: () => undefined,
    onSelectEvent: () => undefined,
    onKindFilterChange: () => undefined,
    onTextFilterChange: () => undefined,
  },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof RuntimeDebugPane>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
