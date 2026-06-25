import { apiFetch } from "./client";

export interface Notification {
  id: string;
  dealer_id: string;
  message: string;
  read: boolean;
}

export async function getNotifications(): Promise<Notification[]> {
  const response = await apiFetch("/notifications");
  if (!response.ok) throw new Error("Error al obtener notificaciones");
  return response.json() as Promise<Notification[]>;
}

export async function markAsRead(notificationId: string): Promise<Notification> {
  const response = await apiFetch(`/notifications/${notificationId}/read`, { method: "PATCH" });
  if (!response.ok) throw new Error("Error al marcar notificación");
  return response.json() as Promise<Notification>;
}
