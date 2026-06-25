import { apiFetch } from "./client";

export interface DealerAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function getAllDealers(): Promise<DealerAdmin[]> {
  const response = await apiFetch("/admin/dealers");
  if (!response.ok) throw new Error("Error al obtener dealers");
  return response.json() as Promise<DealerAdmin[]>;
}
