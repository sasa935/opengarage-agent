import type { DiagnosticReport } from "../agents/types.js";

export function renderMarkdownReport(report: DiagnosticReport): string {
  const vehicleTitle = [
    report.vehicle.year,
    report.vehicle.make,
    report.vehicle.model,
    report.vehicle.trim
  ].filter(Boolean).join(" ") || "Unknown vehicle";

  return [
    `# OpenGarage Diagnostic Report`,
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `## Vehicle`,
    "",
    `- Vehicle: ${vehicleTitle}`,
    report.vehicle.vin ? `- VIN: ${report.vehicle.vin}` : undefined,
    report.vehicle.engine ? `- Engine: ${report.vehicle.engine}` : undefined,
    report.vehicle.fuelType ? `- Fuel: ${report.vehicle.fuelType}` : undefined,
    `- Profile source: ${report.vehicle.source}`,
    ...report.vehicle.warnings.map((warning) => `- Warning: ${warning}`),
    "",
    `## Reported Inputs`,
    "",
    `- DTCs: ${report.input.dtcs.length > 0 ? report.input.dtcs.join(", ") : "none"}`,
    `- Symptoms: ${report.input.symptoms.length > 0 ? report.input.symptoms.join("; ") : "none provided"}`,
    report.input.mileage ? `- Mileage: ${report.input.mileage}` : undefined,
    "",
    `## Safety Gate`,
    "",
    ...report.safety.flatMap((finding) => [
      `### ${finding.level.toUpperCase()}: ${finding.title}`,
      "",
      finding.rationale,
      "",
      `Recommendation: ${finding.recommendation}`,
      ""
    ]),
    `## DTC Interpretation`,
    "",
    ...report.dtcs.flatMap((dtc) => [
      `### ${dtc.code}: ${dtc.description}`,
      "",
      `- System: ${dtc.system}`,
      `- Generic: ${dtc.isGeneric ? "yes" : "no / manufacturer-specific possible"}`,
      `- Confidence: ${dtc.confidence}`,
      `- Common causes: ${dtc.commonCauses.join("; ")}`,
      `- First checks: ${dtc.firstChecks.join("; ")}`,
      ...(dtc.safetyNotes.length > 0 ? [`- Safety notes: ${dtc.safetyNotes.join("; ")}`] : []),
      ""
    ]),
    `## Questions To Ask Next`,
    "",
    ...(report.questions.length > 0
      ? report.questions.flatMap((question) => [
          `- ${question.question}`,
          `  Reason: ${question.reason}`
        ])
      : ["- No extra questions generated from the current input."]),
    "",
    report.aiReview ? `## AI Review` : undefined,
    report.aiReview ? "" : undefined,
    ...(report.aiReview ? [
      `- Provider: ${report.aiReview.provider}`,
      `- Model: ${report.aiReview.model}`,
      "",
      report.aiReview.summary,
      "",
      `Likely diagnostic direction:`,
      ...report.aiReview.likelyDiagnosticDirection.map((item) => `- ${item}`),
      "",
      `Evidence gaps:`,
      ...report.aiReview.evidenceGaps.map((item) => `- ${item}`),
      "",
      `Cautions:`,
      ...report.aiReview.cautions.map((item) => `- ${item}`),
      ""
    ] : []),
    `## Diagnostic Plan`,
    "",
    ...report.plan.flatMap((step) => [
      `### ${step.order}. ${step.title}`,
      "",
      step.purpose,
      "",
      `Checks:`,
      ...step.checks.map((check) => `- ${check}`),
      "",
      `Evidence to capture:`,
      ...step.expectedEvidence.map((item) => `- ${item}`),
      step.stopIf ? `\nStop if: ${step.stopIf}` : undefined,
      ""
    ]),
    `## Evidence`,
    "",
    ...report.evidence.flatMap((item) => [
      `### ${item.title}`,
      "",
      `- Source: ${item.source}`,
      `- Confidence: ${item.confidence}`,
      item.url ? `- URL: ${item.url}` : undefined,
      `- Tags: ${item.tags.join(", ")}`,
      "",
      item.summary,
      ""
    ]),
    `## Verification Plan`,
    "",
    `Checks:`,
    ...report.verification.checks.map((check) => `- ${check}`),
    "",
    `Road test guidance:`,
    ...report.verification.roadTestGuidance.map((item) => `- ${item}`),
    "",
    `Evidence to keep:`,
    ...report.verification.evidenceToCapture.map((item) => `- ${item}`),
    "",
    `## Assumptions`,
    "",
    ...report.assumptions.map((assumption) => `- ${assumption}`),
    ""
  ].filter((line): line is string => line !== undefined).join("\n");
}
