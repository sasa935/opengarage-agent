export type NhtsaVinValues = {
  VIN?: string;
  ModelYear?: string;
  Make?: string;
  Model?: string;
  Trim?: string;
  VehicleType?: string;
  BodyClass?: string;
  EngineModel?: string;
  EngineCylinders?: string;
  FuelTypePrimary?: string;
  Manufacturer?: string;
  ErrorCode?: string;
  ErrorText?: string;
};

export type NhtsaRecall = {
  Manufacturer?: string;
  NHTSACampaignNumber?: string;
  ReportReceivedDate?: string;
  Component?: string;
  Summary?: string;
  Consequence?: string;
  Remedy?: string;
  Notes?: string;
};

type FetchLike = typeof fetch;

export class NhtsaClient {
  constructor(private readonly fetchImpl: FetchLike = fetch) {}

  async decodeVin(vin: string): Promise<NhtsaVinValues | null> {
    const encodedVin = encodeURIComponent(vin);
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodedVin}?format=json`;
    const payload = await this.fetchJson<{ Results?: NhtsaVinValues[] }>(url);
    return payload.Results?.[0] ?? null;
  }

  async getRecalls(vehicle: { year?: number; make?: string; model?: string }): Promise<NhtsaRecall[]> {
    if (!vehicle.year || !vehicle.make || !vehicle.model) {
      return [];
    }

    const params = new URLSearchParams({
      make: vehicle.make,
      model: vehicle.model,
      modelYear: String(vehicle.year)
    });
    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?${params.toString()}`;
    const payload = await this.fetchJson<{ results?: NhtsaRecall[]; Results?: NhtsaRecall[] }>(url);
    return payload.results ?? payload.Results ?? [];
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await this.fetchImpl(url);
    if (!response.ok) {
      throw new Error(`NHTSA request failed with ${response.status}: ${url}`);
    }
    return response.json() as Promise<T>;
  }
}
