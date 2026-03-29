export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface Conversation {
  id: number;
  title: string;
  model: string;
  date: string;
  tags: string[];
  messages: ChatMessage[];
}

export interface SearchParams {
  text: string;
  model: string;
  tags: string[];
  dateFrom: string;
  dateTo: string;
  inMessages: boolean;
  inTitles: boolean;
}

export const EMPTY_SEARCH: SearchParams = {
  text: '',
  model: '',
  tags: [],
  dateFrom: '',
  dateTo: '',
  inMessages: true,
  inTitles: true,
};
