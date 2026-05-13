import { z } from "zod";

export const diagnoseInputSchema = z.object({
  vin: z.string().min(5).optional(),
  year: z.number().int().min(1980).max(2100).optional(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  mileage: z.number().int().nonnegative().optional(),
  dtcs: z.array(z.string().min(3)).default([]),
  symptoms: z.array(z.string().min(1)).default([]),
  includeNetworkEvidence: z.boolean().default(true)
});

export type DiagnoseInput = z.infer<typeof diagnoseInputSchema>;

export type Confidence = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type DtcSystem = "powertrain" | "chassis" | "body" | "network" | "unknown";

export type VehicleProfile = {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  vehicleType?: string;
  bodyClass?: string;
  engine?: string;
  fuelType?: string;
  manufacturer?: string;
  source: "user" | "nhtsa" | "mixed";
  warnings: string[];
};

export type DtcInfo = {
  code: string;
  description: string;
  system: DtcSystem;
  isGeneric: boolean;
  confidence: Confidence;
  commonCauses: string[];
  firstChecks: string[];
  safetyNotes: string[];
};

export type EvidenceItem = {
  source: string;
  title: string;
  summary: string;
  url?: string;
  confidence: Confidence;
  tags: string[];
};

export type SymptomQuestion = {
  id: string;
  question: string;
  reason: string;
};

export type SafetyFinding = {
  level: RiskLevel;
  title: string;
  rationale: string;
  recommendation: string;
};

export type DiagnosticStep = {
  order: number;
  title: string;
  purpose: string;
  checks: string[];
  expectedEvidence: string[];
  stopIf?: string;
};

export type VerificationPlan = {
  checks: string[];
  roadTestGuidance: string[];
  evidenceToCapture: string[];
};

export type LlmCaseReview = {
  provider: string;
  model: string;
  summary: string;
  likelyDiagnosticDirection: string[];
  evidenceGaps: string[];
  cautions: string[];
};

export type DiagnosticReport = {
  generatedAt: string;
  input: DiagnoseInput;
  vehicle: VehicleProfile;
  dtcs: DtcInfo[];
  evidence: EvidenceItem[];
  questions: SymptomQuestion[];
  safety: SafetyFinding[];
  plan: DiagnosticStep[];
  verification: VerificationPlan;
  aiReview?: LlmCaseReview;
  assumptions: string[];
};

export type AgentContext = {
  network: boolean;
  now: Date;
};
