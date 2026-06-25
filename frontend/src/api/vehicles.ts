import { apiFetch } from "./client";

export interface Vehicle {
  id: string;
  dealer_id: string | null;
  vin: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
}

export interface VehicleCreate {
  vin: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
}

export async function getAllVehicles(): Promise<Vehicle[]> {
  const response = await apiFetch("/vehicles/all");
  if (!response.ok) throw new Error("Error al obtener vehículos");
  return response.json() as Promise<Vehicle[]>;
}

export async function createVehicle(data: VehicleCreate): Promise<Vehicle> {
  const response = await apiFetch("/vehicles/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Error al crear vehículo");
  }
  return response.json() as Promise<Vehicle>;
}
