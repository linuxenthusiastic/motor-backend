import { describe, it, expect, vi } from "vitest";
import { apiFetch, getToken, setToken } from "../../api/client";

const mockOk = (body = "{}") =>
  vi.mocked(global.fetch).mockResolvedValue(new Response(body, { status: 200 }));

describe("apiFetch — inyección de token", () => {
  it("incluye Authorization header cuando hay token en localStorage", async () => {
    setToken("mi-jwt-de-prueba");
    mockOk();

    await apiFetch("/test");

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer mi-jwt-de-prueba");
  });

  it("no incluye Authorization header cuando localStorage está vacío", async () => {
    mockOk();

    await apiFetch("/test");

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("incluye Content-Type application/json siempre", async () => {
    mockOk();

    await apiFetch("/vehicles/catalog");

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("llama a la URL correcta concatenando el path", async () => {
    mockOk();

    await apiFetch("/auth/login");

    const [url] = vi.mocked(global.fetch).mock.calls[0];
    expect(url as string).toContain("/auth/login");
  });

  it("pasa el method y body correctamente", async () => {
    mockOk();
    const body = JSON.stringify({ email: "a@b.com", password: "123" });

    await apiFetch("/auth/login", { method: "POST", body });

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    expect((options as RequestInit).method).toBe("POST");
    expect((options as RequestInit).body).toBe(body);
  });
});

describe("getToken / setToken", () => {
  it("retorna null cuando no hay token", () => {
    expect(getToken()).toBeNull();
  });

  it("retorna el token guardado con setToken", () => {
    setToken("abc123");
    expect(getToken()).toBe("abc123");
  });
});
