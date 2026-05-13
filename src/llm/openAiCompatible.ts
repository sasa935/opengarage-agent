import type { ChatMessage, LlmCompletion, LlmCompletionOptions, LlmProvider } from "./types.js";

type FetchLike = typeof fetch;

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export type OpenAiCompatibleProviderOptions = {
  provider: string;
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  fetchImpl?: FetchLike;
};

export class OpenAiCompatibleProvider implements LlmProvider {
  readonly provider: string;
  readonly defaultModel: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(options: OpenAiCompatibleProviderOptions) {
    this.provider = options.provider;
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.defaultModel = options.defaultModel;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async complete(messages: ChatMessage[], options: LlmCompletionOptions = {}): Promise<LlmCompletion> {
    const model = options.model ?? this.defaultModel;
    const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 900,
        ...(options.json ? { response_format: { type: "json_object" } } : {})
      })
    });

    const payload = await response.json() as ChatCompletionResponse;
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `${this.provider} request failed with ${response.status}`);
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`${this.provider} returned an empty completion`);
    }

    return {
      provider: this.provider,
      model,
      content,
      raw: payload
    };
  }
}
