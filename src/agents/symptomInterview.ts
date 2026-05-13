import type { DiagnoseInput, DtcInfo, SymptomQuestion } from "./types.js";

export function buildSymptomQuestions(input: DiagnoseInput, dtcs: DtcInfo[]): SymptomQuestion[] {
  const questions: SymptomQuestion[] = [];
  const symptoms = input.symptoms.join(" ").toLowerCase();
  const codes = new Set(dtcs.map((dtc) => dtc.code));

  if (!input.mileage) {
    questions.push({
      id: "mileage",
      question: "What is the current mileage?",
      reason: "Mileage changes the likelihood of wear items such as catalysts, oxygen sensors, plugs, coils, and EVAP components."
    });
  }

  if (input.symptoms.length === 0) {
    questions.push({
      id: "symptoms",
      question: "What changed when the warning light appeared: rough idle, loss of power, fuel smell, noise, overheating, or no symptoms?",
      reason: "Diagnostic trouble codes are more reliable when paired with observed symptoms and freeze-frame conditions."
    });
  }

  if (codes.has("P0420")) {
    questions.push({
      id: "p0420-before-catalyst",
      question: "Were there recent misfire, lean/rich, oil consumption, or exhaust leak symptoms before P0420 appeared?",
      reason: "Catalyst efficiency codes are often downstream of another condition that should be fixed first."
    });
  }

  if (codes.has("P0171") || codes.has("P0174")) {
    questions.push({
      id: "lean-conditions",
      question: "Are fuel trims worse at idle than at 2500 RPM, and does the engine change when the oil cap or intake hoses are moved?",
      reason: "That pattern helps separate vacuum leaks from MAF and fuel delivery faults."
    });
  }

  if (dtcs.some((dtc) => dtc.code.startsWith("P030")) || symptoms.includes("misfire") || symptoms.includes("shake")) {
    questions.push({
      id: "misfire-risk",
      question: "Is the check engine light flashing, and which cylinders show active misfire counters?",
      reason: "A flashing check engine light can mean catalyst-damaging misfire and changes the safe driving recommendation."
    });
  }

  if (symptoms.includes("after rain") || symptoms.includes("wet") || symptoms.includes("wash")) {
    questions.push({
      id: "water-intrusion",
      question: "Did the issue start after rain, a wash, or driving through water?",
      reason: "Water intrusion can cause connector, ignition, sensor, and network faults."
    });
  }

  return dedupeQuestions(questions);
}

function dedupeQuestions(questions: SymptomQuestion[]): SymptomQuestion[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    if (seen.has(question.id)) {
      return false;
    }
    seen.add(question.id);
    return true;
  });
}
