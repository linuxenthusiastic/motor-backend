import { apiFetch, setToken } from "./client";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Credenciales inválidas");
  }

  const data: LoginResponse = await response.json();
  setToken(data.access_token);
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const response = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Error al registrarse");
  }
}
