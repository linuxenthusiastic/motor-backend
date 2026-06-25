import { apiFetch } from "./client";

export interface Vehicle {
  id: string;
  dealer_id: string | null;
  dealer_email: string | null;
  vin: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  is_published: boolean;
}

export interface VehicleCreate {
  vin: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
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

export async function getMyVehicles(): Promise<Vehicle[]> {
  const response = await apiFetch("/vehicles/my");
  if (!response.ok) throw new Error("Error al obtener tus vehículos");
  return response.json() as Promise<Vehicle[]>;
}

export async function getCatalogVehicles(): Promise<Vehicle[]> {
  const response = await apiFetch("/vehicles/catalog");
  if (!response.ok) throw new Error("Error al obtener el catálogo");
  return response.json() as Promise<Vehicle[]>;
}

export async function publishVehicle(vehicleId: string): Promise<Vehicle> {
  const response = await apiFetch(`/vehicles/${vehicleId}/publish`, { method: "PATCH" });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Error al publicar");
  }
  return response.json() as Promise<Vehicle>;
}

export async function getAllVehiclesAdmin(): Promise<Vehicle[]> {
  const response = await apiFetch("/admin/vehicles");
  if (!response.ok) throw new Error("Error al obtener vehículos");
  return response.json() as Promise<Vehicle[]>;
}

export async function searchVehicles(query: string): Promise<Vehicle[]> {
  const response = await apiFetch(`/vehicles/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Error en la búsqueda");
  return response.json() as Promise<Vehicle[]>;
}
