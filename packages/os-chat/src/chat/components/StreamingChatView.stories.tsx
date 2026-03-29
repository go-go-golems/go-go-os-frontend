import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useState } from 'react';
import { defaultResponseMatcher, tokenize } from './storyFakeResponses';
import type { ChatMessage } from './types';
import { StreamingChatView } from './StreamingChatView';

// ── Helper: simulate streaming in a standalone story ──

function useSimulatedStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'sys-1', role: 'system', text: 'Welcome! Ask me anything.', status: 'complete' },
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
      const tokens = tokenize(response?.text ?? "I'm not sure about that.");
      const actions = response?.actions;

      let cancelled = false;
      const timeouts: ReturnType<typeof setTimeout>[] = [];
      let elapsed = 400; // thinking delay

      for (let i = 0; i < tokens.length; i++) {
        elapsed += 20 + Math.random() * 50;
        const t = setTimeout(() => {
          if (cancelled) return;
          setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? { ...m, text: m.text + tokens[i] } : m)));
        }, elapsed);
        timeouts.push(t);
      }

      elapsed += 50;
      const doneT = setTimeout(() => {
        if (cancelled) return;
        setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? { ...m, status: 'complete' as const, actions } : m)));
        setIsStreaming(false);
        setCancelFn(null);
      }, elapsed);
      timeouts.push(doneT);

      setCancelFn(() => () => {
        cancelled = true;
        timeouts.forEach(clearTimeout);
        setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? { ...m, status: 'complete' as const } : m)));
        setIsStreaming(false);
        setCancelFn(null);
      });
    },
    [isStreaming],
  );

  const cancel = useCallback(() => {
    cancelFn?.();
  }, [cancelFn]);

  return { messages, isStreaming, send, cancel };
}

// ── Interactive story ──

function StreamingChatDemo() {
  const { messages, isStreaming, send, cancel } = useSimulatedStream();

  return (
    <div style={{ width: 380, height: 500, border: '1px solid #ddd', borderRadius: 4 }}>
      <StreamingChatView
        messages={messages}
        isStreaming={isStreaming}
        suggestions={['Hello!', 'What can you help with?', 'Tell me about my data']}
        onSend={send}
        onCancel={cancel}
        title="AI Assistant"
        placeholder="Ask me anything…"
      />
    </div>
  );
}

const meta = {
  title: 'ChatRuntime/Components/StreamingChatView',
  component: StreamingChatDemo,
} satisfies Meta<typeof StreamingChatDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};

// ── Static states ──

function StaticStory({ messages, isStreaming = false }: { messages: ChatMessage[]; isStreaming?: boolean }) {
  return (
    <div style={{ width: 380, height: 400, border: '1px solid #ddd', borderRadius: 4 }}>
      <StreamingChatView
        messages={messages}
        isStreaming={isStreaming}
        suggestions={['Suggestion 1', 'Suggestion 2']}
        onSend={() => {}}
        onCancel={() => {}}
        title="AI Assistant"
      />
    </div>
  );
}

export const Idle: Story = {
  render: () => (
    <StaticStory messages={[{ id: '1', role: 'system', text: 'Welcome! How can I help?', status: 'complete' }]} />
  ),
};

export const Thinking: Story = {
  render: () => (
    <StaticStory
      isStreaming
      messages={[
        { id: '1', role: 'user', text: 'What are my open deals?', status: 'complete' },
        { id: '2', role: 'ai', text: '', status: 'streaming' },
      ]}
    />
  ),
};

export const MidStream: Story = {
  render: () => (
    <StaticStory
      isStreaming
      messages={[
        { id: '1', role: 'user', text: 'Tell me about low stock', status: 'complete' },
        {
          id: '2',
          role: 'ai',
          text: 'Here are the items currently at or below your low-stock threshold:\n\n• Widget A — 2 remaining\n• Gadget B — 1 remaining',
          status: 'streaming',
        },
      ]}
    />
  ),
};

export const Complete: Story = {
  render: () => (
    <StaticStory
      messages={[
        { id: '1', role: 'user', text: 'Show me a summary', status: 'complete' },
        {
          id: '2',
          role: 'ai',
          text: "Here's your dashboard summary:\n\n• 5 open deals worth $380,000\n• 3 new leads this week\n• Pipeline weighted value: $198,000",
          status: 'complete',
          actions: [
            { label: '📊 View Pipeline', action: 'pipeline' },
            { label: '👤 View Contacts', action: 'contacts' },
          ],
        },
      ]}
    />
  ),
};

export const ErrorState: Story = {
  render: () => (
    <StaticStory
      messages={[
        { id: '1', role: 'user', text: 'Analyze my data', status: 'complete' },
        { id: '2', role: 'ai', text: 'Model temporarily unavailable. Please try again.', status: 'error' },
      ]}
    />
  ),
};

export const LongConversation: Story = {
  render: () => (
    <StaticStory
      messages={[
        { id: '1', role: 'system', text: 'Welcome! How can I help?', status: 'complete' },
        { id: '2', role: 'user', text: 'How many contacts do I have?', status: 'complete' },
        {
          id: '3',
          role: 'ai',
          text: 'You have 7 contacts across 5 companies. 2 are customers, 2 are prospects, 2 are leads, and 1 has churned.',
          status: 'complete',
        },
        { id: '4', role: 'user', text: 'Which ones are VIPs?', status: 'complete' },
        {
          id: '5',
          role: 'ai',
          text: 'Two contacts are tagged as VIP:\n\n• **Alice Johnson** (Acme Corp) — Active customer\n• **Eve Martinez** (Umbrella Ltd) — Active customer\n\nBoth have active deals in the pipeline.',
          status: 'complete',
          actions: [
            { label: '👤 Alice', action: 'c1' },
            { label: '👤 Eve', action: 'c5' },
          ],
        },
        { id: '6', role: 'user', text: 'What deals does Alice have?', status: 'complete' },
        {
          id: '7',
          role: 'ai',
          text: 'Alice Johnson has 2 deals:\n\n1. **Acme Enterprise License** — $120,000, Negotiation stage (75% probability)\n2. **Acme Support Renewal** — $30,000, Closed Won\n\nTotal pipeline value: $150,000',
          status: 'complete',
        },
      ]}
    />
  ),
};
