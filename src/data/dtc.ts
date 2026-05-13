import type { DtcInfo, DtcSystem } from "../agents/types.js";

type DtcDefinition = Omit<DtcInfo, "code" | "isGeneric" | "confidence" | "system"> & {
  system?: DtcSystem;
};

const DTC_DEFINITIONS: Record<string, DtcDefinition> = {
  P0101: {
    description: "Mass or volume air flow sensor circuit range/performance",
    commonCauses: [
      "Contaminated or failing MAF sensor",
      "Intake air leak after the MAF sensor",
      "Restricted air filter or intake path",
      "Wiring or connector fault"
    ],
    firstChecks: [
      "Inspect the intake duct for cracks or loose clamps",
      "Check MAF grams/second or voltage against expected values",
      "Look for fuel trim changes when lightly tapping or moving the MAF harness"
    ],
    safetyNotes: []
  },
  P0128: {
    description: "Coolant thermostat regulating temperature below expected threshold",
    commonCauses: [
      "Thermostat stuck open",
      "Low coolant level",
      "Coolant temperature sensor bias",
      "Cooling fan running unexpectedly"
    ],
    firstChecks: [
      "Verify coolant level when the engine is cold",
      "Compare scan-tool coolant temperature with actual warm-up behavior",
      "Check whether cabin heat and radiator hose temperatures match the scan data"
    ],
    safetyNotes: ["Do not open the cooling system while hot or pressurized."]
  },
  P0171: {
    description: "System too lean, bank 1",
    commonCauses: [
      "Vacuum leak or unmetered air",
      "Dirty or biased MAF sensor",
      "Weak fuel delivery",
      "Exhaust leak ahead of oxygen sensor",
      "PCV valve or hose fault"
    ],
    firstChecks: [
      "Record short-term and long-term fuel trims at idle and 2500 RPM",
      "Smoke-test the intake path for vacuum leaks",
      "Inspect PCV hoses and intake boots",
      "Verify fuel pressure before replacing oxygen sensors"
    ],
    safetyNotes: []
  },
  P0174: {
    description: "System too lean, bank 2",
    commonCauses: [
      "Vacuum leak or unmetered air",
      "Dirty or biased MAF sensor",
      "Weak fuel delivery",
      "Exhaust leak ahead of oxygen sensor",
      "PCV valve or hose fault"
    ],
    firstChecks: [
      "Compare bank 1 and bank 2 fuel trims",
      "Smoke-test the intake path for vacuum leaks",
      "Inspect shared intake and PCV plumbing",
      "Verify fuel pressure and volume"
    ],
    safetyNotes: []
  },
  P0300: {
    description: "Random or multiple cylinder misfire detected",
    commonCauses: [
      "Ignition coil, plug, or boot failure",
      "Vacuum leak",
      "Fuel injector or fuel delivery issue",
      "Low compression or mechanical timing issue"
    ],
    firstChecks: [
      "Check whether the check engine light is flashing",
      "Read misfire counters by cylinder",
      "Inspect spark plugs and ignition coils",
      "Avoid extended driving before catalyst damage is ruled out"
    ],
    safetyNotes: [
      "A flashing check engine light can indicate catalyst-damaging misfire. Reduce driving and diagnose promptly."
    ]
  },
  P0301: {
    description: "Cylinder 1 misfire detected",
    commonCauses: [
      "Cylinder 1 ignition coil, plug, or boot failure",
      "Cylinder 1 injector issue",
      "Compression or valve sealing issue",
      "Vacuum leak near cylinder 1 intake runner"
    ],
    firstChecks: [
      "Swap the cylinder 1 coil with another cylinder and watch whether the misfire follows",
      "Inspect the spark plug condition",
      "Check injector balance or cylinder contribution",
      "Run compression or leak-down testing if ignition and fuel checks pass"
    ],
    safetyNotes: [
      "A flashing check engine light can indicate catalyst-damaging misfire. Reduce driving and diagnose promptly."
    ]
  },
  P0420: {
    description: "Catalyst system efficiency below threshold, bank 1",
    commonCauses: [
      "Aging or damaged catalytic converter",
      "Exhaust leak near the oxygen sensors",
      "Upstream fuel trim or misfire issue damaging converter efficiency",
      "Oxygen sensor signal fault"
    ],
    firstChecks: [
      "Resolve active misfire or lean/rich codes before condemning the catalyst",
      "Inspect for exhaust leaks ahead of and near oxygen sensors",
      "Compare upstream and downstream oxygen sensor switching behavior",
      "Review catalyst monitor status after a complete drive cycle"
    ],
    safetyNotes: [
      "Do not ignore rotten-egg smell, glowing exhaust parts, or loss of power; those can indicate overheating exhaust components."
    ]
  },
  P0442: {
    description: "Evaporative emission system small leak detected",
    commonCauses: [
      "Loose or damaged fuel cap",
      "Small leak in EVAP hose or fitting",
      "Purge or vent valve sealing issue",
      "Charcoal canister leak"
    ],
    firstChecks: [
      "Inspect and reseat the fuel cap",
      "Check EVAP hoses for cracks or disconnection",
      "Use a smoke machine if the basic inspection does not find the leak"
    ],
    safetyNotes: ["Fuel vapor concerns should be handled away from sparks, flames, and hot surfaces."]
  },
  P0455: {
    description: "Evaporative emission system gross leak detected",
    commonCauses: [
      "Missing or loose fuel cap",
      "Disconnected EVAP hose",
      "Vent valve stuck open",
      "Large leak in canister or filler neck"
    ],
    firstChecks: [
      "Confirm the fuel cap is present, correct, and sealing",
      "Inspect visible EVAP hoses near the canister and engine bay",
      "Command purge and vent valves if bidirectional scan-tool control is available"
    ],
    safetyNotes: ["Fuel vapor concerns should be handled away from sparks, flames, and hot surfaces."]
  },
  U0100: {
    description: "Lost communication with engine control module/powertrain control module",
    system: "network",
    commonCauses: [
      "Low battery voltage or poor ground",
      "CAN bus wiring or connector fault",
      "Module power or ground issue",
      "Aftermarket accessory or water intrusion affecting network wiring"
    ],
    firstChecks: [
      "Load-test the 12V battery and verify charging voltage",
      "Scan all modules and record which modules can still communicate",
      "Inspect module powers, grounds, and network connectors before replacing a module"
    ],
    safetyNotes: [
      "Network faults can affect drivability and safety systems. Avoid driving if critical warning lights are active."
    ]
  },
  C0035: {
    description: "Left front wheel speed sensor circuit",
    system: "chassis",
    commonCauses: [
      "Wheel speed sensor fault",
      "Damaged sensor wiring near the hub",
      "Tone ring or wheel bearing encoder issue",
      "Connector corrosion"
    ],
    firstChecks: [
      "Compare wheel speed data while slowly moving the vehicle",
      "Inspect wiring near the steering knuckle for rubbing or stretching",
      "Check for related ABS, traction, or stability control warnings"
    ],
    safetyNotes: [
      "ABS or stability control faults can change braking behavior. Diagnose before harsh weather or high-speed driving."
    ]
  }
};

