import { register } from "../api/auth";

export function renderRegister(
  container: HTMLElement,
  onSuccess: () => void,
  onLoginClick: () => void,
): void {
  container.innerHTML = `
    <form id="register-form">
      <h2>Registro</h2>
      <label for="name">Nombre</label>
      <input type="text" id="name" required />
      <label for="email">Email</label>
      <input type="email" id="email" required />
      <label for="password">Password</label>
      <input type="password" id="password" required />
      <button type="submit">Registrarse</button>
      <p id="register-error" style="color:red;"></p>
      <p>¿Ya tenés cuenta? <a href="#" id="go-login">Iniciá sesión</a></p>
    </form>
  `;

  document.querySelector("#go-login")?.addEventListener("click", (e) => {
    e.preventDefault();
    onLoginClick();
  });

  const form = document.querySelector("#register-form");
  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.querySelector("#name");
    const emailInput = document.querySelector("#email");
    const passwordInput = document.querySelector("#password");
    const errorEl = document.querySelector("#register-error");

    if (
      !(nameInput instanceof HTMLInputElement) ||
      !(emailInput instanceof HTMLInputElement) ||
      !(passwordInput instanceof HTMLInputElement)
    ) return;

    try {
      await register(nameInput.value, emailInput.value, passwordInput.value);
      onSuccess();
    } catch (err) {
      if (errorEl instanceof HTMLElement) {
        errorEl.textContent = err instanceof Error ? err.message : "Error al registrarse";
      }
    }
  });
}
