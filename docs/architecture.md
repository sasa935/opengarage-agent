# OpenGarage Agent Architecture

OpenGarage Agent is built around an evidence-first diagnostic loop:

1. Build a vehicle profile from VIN data or user input.
2. Interpret diagnostic trouble codes.
3. Retrieve public evidence such as NHTSA recall data.
4. Ask symptom questions that reduce ambiguity.
5. Run a safety gate before any road-test guidance.
6. Create a diagnostic plan that prioritizes tests over parts replacement.
7. Produce a verification plan and evidence checklist.

The first version is intentionally deterministic. It behaves like a transparent rules-and-tools agent, which gives contributors a stable baseline before LLM planning is introduced.

## Agent Modules

- `VehicleProfileAgent`: VIN decoding and vehicle identity normalization.
- `DTCInterpreterAgent`: local OBD-II code knowledge and fallback classification.
- `EvidenceRetrievalAgent`: public evidence lookup and source tagging.
- `SymptomInterviewAgent`: targeted follow-up questions.
- `SafetyGateAgent`: high-risk symptom and system detection.
- `DiagnosticPlannerAgent`: test-first diagnostic sequence.
- `VerificationAgent`: after-repair validation plan.

## Planned LLM Layer

The LLM layer should not replace safety checks or evidence retrieval. It should help with:

- Summarizing long service information or owner-provided notes.
- Ranking likely causes once structured evidence exists.
- Drafting a clear report for different audiences.
- Explaining why a test is recommended.

LLM output should cite the structured evidence it used. If it cannot cite evidence, the report should mark the claim as low confidence.
