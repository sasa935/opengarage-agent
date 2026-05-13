import { describe, expect, it } from "vitest";
import { buildDiagnosticPlan } from "../src/agents/diagnosticPlanner.js";
import { evaluateSafety } from "../src/agents/safetyGate.js";
import { buildSymptomQuestions } from "../src/agents/symptomInterview.js";
import type { DiagnoseInput, EvidenceItem, VehicleProfile } from "../src/agents/types.js";
import { interpretDtc } from "../src/data/dtc.js";

describe("safety gate", () => {
  it("marks braking symptoms as critical", () => {
    const findings = evaluateSafety({
      dtcs: [],
      symptoms: ["brake pedal goes to the floor"],
      includeNetworkEvidence: false
    }, []);

    expect(findings[0]?.level).toBe("critical");
  });

  it("marks network DTCs as medium risk", () => {
    const findings = evaluateSafety({
      dtcs: ["U0100"],
      symptoms: [],
      includeNetworkEvidence: false
    }, [interpretDtc("U0100")]);

    expect(findings.some((finding) => finding.level === "medium")).toBe(true);
  });
});

describe("DTC interpretation", () => {
  it("normalizes known DTCs", () => {
    const info = interpretDtc(" p0420 ");

    expect(info.code).toBe("P0420");
    expect(info.confidence).toBe("high");
    expect(info.system).toBe("powertrain");
  });

  it("creates safe fallbacks for unknown chassis codes", () => {
    const info = interpretDtc("C1234");

    expect(info.confidence).toBe("low");
    expect(info.system).toBe("chassis");
    expect(info.safetyNotes[0]).toContain("safety systems");
  });
});

describe("diagnostic planning", () => {
  it("puts safety stabilization first for critical symptoms", () => {
    const input: DiagnoseInput = {
      year: 2018,
      make: "Toyota",
      model: "Camry",
      dtcs: ["C0035"],
      symptoms: ["ABS light on and brake pedal feels soft"],
      includeNetworkEvidence: false
    };
    const vehicle: VehicleProfile = {
      year: 2018,
      make: "Toyota",
      model: "Camry",
      source: "user",
      warnings: []
    };
    const dtcs = [interpretDtc("C0035")];
    const safety = evaluateSafety(input, dtcs);
    const evidence: EvidenceItem[] = [];

    const plan = buildDiagnosticPlan(input, vehicle, dtcs, evidence, safety);

    expect(plan[0]?.title).toContain("Stabilize safety risk");
  });
});

describe("symptom interview", () => {
  it("asks targeted questions for catalyst efficiency codes", () => {
    const questions = buildSymptomQuestions({
      dtcs: ["P0420"],
      symptoms: ["check engine light on"],
      includeNetworkEvidence: false
    }, [interpretDtc("P0420")]);

    expect(questions.some((question) => question.id === "p0420-before-catalyst")).toBe(true);
  });
});
