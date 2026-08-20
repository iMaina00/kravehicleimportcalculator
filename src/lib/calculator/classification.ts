import type { CategoryCode, VehicleInput } from "./types";

const ELECTRIC_FUELS = new Set(["ELECTRIC"]);
const PETROL_FUELS = new Set(["PETROL", "PETROL_ELECTRIC", "HYBRID", "PLUG_IN_HYBRID"]);
const DIESEL_FUELS = new Set(["DIESEL", "PETROL_DIESEL"]);

export interface Classification {
  code: CategoryCode;
  reason: string;
  warnings: string[];
}

/**
 * Maps a vehicle onto one of the eleven TEMPLATE 2025 tabulations.
 * Only the rules stated in the workbook are applied. Categories the workbook
 * does not let us detect from CRSP columns (school bus, ambulance, prime mover,
 * trailer, special purpose) must be chosen explicitly by the user.
 */
export function classifyVehicle(vehicle: VehicleInput): Classification {
  const warnings: string[] = [];

  if (vehicle.categoryOverride) {
    return { code: vehicle.categoryOverride, reason: "Category selected by the user", warnings };
  }

  if (vehicle.recordType === "motorcycle") {
    return { code: "MOTORCYCLE", reason: "Record comes from the Motor Cycles worksheet", warnings };
  }
  if (vehicle.recordType === "machinery") {
    return { code: "HEAVY_MACHINERY", reason: "Record comes from the Tractors & Graders worksheet", warnings };
  }

  const fuel = (vehicle.fuel ?? "").toUpperCase();
  if (ELECTRIC_FUELS.has(fuel)) {
    return {
      code: "ELECTRIC_PASSENGER",
      reason: "100% electric vehicle (TEMPLATE 2025 electric tabulation)",
      warnings: [
        "REQUIRES VERIFICATION: the electric tabulation covers vehicles for the transport of persons only; confirm the HS code for goods-carrying electric vehicles.",
      ],
    };
  }

  const cc = vehicle.engineCapacityCc ?? null;
  if (cc === null) {
    warnings.push(
      "REQUIRES VERIFICATION: engine capacity is not numeric in the source data, so the engine-capacity tabulation cannot be determined automatically. Select a category manually.",
    );
    return { code: "OVER_1500CC", reason: "Engine capacity unknown - defaulted to the >1500cc tabulation", warnings };
  }

  if (PETROL_FUELS.has(fuel) && cc > 3000) {
    return { code: "LARGE_ENGINE", reason: `Petrol-type fuel above 3000cc (${cc}cc)`, warnings };
  }
  if (DIESEL_FUELS.has(fuel) && cc > 2500) {
    return { code: "LARGE_ENGINE", reason: `Diesel-type fuel above 2500cc (${cc}cc)`, warnings };
  }
  if (!PETROL_FUELS.has(fuel) && !DIESEL_FUELS.has(fuel)) {
    warnings.push(
      `REQUIRES VERIFICATION: fuel "${vehicle.fuel ?? "unknown"}" is not covered by the workbook's petrol/diesel engine thresholds.`,
    );
  }

  if (cc <= 1500) {
    return { code: "UNDER_1500CC", reason: `Engine capacity ${cc}cc does not exceed 1500cc`, warnings };
  }
  return { code: "OVER_1500CC", reason: `Engine capacity ${cc}cc exceeds 1500cc`, warnings };
}
