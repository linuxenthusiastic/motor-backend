import { login } from "../api/auth";

export function renderLogin(
  container: HTMLElement,
  onSuccess: () => void,
  onRegisterClick?: () => void,
): void {
  container.innerHTML = `
    <form id="login-form">
      <h2>Login</h2>
      <label for="email">Email</label>
      <input type="email" id="email" required />
      <label for="password">Password</label>
      <input type="password" id="password" required />
      <button type="submit">Entrar</button>
      <p id="login-error" style="color: red;"></p>
      ${onRegisterClick ? '<p>¿No tenés cuenta? <a href="#" id="go-register">Registrate</a></p>' : ""}
    </form>
  `;

  document.querySelector("#go-register")?.addEventListener("click", (e) => {
    e.preventDefault();
    onRegisterClick?.();
  });

  const form = document.querySelector("#login-form");
  if (form instanceof HTMLFormElement) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = document.querySelector("#email");
      const passwordInput = document.querySelector("#password");
      const errorEl = document.querySelector("#login-error");

      if (
        emailInput instanceof HTMLInputElement &&
        passwordInput instanceof HTMLInputElement
      ) {
        try {
          await login(emailInput.value, passwordInput.value);
          onSuccess();
        } catch (err) {
          if (errorEl instanceof HTMLElement) {
            errorEl.textContent = "Email o password incorrectos";
          }
        }
      }
    });
  }
}
