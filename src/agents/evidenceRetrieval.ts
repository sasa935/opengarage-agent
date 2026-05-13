import type { AgentContext, DtcInfo, EvidenceItem, VehicleProfile } from "./types.js";
import { NhtsaClient } from "../tools/nhtsa.js";

export async function retrieveEvidence(
  vehicle: VehicleProfile,
  dtcs: DtcInfo[],
  context: AgentContext,
  nhtsa = new NhtsaClient()
): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = dtcs.map((dtc) => ({
    source: "OpenGarage DTC rules",
    title: `${dtc.code}: ${dtc.description}`,
    summary: [
      `System: ${dtc.system}.`,
      dtc.isGeneric ? "Generic OBD-II code." : "May be manufacturer-specific.",
      `First checks: ${dtc.firstChecks.slice(0, 2).join("; ")}.`
    ].join(" "),
    confidence: dtc.confidence,
    tags: ["dtc", dtc.system, dtc.code]
  }));

  if (!context.network) {
    evidence.push({
      source: "OpenGarage runtime",
      title: "Network evidence disabled",
      summary: "The report was generated without live NHTSA recall lookup.",
      confidence: "high",
      tags: ["runtime", "offline"]
    });
    return evidence;
  }

  try {
    const recalls = await nhtsa.getRecalls(vehicle);
    for (const recall of recalls.slice(0, 8)) {
      evidence.push({
        source: "NHTSA recalls",
        title: [recall.Component, recall.NHTSACampaignNumber].filter(Boolean).join(" - ") || "Vehicle recall",
        summary: compact([
          recall.Summary,
          recall.Consequence ? `Consequence: ${recall.Consequence}` : undefined,
          recall.Remedy ? `Remedy: ${recall.Remedy}` : undefined
        ]),
        url: "https://www.nhtsa.gov/recalls",
        confidence: "high",
        tags: ["nhtsa", "recall", recall.Component?.toLowerCase() ?? "vehicle"]
      });
    }

    if (recalls.length === 0 && vehicle.year && vehicle.make && vehicle.model) {
      evidence.push({
        source: "NHTSA recalls",
        title: "No matching recalls returned",
        summary: `NHTSA did not return recalls for ${vehicle.year} ${vehicle.make} ${vehicle.model} during this lookup.`,
        url: "https://www.nhtsa.gov/recalls",
        confidence: "medium",
        tags: ["nhtsa", "recall"]
      });
    }
  } catch (error) {
    evidence.push({
      source: "NHTSA recalls",
      title: "Recall lookup unavailable",
      summary: `The live recall lookup failed: ${error instanceof Error ? error.message : String(error)}`,
      url: "https://www.nhtsa.gov/recalls",
      confidence: "low",
      tags: ["nhtsa", "error"]
    });
  }

  return evidence;
}

function compact(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
