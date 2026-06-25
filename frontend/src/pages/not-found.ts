export function renderNotFound(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = `
    <div class="error-page">
      <h1 class="error-page__code">404</h1>
      <p class="error-page__message">Página no encontrada.</p>
      <button class="btn btn--secondary" id="not-found-back">Volver al inicio</button>
    </div>
  `;

  document.querySelector("#not-found-back")?.addEventListener("click", onBack);
}
