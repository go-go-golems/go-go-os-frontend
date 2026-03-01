export interface FakeResponse {
  text: string;
  actions?: Array<{ label: string; action: unknown }>;
}

export type ResponseMatcher = (input: string) => FakeResponse | null;

export const defaultResponseMatcher: ResponseMatcher = (input) => {
  const lower = input.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return {
      text: "Hello! I'm your AI assistant. I can help you navigate the app, look up information, and answer questions about your data. What would you like to know?",
    };
  }

  if (lower.includes('help')) {
    return {
      text: 'I can help with navigation, data queries, and actions. Describe what you need and I can guide you.',
    };
  }

  return {
    text: `I understand you're asking about "${input}". I found related information and can drill down if you want.`,
  };
};

export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const words = text.split(/(\s+)/);
  for (const word of words) {
    if (word.length <= 5) {
      tokens.push(word);
      continue;
    }
    for (let i = 0; i < word.length; i += 4) {
      tokens.push(word.slice(i, i + 4));
    }
  }
  return tokens;
}
