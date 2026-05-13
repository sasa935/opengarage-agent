# OpenGarage Agent

Evidence-first AI diagnostic agent for modern vehicles.

OpenGarage Agent helps vehicle owners, independent repair shops, fleet operators, and open-source builders turn messy vehicle symptoms into a structured diagnostic report. It combines vehicle identity, OBD-II diagnostic trouble codes, public evidence, safety checks, and test-first repair planning.

The project starts as a transparent CLI and agent pipeline. The goal is to grow into an open automotive diagnostic agent platform with pluggable data sources, LLM reasoning, local privacy options, and GitHub-style evidence reports.

## Why This Exists

Modern vehicle repair increasingly looks like debugging a distributed software system: modules communicate over networks, failures can be intermittent, service information is fragmented, and a generic scan tool rarely tells the whole story.

OpenGarage Agent focuses on a painful gap:

- Do not jump from fault code to parts replacement.
- Preserve evidence before clearing codes.
- Surface safety risk before road testing.
- Use public data such as NHTSA recalls where available.
- Produce a report a human can audit.

## Current Status

This is an early MVP. It does not control vehicles, flash modules, bypass safety systems, or replace a qualified technician. It generates structured diagnostic guidance and evidence checklists.

## Install

```bash
npm install
npm run build
```

For local development:

```bash
npm run dev -- diagnose \
  --year 2012 \
  --make Honda \
  --model Accord \
  --mileage 120000 \
  --dtc P0420 \
  --dtc P0171 \
  --symptom "rough idle" \
  --symptom "higher fuel consumption" \
  --offline
```

## CLI Example

```bash
opengarage diagnose \
  --vin 1HGCM82633A004352 \
  --dtc P0420 \
  --dtc P0171 \
  --symptom "rough idle" \
  --symptom "check engine light on"
```

Use `--offline` to skip live NHTSA lookup, or `--json` to emit machine-readable output.

```bash
opengarage diagnose --make Toyota --model Camry --dtc C0035 --symptom "ABS light on" --json
```

## Web UI

Start the local web experience:

```bash
npm run web
```

Then open http://localhost:3000.

The web UI includes:

- Vehicle, DTC, mileage, and symptom inputs.
- Optional NHTSA lookup.
- Optional AI review.
- A structured report preview with safety level, evidence count, and diagnostic plan.

## Optional AI Review

The deterministic diagnostic pipeline works without a model. For experiments, you can add an LLM case review with DeepSeek V4:

```bash
export DEEPSEEK_API_KEY="..."
export DEEPSEEK_MODEL="deepseek-v4-flash"

npm run dev -- diagnose \
  --year 2012 \
  --make Honda \
  --model Accord \
  --dtc P0420 \
  --symptom "rough idle" \
  --offline \
  --ai
```

The LLM is asked to review the structured report, cite evidence gaps, and avoid inventing manufacturer-specific facts. See [docs/model-providers.md](docs/model-providers.md).

When `--ai` is enabled, report data such as VIN, DTCs, symptoms, and vehicle details may be sent to the configured external model provider. Keep `--ai` off for local-only reports.

## What The Report Includes

- Vehicle profile from VIN decoding or user input.
- DTC explanations and common first checks.
- Safety gate for braking, steering, airbag, overheating, fuel smell, high-voltage, chassis, and network risks.
- Evidence items with source and confidence.
- Follow-up questions that reduce diagnostic ambiguity.
- Test-first diagnostic plan.
- Repair verification plan.

## Agent Pipeline

OpenGarage is organized as a small group of agents:

- `VehicleProfileAgent`: VIN decoding and vehicle identity.
- `DTCInterpreterAgent`: OBD-II code interpretation.
- `EvidenceRetrievalAgent`: public evidence lookup.
- `SymptomInterviewAgent`: targeted follow-up questions.
- `SafetyGateAgent`: high-risk condition detection.
- `DiagnosticPlannerAgent`: test-first diagnostic sequence.
- `VerificationAgent`: after-repair validation.

See [docs/architecture.md](docs/architecture.md) for more detail.

## Data Sources

The first public-data integration is NHTSA:

- vPIC VIN decoder: https://vpic.nhtsa.dot.gov/api/
- Recalls lookup: https://www.nhtsa.gov/recalls

The local DTC table is intentionally small at first. We should expand it carefully with source-aware definitions and avoid copying proprietary service content.

## Roadmap

- Add a small web UI for non-technical users.
- Add OBD adapter import for common ELM327 CSV/log formats.
- Add LLM summarization with explicit evidence citations.
- Add automatic AI review for PRs and generated diagnostic-rule changes.
- Add PDF/manual ingestion for user-owned documents.
- Add GitHub issue-to-diagnostic-report workflow for open-source automotive data projects.
- Add plugin interfaces for fleet maintenance systems.
- Add multilingual report output.

## AI PR Review

The repository includes a DeepSeek-powered GitHub Actions reviewer that comments on PRs automatically. See [docs/ai-pr-review.md](docs/ai-pr-review.md).

## Safety Principles

- The agent should recommend tests before parts.
- The agent should preserve evidence before clearing codes.
- The agent should refuse unsafe road-test guidance when braking, steering, airbag, overheating, fuel, or high-voltage risks are present.
- The agent should distinguish confidence levels.
- The agent should explain what evidence would change its conclusion.

## Development

```bash
npm run verify
```

The full verification flow runs:

- Type checking.
- Unit and integration tests.
- TypeScript build.
- Web smoke test.
- npm package dry run.

Individual checks:

```bash
npm run typecheck
npm test
npm run build
```

## License

MIT
