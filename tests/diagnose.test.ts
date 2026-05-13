import { describe, expect, it } from "vitest";
import { addLlmCaseReview } from "../src/agents/llmCaseReviewer.js";
import type { LlmProvider } from "../src/llm/types.js";
import { runDiagnosis } from "../src/pipeline/diagnose.js";
import { renderMarkdownReport } from "../src/report/markdown.js";

describe("runDiagnosis", () => {
  it("creates an evidence-first plan for common emissions codes", async () => {
    const report = await runDiagnosis({
      year: 2012,
      make: "Honda",
      model: "Accord",
      mileage: 120000,
      dtcs: ["P0420", "P0171"],
      symptoms: ["rough idle", "higher fuel consumption"],
      includeNetworkEvidence: false
    }, new Date("2026-05-13T00:00:00.000Z"));

    expect(report.vehicle.make).toBe("Honda");
    expect(report.dtcs.map((dtc) => dtc.code)).toEqual(["P0420", "P0171"]);
    expect(report.plan.some((step) => step.title.includes("Avoid premature catalyst replacement"))).toBe(true);
    expect(report.plan.some((step) => step.title.includes("Separate vacuum leak"))).toBe(true);
    expect(report.evidence.some((item) => item.tags.includes("offline"))).toBe(true);
  });

  it("raises the safety gate for braking symptoms", async () => {
    const report = await runDiagnosis({
      year: 2018,
      make: "Toyota",
      model: "Camry",
      dtcs: ["C0035"],
      symptoms: ["ABS light on and brake pedal feels soft"],
      includeNetworkEvidence: false
    }, new Date("2026-05-13T00:00:00.000Z"));

    expect(report.safety[0]?.level).toBe("critical");
    expect(report.plan[0]?.title).toContain("Stabilize safety risk");
  });
});

describe("renderMarkdownReport", () => {
  it("renders markdown with major sections", async () => {
    const report = await runDiagnosis({
      make: "Subaru",
      model: "Outback",
      dtcs: ["U0100"],
      symptoms: [],
      includeNetworkEvidence: false
    }, new Date("2026-05-13T00:00:00.000Z"));

    const markdown = renderMarkdownReport(report);

    expect(markdown).toContain("# OpenGarage Diagnostic Report");
    expect(markdown).toContain("## Safety Gate");
    expect(markdown).toContain("## Diagnostic Plan");
    expect(markdown).toContain("U0100");
  });
});

describe("addLlmCaseReview", () => {
  it("adds structured LLM review without changing the deterministic plan", async () => {
    const report = await runDiagnosis({
      make: "Honda",
      model: "Accord",
      dtcs: ["P0420"],
      symptoms: ["check engine light on"],
      includeNetworkEvidence: false
    }, new Date("2026-05-13T00:00:00.000Z"));

    const provider: LlmProvider = {
      provider: "test",
      defaultModel: "test-model",
      async complete() {
        return {
          provider: "test",
          model: "test-model",
          content: JSON.stringify({
            summary: "Review the upstream causes before replacing the catalyst.",
            likelyDiagnosticDirection: ["Check for exhaust leaks and unresolved mixture faults."],
            evidenceGaps: ["Need freeze-frame data and oxygen sensor graph."],
            cautions: ["Do not treat the code alone as proof of a failed catalyst."]
          })
        };
      }
    };

    const reviewed = await addLlmCaseReview(report, provider);

    expect(reviewed.plan).toEqual(report.plan);
    expect(reviewed.aiReview?.model).toBe("test-model");
    expect(renderMarkdownReport(reviewed)).toContain("## AI Review");
  });
});
