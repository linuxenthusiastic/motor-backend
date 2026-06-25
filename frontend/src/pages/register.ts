import { register } from "../api/auth";

export function renderRegister(
  container: HTMLElement,
  onSuccess: () => void,
  onLoginClick: () => void,
): void {
  container.innerHTML = `
    <form id="register-form" class="form">
      <h2 class="form__title">Crear cuenta</h2>
      <div class="form__field">
        <label class="form__label" for="name">Nombre</label>
        <input class="form__input" type="text" id="name" required />
      </div>
      <div class="form__field">
        <label class="form__label" for="email">Email</label>
        <input class="form__input" type="email" id="email" required />
      </div>
      <div class="form__field">
        <label class="form__label" for="password">Contraseña</label>
        <input class="form__input" type="password" id="password" required />
      </div>
      <div class="form__actions">
        <button class="btn btn--primary" type="submit">Registrarse</button>
      </div>
      <p class="form__error" id="register-error"></p>
      <p class="form__footer">¿Ya tenés cuenta? <a class="form__link" href="#" id="go-login">Iniciá sesión</a></p>
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
