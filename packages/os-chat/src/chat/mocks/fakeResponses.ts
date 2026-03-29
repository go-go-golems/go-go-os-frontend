// ── Canned responses for fake streaming ──

export interface FakeResponse {
  text: string;
  actions?: Array<{ label: string; action: unknown }>;
}

export type ResponseMatcher = (input: string) => FakeResponse | null;

/**
 * Default generic response matcher — keyword-based.
 * Apps can provide their own domain-specific matchers.
 */
export const defaultResponseMatcher: ResponseMatcher = (input) => {
  const lower = input.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return {
      text: "Hello! I'm your AI assistant. I can help you navigate the app, look up information, and answer questions about your data. What would you like to know?",
    };
  }

  if (lower.includes('help')) {
    return {
      text: 'I can help with several things:\n\n• **Navigation** — Ask me to show you any screen\n• **Data queries** — Ask about your records, stats, or reports\n• **Actions** — I can help you create, update, or find items\n\nJust describe what you need in plain language!',
    };
  }

  return {
    text: `I understand you're asking about "${input}". Let me look into that for you.\n\nI found some relevant information in your data. Would you like me to go into more detail, or would you prefer to navigate to a specific view?`,
  };
};

/**
 * Tokenize a response string for streaming simulation.
 * Splits on word boundaries, preserving whitespace.
 */
export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  // Split into chunks of ~2-5 characters to simulate realistic token sizes
  const words = text.split(/(\s+)/);
  for (const word of words) {
    if (word.length <= 5) {
      tokens.push(word);
    } else {
      // Split long words into smaller chunks
      for (let i = 0; i < word.length; i += 4) {
        tokens.push(word.slice(i, i + 4));
      }
    }
  }
  return tokens;
}
