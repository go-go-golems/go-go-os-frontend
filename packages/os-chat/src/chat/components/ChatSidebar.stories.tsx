import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useState } from 'react';
import { defaultResponseMatcher, tokenize } from './storyFakeResponses';
import type { ChatMessage } from './types';
import { ChatSidebar } from './ChatSidebar';

function ChatSidebarDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'sys-1', role: 'system', text: "Welcome! I'm your AI assistant.", status: 'complete' },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);

  const send = useCallback(
    (text: string) => {
      if (isStreaming) return;
      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text, status: 'complete' };
      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = { id: aiMsgId, role: 'ai', text: '', status: 'streaming' };
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);

      const response = defaultResponseMatcher(text);
      const tokens = tokenize(response?.text ?? "I'm not sure.");
      const actions = response?.actions;
      let cancelled = false;
      const timeouts: ReturnType<typeof setTimeout>[] = [];
      let elapsed = 400;

      for (let i = 0; i < tokens.length; i++) {
        elapsed += 25 + Math.random() * 45;
        const t = setTimeout(() => {
          if (cancelled) return;
          setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? { ...m, text: m.text + tokens[i] } : m)));
        }, elapsed);
        timeouts.push(t);
      }
      elapsed += 50;
      timeouts.push(
        setTimeout(() => {
          if (cancelled) return;
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, status: 'complete' as const, actions } : m)),
          );
          setIsStreaming(false);
          setCancelFn(null);
        }, elapsed),
      );

      setCancelFn(() => () => {
        cancelled = true;
        timeouts.forEach(clearTimeout);
        setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? { ...m, status: 'complete' as const } : m)));
        setIsStreaming(false);
      });
    },
    [isStreaming],
  );

  return (
    <div style={{ display: 'flex', height: 500, border: '1px solid #ddd' }}>
      <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
        <h3 style={{ margin: '0 0 8px' }}>Main App Content</h3>
        <p style={{ fontSize: 12, color: '#666' }}>
          This area represents the main card content. The chat sidebar sits alongside it, always available for
          questions.
        </p>
        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4, fontSize: 11 }}>
          <strong>Sample data:</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
            <li>5 open deals ($380K pipeline)</li>
            <li>7 contacts across 5 companies</li>
            <li>3 activities this week</li>
          </ul>
        </div>
      </div>
      <ChatSidebar
        messages={messages}
        isStreaming={isStreaming}
        onSend={send}
        onCancel={() => cancelFn?.()}
        suggestions={['Hello!', 'Show me open deals', 'Help']}
        title="AI Assistant"
        placeholder="Ask about your CRM data…"
        footer={<span>Model: fake-gpt-4 · Streaming</span>}
      />
    </div>
  );
}

const meta = {
  title: 'ChatRuntime/Components/ChatSidebar',
  component: ChatSidebarDemo,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ChatSidebarDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithConversation: Story = {
  render: () => (
    <div style={{ display: 'flex', height: 500, border: '1px solid #ddd' }}>
      <div style={{ flex: 1, padding: 20 }}>
        <h3>Main Content</h3>
      </div>
      <ChatSidebar
        messages={[
          { id: '1', role: 'system', text: 'Welcome!', status: 'complete' },
          { id: '2', role: 'user', text: 'How many open deals?', status: 'complete' },
          {
            id: '3',
            role: 'ai',
            text: 'You have 5 open deals with a total pipeline value of $380,000. The weighted pipeline value is $198,000.',
            status: 'complete',
            actions: [
              { label: '📊 Pipeline', action: 'pipeline' },
              { label: '💰 Deals', action: 'deals' },
            ],
          },
        ]}
        isStreaming={false}
        onSend={() => {}}
        title="AI Assistant"
        footer={<span>Model: fake-gpt-4</span>}
      />
    </div>
  ),
};
