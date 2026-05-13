import { buildDiagnosticPlan } from "../agents/diagnosticPlanner.js";
import { interpretDtcs } from "../agents/dtcInterpreter.js";
import { retrieveEvidence } from "../agents/evidenceRetrieval.js";
import { evaluateSafety } from "../agents/safetyGate.js";
import { buildSymptomQuestions } from "../agents/symptomInterview.js";
import {
  type AgentContext,
  type DiagnoseInput,
  type DiagnosticReport,
  diagnoseInputSchema
} from "../agents/types.js";
import { buildVehicleProfile } from "../agents/vehicleProfile.js";
import { buildVerificationPlan } from "../agents/verification.js";

export async function runDiagnosis(rawInput: DiagnoseInput, now = new Date()): Promise<DiagnosticReport> {
  const input = diagnoseInputSchema.parse(rawInput);
  const context: AgentContext = {
    network: input.includeNetworkEvidence,
    now
  };

  const vehicle = await buildVehicleProfile(input, context);
  const dtcs = interpretDtcs(input.dtcs);
  const evidence = await retrieveEvidence(vehicle, dtcs, context);
  const questions = buildSymptomQuestions(input, dtcs);
  const safety = evaluateSafety(input, dtcs);
  const plan = buildDiagnosticPlan(input, vehicle, dtcs, evidence, safety);
  const verification = buildVerificationPlan(dtcs);

  return {
    generatedAt: now.toISOString(),
    input,
    vehicle,
    dtcs,
    evidence,
    questions,
    safety,
    plan,
    verification,
    assumptions: buildAssumptions(input, dtcs)
  };
}

function buildAssumptions(input: DiagnoseInput, dtcs: ReturnType<typeof interpretDtcs>): string[] {
  const assumptions = [
    "This report is diagnostic guidance, not a repair authorization or safety certification.",
    "The best next step is the cheapest reliable test that can rule causes in or out."
  ];

  if (dtcs.some((dtc) => dtc.confidence === "low")) {
    assumptions.push("One or more DTC definitions are unknown locally; OEM or enhanced scan-tool data may be required.");
  }

  if (!input.vin) {
    assumptions.push("No VIN was provided, so vehicle-specific recall and configuration evidence may be incomplete.");
  }

  if (input.symptoms.length === 0) {
    assumptions.push("No symptoms were provided, so the plan prioritizes baseline data capture and broad first checks.");
  }

  return assumptions;
}
