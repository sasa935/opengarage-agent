import type { DtcInfo } from "./types.js";
import { interpretDtc, normalizeDtc } from "../data/dtc.js";

export function interpretDtcs(codes: string[]): DtcInfo[] {
  const uniqueCodes = [...new Set(codes.map(normalizeDtc).filter(Boolean))];
  return uniqueCodes.map(interpretDtc);
}
