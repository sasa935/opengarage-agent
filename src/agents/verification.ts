import type { DtcInfo, VerificationPlan } from "./types.js";

export function buildVerificationPlan(dtcs: DtcInfo[]): VerificationPlan {
  const checks = [
    "Clear codes only after the repair or test condition has been documented",
    "Run the vehicle until relevant monitors or live data can be observed",
    "Re-scan for active, pending, and history codes",
    "Compare before/after symptoms under the same conditions when possible"
  ];

  if (dtcs.some((dtc) => dtc.code === "P0420")) {
    checks.push("Complete the catalyst monitor drive cycle and confirm downstream oxygen sensor behavior is stable.");
  }

  if (dtcs.some((dtc) => dtc.code === "P0171" || dtc.code === "P0174")) {
    checks.push("Confirm fuel trims stay near normal at idle, cruise, and light acceleration after repair.");
  }

  if (dtcs.some((dtc) => dtc.code.startsWith("P030"))) {
    checks.push("Confirm misfire counters remain at zero during idle, snap throttle, and light-load driving.");
  }

  return {
    checks,
    roadTestGuidance: [
      "Only road test after the safety gate is clear.",
      "Use a route that can reproduce the original condition without aggressive driving.",
      "Stop the test if warning lights flash, temperature rises, braking/steering feel changes, or fuel/thermal smell appears."
    ],
    evidenceToCapture: [
      "Before and after scan reports",
      "Freeze-frame data",
      "Relevant live data graph or screenshot",
      "Notes for which diagnostic step proved or disproved the root cause"
    ]
  };
}
