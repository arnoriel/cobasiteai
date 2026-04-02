export interface Website {
  id: string;
  name: string;
  prompt: string;
  source_code: string;
  created_at: string;
  thumbnail?: string;
  page_name?: string;
  deployed_at?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type GenerationStatus =
  | 'idle'
  | 'thinking'
  | 'streaming'
  | 'done'
  | 'error';
