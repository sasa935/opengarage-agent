import type { DiagnoseInput, DiagnosticStep, DtcInfo, EvidenceItem, SafetyFinding, VehicleProfile } from "./types.js";

export function buildDiagnosticPlan(
  input: DiagnoseInput,
  vehicle: VehicleProfile,
  dtcs: DtcInfo[],
  evidence: EvidenceItem[],
  safety: SafetyFinding[]
): DiagnosticStep[] {
  const steps: Omit<DiagnosticStep, "order">[] = [];
  const hasCriticalSafety = safety.some((finding) => finding.level === "critical");

  if (hasCriticalSafety) {
    steps.push({
      title: "Stabilize safety risk before diagnosis",
      purpose: "Avoid creating a dangerous road-test or shop condition.",
      checks: [
        "Confirm whether the vehicle can be moved safely",
        "Inspect for visible leaks, smoke, overheating, brake/steering warnings, or high-voltage warnings",
        "Use towing or stationary testing if safe vehicle control is uncertain"
      ],
      expectedEvidence: [
        "Photos of warning lights or visible hazards",
        "Technician note that the vehicle is safe for stationary or road testing"
      ],
      stopIf: "Braking, steering, thermal, fuel, or high-voltage risk remains unresolved."
    });
  }

  steps.push({
    title: "Capture the baseline before clearing codes",
    purpose: "Preserve the conditions that triggered the fault.",
    checks: [
      "Run a full-system scan, not only a generic powertrain scan",
      "Save freeze-frame data for every active and pending DTC",
      "Record battery voltage and charging voltage",
      "Note whether monitors are complete or recently reset"
    ],
    expectedEvidence: [
      "Scan report with active, pending, and history codes",
      "Freeze-frame snapshot",
      "Battery voltage measurement"
    ]
  });

  if (dtcs.some((dtc) => dtc.code === "P0171" || dtc.code === "P0174")) {
    steps.push({
      title: "Separate vacuum leak, MAF, and fuel delivery causes",
      purpose: "Lean codes have several common causes that should be ranked with fuel-trim behavior.",
      checks: [
        "Compare short-term and long-term fuel trims at idle and 2500 RPM",
        "Smoke-test the intake, PCV, and brake-booster vacuum paths",
        "Inspect the MAF sensor and air duct after the sensor",
        "Verify fuel pressure and volume if trims remain lean under load"
      ],
      expectedEvidence: [
        "Fuel trim values at idle and raised RPM",
        "Smoke-test result",
        "Fuel pressure reading if needed"
      ]
    });
  }

  if (dtcs.some((dtc) => dtc.code === "P0420")) {
    steps.push({
      title: "Avoid premature catalyst replacement",
      purpose: "P0420 should be diagnosed after upstream mixture, misfire, and exhaust leaks are ruled out.",
      checks: [
        "Fix active misfire or lean/rich codes first",
        "Inspect for exhaust leaks near the manifold, flex pipe, and oxygen sensors",
        "Graph upstream and downstream oxygen sensor behavior after the engine is fully warm",
        "Confirm catalyst monitor completion after a proper drive cycle"
      ],
      expectedEvidence: [
        "Fuel trim and misfire status after upstream fixes",
        "Oxygen sensor graph or scan-tool capture",
        "Exhaust leak inspection result"
      ]
    });
  }

  if (dtcs.some((dtc) => dtc.code.startsWith("P030"))) {
    steps.push({
      title: "Localize the misfire before replacing parts",
      purpose: "A cylinder-level misfire should be isolated to ignition, fuel, compression, or control.",
      checks: [
        "Read live misfire counters by cylinder",
        "Swap coils or plugs only when the test can show whether the fault follows",
        "Check injector control and contribution",
        "Run compression or leak-down testing if ignition and fuel checks pass"
      ],
      expectedEvidence: [
        "Misfire counter capture",
        "Swap-test result",
        "Compression or leak-down result when needed"
      ],
      stopIf: "The check engine light is flashing during testing; avoid extended running until severity is understood."
    });
  }

  if (dtcs.some((dtc) => dtc.system === "network")) {
    steps.push({
      title: "Verify power, ground, and network health",
      purpose: "Network codes often come from voltage or wiring faults rather than a failed module.",
      checks: [
        "Load-test the 12V battery",
        "Scan every module and record which modules are offline",
        "Inspect powers, grounds, water intrusion, and aftermarket accessories",
        "Check CAN resistance and network waveform if communication remains unstable"
      ],
      expectedEvidence: [
        "Full module scan topology",
        "Battery load-test result",
        "Power/ground voltage-drop readings"
      ]
    });
  }

  if (dtcs.some((dtc) => dtc.system === "chassis")) {
    steps.push({
      title: "Treat chassis codes as road-test sensitive",
      purpose: "ABS, steering, and stability-control faults can change how the vehicle behaves.",
      checks: [
        "Check warning lights and live wheel-speed or steering-angle data",
        "Inspect wiring at moving suspension and steering points",
        "Perform any road test in a controlled area"
      ],
      expectedEvidence: [
        "Live data comparison",
        "Connector and harness inspection result",
        "Controlled road-test notes"
      ]
    });
  }

  const recallEvidence = evidence.filter((item) => item.tags.includes("recall"));
  if (recallEvidence.length > 0) {
    steps.push({
      title: "Compare symptoms against recall evidence",
      purpose: "Public recall data can reveal known safety or reliability patterns for the exact vehicle.",
      checks: [
        `Review ${Math.min(recallEvidence.length, 8)} NHTSA recall evidence item(s) returned for this vehicle`,
        "Confirm whether any recall component overlaps the reported symptoms or DTC systems",
        "Check completion status with a dealer or official owner portal if a recall appears relevant"
      ],
      expectedEvidence: [
        "Recall campaign number when relevant",
        "Completion or non-applicability note"
      ]
    });
  }

  if (steps.length < 3) {
    steps.push({
      title: "Use service information for the exact vehicle",
      purpose: "Unknown or manufacturer-specific codes need OEM-level diagnostic context.",
      checks: [
        vehicle.year && vehicle.make && vehicle.model
          ? `Look up service information for ${vehicle.year} ${vehicle.make} ${vehicle.model}`
          : "Look up service information for the exact year, make, model, engine, and trim",
        "Follow connector pinout and threshold tests before replacing modules or sensors",
        "Document which tests passed, failed, or could not be run"
      ],
      expectedEvidence: [
        "Service information reference",
        "Pinout, threshold, or flowchart step result"
      ]
    });
  }

  return steps.map((step, index) => ({ ...step, order: index + 1 }));
}
