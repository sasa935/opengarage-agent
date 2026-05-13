import type { AgentContext, DiagnoseInput, VehicleProfile } from "./types.js";
import { NhtsaClient } from "../tools/nhtsa.js";

export async function buildVehicleProfile(
  input: DiagnoseInput,
  context: AgentContext,
  nhtsa = new NhtsaClient()
): Promise<VehicleProfile> {
  const fromUser: VehicleProfile = {
    vin: input.vin,
    year: input.year,
    make: input.make,
    model: input.model,
    source: "user",
    warnings: []
  };

  if (!context.network || !input.vin) {
    if (!input.vin) {
      fromUser.warnings.push("No VIN was provided, so the vehicle profile uses only user-supplied fields.");
    }
    return fromUser;
  }

  try {
    const decoded = await nhtsa.decodeVin(input.vin);
    if (!decoded) {
      fromUser.warnings.push("NHTSA VIN decoding returned no vehicle data.");
      return fromUser;
    }

    const year = parseOptionalYear(decoded.ModelYear) ?? input.year;
    const engine = [decoded.EngineModel, decoded.EngineCylinders ? `${decoded.EngineCylinders} cylinders` : undefined]
      .filter(Boolean)
      .join(", ") || undefined;

    const warnings = [...fromUser.warnings];
    if (decoded.ErrorText && decoded.ErrorCode && decoded.ErrorCode !== "0") {
      warnings.push(`NHTSA VIN decoder warning: ${decoded.ErrorText}`);
    }

    return {
      vin: input.vin,
      year,
      make: decoded.Make || input.make,
      model: decoded.Model || input.model,
      trim: decoded.Trim || undefined,
      vehicleType: decoded.VehicleType || undefined,
      bodyClass: decoded.BodyClass || undefined,
      engine,
      fuelType: decoded.FuelTypePrimary || undefined,
      manufacturer: decoded.Manufacturer || undefined,
      source: input.make || input.model || input.year ? "mixed" : "nhtsa",
      warnings
    };
  } catch (error) {
    fromUser.warnings.push(`NHTSA VIN decoding was unavailable: ${error instanceof Error ? error.message : String(error)}`);
    return fromUser;
  }
}

function parseOptionalYear(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
