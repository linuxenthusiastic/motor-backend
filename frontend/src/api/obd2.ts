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

export async function getScansByVehicle(vehicleId: string): Promise<Scan[]> {
  const response = await apiFetch(`/obd2/scans/${vehicleId}`);
  if (!response.ok) throw new Error("Error al obtener scans");
  return response.json() as Promise<Scan[]>;
}
