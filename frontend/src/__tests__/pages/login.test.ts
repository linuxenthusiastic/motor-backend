import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderLogin } from "../../pages/login";
import * as authApi from "../../api/auth";

describe("renderLogin", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("renderiza el formulario con los campos necesarios", () => {
    renderLogin(container, vi.fn(), vi.fn());
    expect(container.querySelector("#login-form")).not.toBeNull();
    expect(container.querySelector("#email")).not.toBeNull();
    expect(container.querySelector("#password")).not.toBeNull();
    expect(container.querySelector("#login-error")).not.toBeNull();
  });

  it("muestra el link de registro cuando se pasa onRegisterClick", () => {
    renderLogin(container, vi.fn(), vi.fn());
    expect(container.querySelector("#go-register")).not.toBeNull();
  });

  it("muestra error visual cuando las credenciales son incorrectas", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(new Error("Credenciales inválidas"));
    renderLogin(container, vi.fn(), vi.fn());

    (container.querySelector("#email") as HTMLInputElement).value = "wrong@test.com";
    (container.querySelector("#password") as HTMLInputElement).value = "wrongpass";
    container.querySelector("#login-form")!.dispatchEvent(new Event("submit"));

    await vi.waitFor(() => {
      const errorEl = container.querySelector("#login-error");
      expect(errorEl?.textContent).toBeTruthy();
    });
  });

  it("no llama a onSuccess cuando las credenciales son incorrectas", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(new Error("401"));
    const onSuccess = vi.fn();
    renderLogin(container, onSuccess, vi.fn());

    (container.querySelector("#email") as HTMLInputElement).value = "x@x.com";
    (container.querySelector("#password") as HTMLInputElement).value = "bad";
    container.querySelector("#login-form")!.dispatchEvent(new Event("submit"));

    await vi.waitFor(() => {
      expect(container.querySelector("#login-error")?.textContent).toBeTruthy();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("llama a onSuccess cuando el login es correcto", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({
      access_token: "valid-jwt",
      token_type: "bearer",
    });
    const onSuccess = vi.fn();
    renderLogin(container, onSuccess, vi.fn());

    (container.querySelector("#email") as HTMLInputElement).value = "user@test.com";
    (container.querySelector("#password") as HTMLInputElement).value = "correctpass";
    container.querySelector("#login-form")!.dispatchEvent(new Event("submit"));

    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it("llama a onRegisterClick al hacer click en el link de registro", () => {
    const onRegister = vi.fn();
    renderLogin(container, vi.fn(), onRegister);

    const link = container.querySelector("#go-register") as HTMLAnchorElement;
    link.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(onRegister).toHaveBeenCalledOnce();
  });
});
