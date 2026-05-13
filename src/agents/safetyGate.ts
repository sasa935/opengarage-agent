import type { DiagnoseInput, DtcInfo, SafetyFinding } from "./types.js";

const CRITICAL_PATTERNS = [
  /brake|braking|soft pedal|pedal to the floor/i,
  /steering|loss of steering/i,
  /airbag|srs/i,
  /smoke|burning smell|fuel smell|gas smell/i,
  /overheat|overheating|temperature warning/i,
  /high voltage|thermal event|battery fire/i
];

const HIGH_PATTERNS = [
  /stall|stalled|loss of power|limp mode/i,
  /flashing check engine|flashing cel/i,
  /abs|traction control|stability control/i
];

export function evaluateSafety(input: DiagnoseInput, dtcs: DtcInfo[]): SafetyFinding[] {
  const findings: SafetyFinding[] = [];
  const text = input.symptoms.join(" ");

  if (CRITICAL_PATTERNS.some((pattern) => pattern.test(text))) {
    findings.push({
      level: "critical",
      title: "Potential immediate safety issue",
      rationale: "The reported symptoms may involve braking, steering, fire, overheating, airbags, or high-voltage systems.",
      recommendation: "Do not road test until a qualified technician has assessed the vehicle. Tow the vehicle if normal control, braking, or thermal safety is uncertain."
    });
  }

  if (HIGH_PATTERNS.some((pattern) => pattern.test(text))) {
    findings.push({
      level: "high",
      title: "Driveability risk needs triage first",
      rationale: "The symptoms suggest possible stalling, reduced power, flashing MIL, or stability-control involvement.",
      recommendation: "Limit driving and capture codes/freeze-frame data before clearing anything. Prefer controlled testing over normal commuting."
    });
  }

  if (dtcs.some((dtc) => dtc.system === "chassis")) {
    findings.push({
      level: "high",
      title: "Chassis system fault present",
      rationale: "Chassis DTCs can involve braking, ABS, steering, suspension, or stability-control behavior.",
      recommendation: "Verify whether ABS, traction, stability, or steering warnings are active before road testing."
    });
  }

  if (dtcs.some((dtc) => dtc.system === "network")) {
    findings.push({
      level: "medium",
      title: "Vehicle network fault present",
      rationale: "Network faults can hide the true root cause or affect modules that are not visible to a basic scan tool.",
      recommendation: "Run a full-system scan and verify battery voltage, grounds, and module communication before replacing parts."
    });
  }

  if (dtcs.some((dtc) => dtc.code.startsWith("P030"))) {
    findings.push({
      level: "medium",
      title: "Misfire can damage the catalyst",
      rationale: "Misfire faults can overheat the catalytic converter, especially when the check engine light is flashing.",
      recommendation: "Avoid extended driving until misfire severity is known and active misfire counters are reviewed."
    });
  }

  if (findings.length === 0) {
    findings.push({
      level: "low",
      title: "No immediate safety trigger detected",
      rationale: "The provided symptoms and DTCs did not match the built-in high-risk patterns.",
      recommendation: "Still verify warning lights, fluid leaks, overheating, braking, steering, and abnormal noises before road testing."
    });
  }

  return findings;
}
