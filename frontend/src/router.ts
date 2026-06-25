import { getToken } from "./api/client";

export type Route = "login" | "catalog";

export function resolveInitialRoute(): Route {
  return getToken() !== null ? "catalog" : "login";
}
