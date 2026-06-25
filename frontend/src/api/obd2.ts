import { apiFetch } from "./client";

export interface Scan {
  id: string;
  vehicle_id: string;
  odometer: number;
  rpm: number;
  coolant_temp: number;
  battery_voltage: number;
  error_codes: string;
  scan_date: string;
}

export interface ScanCreate {
  vehicle_id: string;
  odometer: number;
  rpm: number;
  coolant_temp: number;
  battery_voltage: number;
  error_codes: string;
  scan_date: string;
}

export async function createScan(data: ScanCreate): Promise<Scan> {
  const response = await apiFetch("/obd2/scans", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Error al registrar scan");
  }
  return response.json() as Promise<Scan>;
}

export async function getScansByVehicle(vehicleId: string): Promise<Scan[]> {
  const response = await apiFetch(`/obd2/scans/${vehicleId}`);
  if (!response.ok) throw new Error("Error al obtener scans");
  return response.json() as Promise<Scan[]>;
}
