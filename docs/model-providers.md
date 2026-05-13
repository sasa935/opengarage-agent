# Model Providers

OpenGarage Agent uses an OpenAI-compatible chat completions interface for LLM-assisted report review. The deterministic diagnostic pipeline still runs without an LLM.

When model review is enabled, report data such as VIN, DTCs, symptoms, and vehicle details may be sent to the configured provider. Leave `--ai` disabled for local-only report generation.

## DeepSeek

Set the API key in your shell or secret manager:

```bash
export DEEPSEEK_API_KEY="..."
export DEEPSEEK_MODEL="deepseek-v4-flash"
```

Then run:

```bash
npm run dev -- diagnose \
  --year 2012 \
  --make Honda \
  --model Accord \
  --dtc P0420 \
  --symptom "rough idle" \
  --offline \
  --ai
```

Do not commit real API keys. Use `.env.example` for names only, and use GitHub Secrets for CI or hosted experiments.

## GitHub Actions

The `AI Smoke Test` workflow is manual-only. Add a repository secret named `DEEPSEEK_API_KEY`, then run the workflow from GitHub Actions when you want to verify the model integration.

## Provider Contract

Providers implement `LlmProvider`:

```ts
type LlmProvider = {
  provider: string;
  defaultModel: string;
  complete(messages, options): Promise<{
    provider: string;
    model: string;
    content: string;
  }>;
};
```

This keeps DeepSeek, MiniMax, OpenAI-compatible gateways, and local proxy servers interchangeable.
