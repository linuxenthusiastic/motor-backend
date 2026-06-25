import { describe, it, expect, vi } from "vitest";
import * as clientModule from "../api/client";
import { resolveInitialRoute } from "../router";

describe("resolveInitialRoute — decisión de pantalla inicial", () => {
  it('retorna "login" cuando no hay token en localStorage', () => {
    vi.spyOn(clientModule, "getToken").mockReturnValue(null);
    expect(resolveInitialRoute()).toBe("login");
  });

  it('retorna "catalog" cuando hay token en localStorage', () => {
    vi.spyOn(clientModule, "getToken").mockReturnValue("eyJ0eXAiOiJKV1QifQ");
    expect(resolveInitialRoute()).toBe("catalog");
  });

  it('retorna "login" cuando el token fue removido (logout)', () => {
    clientModule.setToken("some-token");
    localStorage.removeItem("token");
    expect(resolveInitialRoute()).toBe("login");
  });

  it('retorna "catalog" después de llamar a setToken', () => {
    clientModule.setToken("nuevo-token");
    // No mockeamos getToken — usa localStorage real vía jsdom
    expect(resolveInitialRoute()).toBe("catalog");
  });
});
