export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type LlmCompletionOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
};

export type LlmCompletion = {
  provider: string;
  model: string;
  content: string;
  raw?: unknown;
};

export interface LlmProvider {
  readonly provider: string;
  readonly defaultModel: string;
  complete(messages: ChatMessage[], options?: LlmCompletionOptions): Promise<LlmCompletion>;
}
