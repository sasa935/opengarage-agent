import { z } from "zod";
import type { DiagnosticReport, LlmCaseReview } from "./types.js";
import type { LlmProvider } from "../llm/types.js";

const stringListSchema = z.union([z.array(z.string()), z.string()]).transform((value) => {
  if (Array.isArray(value)) {
    return value;
  }
  return value
    .split(/\n|;/)
    .map((item) => item.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);
});

const llmCaseReviewSchema = z.object({
  summary: z.string(),
  likelyDiagnosticDirection: stringListSchema,
  evidenceGaps: stringListSchema,
  cautions: stringListSchema
});

export async function addLlmCaseReview(
  report: DiagnosticReport,
  provider: LlmProvider,
  model?: string
): Promise<DiagnosticReport> {
  const completion = await provider.complete([
    {
      role: "system",
      content: [
        "You are an automotive diagnostic report reviewer.",
        "Use only the structured report provided by the user.",
        "Do not invent manufacturer specifications, repair manual steps, prices, or recalls.",
        "Prefer test-first reasoning over parts replacement.",
        "Return strict JSON with keys: summary, likelyDiagnosticDirection, evidenceGaps, cautions."
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify(toReviewPayload(report))
    }
  ], {
    model,
    temperature: 0.1,
    maxTokens: 900,
    json: true
  });

  const parsed = parseJsonObject(completion.content);
  const review = llmCaseReviewSchema.parse(parsed);

  return {
    ...report,
    aiReview: {
      provider: completion.provider,
      model: completion.model,
      ...review
    }
  };
}

function toReviewPayload(report: DiagnosticReport): unknown {
  return {
    vehicle: report.vehicle,
    input: report.input,
    dtcs: report.dtcs,
    safety: report.safety,
    questions: report.questions,
    plan: report.plan,
    evidence: report.evidence.map((item) => ({
      source: item.source,
      title: item.title,
      summary: item.summary,
      confidence: item.confidence,
      tags: item.tags
    })),
    assumptions: report.assumptions
  };
}

function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1]);
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("LLM response did not contain a JSON object.");
}