const SYSTEM_BY_PREFIX: Record<string, DtcSystem> = {
  P: "powertrain",
  C: "chassis",
  B: "body",
  U: "network"
};

export function normalizeDtc(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function interpretDtc(rawCode: string): DtcInfo {
  const code = normalizeDtc(rawCode);
  const prefix = code[0] ?? "";
  const fallbackSystem = SYSTEM_BY_PREFIX[prefix] ?? "unknown";
  const definition = DTC_DEFINITIONS[code];

  if (definition) {
    return {
      code,
      description: definition.description,
      system: definition.system ?? fallbackSystem,
      isGeneric: code.length > 1 ? code[1] === "0" : false,
      confidence: "high",
      commonCauses: definition.commonCauses,
      firstChecks: definition.firstChecks,
      safetyNotes: definition.safetyNotes
    };
  }

  return {
    code,
    description: `Unknown ${fallbackSystem} diagnostic trouble code`,
    system: fallbackSystem,
    isGeneric: code.length > 1 ? code[1] === "0" : false,
    confidence: "low",
    commonCauses: [
      "Manufacturer-specific definition may be required",
      "The code may need enhanced scan-tool data",
      "The symptom may be caused by a related upstream fault"
    ],
    firstChecks: [
      "Confirm the code with a full-system scan",
      "Record freeze-frame data before clearing codes",
      "Check manufacturer service information for this exact year, make, model, and engine"
    ],
    safetyNotes: fallbackSystem === "chassis" || fallbackSystem === "network"
      ? ["Chassis and network faults can affect safety systems. Verify drivability risk before road testing."]
      : []
  };
}
