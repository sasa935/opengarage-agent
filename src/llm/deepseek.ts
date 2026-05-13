import { OpenAiCompatibleProvider } from "./openAiCompatible.js";

export function createDeepSeekProviderFromEnv(env: NodeJS.ProcessEnv = process.env): OpenAiCompatibleProvider {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is required when --ai is enabled.");
  }

  return new OpenAiCompatibleProvider({
    provider: "deepseek",
    apiKey,
    baseUrl: env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    defaultModel: env.DEEPSEEK_MODEL ?? "deepseek-v4-flash"
  });
}
