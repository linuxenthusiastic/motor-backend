import { getMe, type Dealer } from "../api/auth";

export function renderProfile(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = `
    <div class="page">
      <div class="page__header">
        <h2 class="page__title">Mi perfil</h2>
        <div class="page__actions">
          <button class="btn btn--ghost" id="back-btn">&larr; Volver</button>
        </div>
      </div>
      <div id="profile-content" class="page__body">Cargando...</div>
    </div>
  `;

  document.querySelector("#back-btn")?.addEventListener("click", onBack);

  loadProfile();
}

async function loadProfile(): Promise<void> {
  const contentEl = document.querySelector("#profile-content");
  if (!(contentEl instanceof HTMLElement)) return;

  try {
    const dealer = await getMe();
    contentEl.innerHTML = renderDealerCard(dealer);
  } catch {
    contentEl.innerHTML = '<p class="page__error">Error al cargar el perfil.</p>';
  }
}

function renderDealerCard(dealer: Dealer): string {
  return `
    <div class="profile-card">
      <div class="profile-card__row">
        <span class="profile-card__label">Nombre</span>
        <span class="profile-card__value">${dealer.name}</span>
      </div>
      <div class="profile-card__row">
        <span class="profile-card__label">Email</span>
        <span class="profile-card__value">${dealer.email}</span>
      </div>
      <div class="profile-card__row">
        <span class="profile-card__label">Rol</span>
        <span class="profile-card__value">${dealer.role}</span>
      </div>
      <div class="profile-card__row">
        <span class="profile-card__label">ID</span>
        <span class="profile-card__value profile-card__value--muted">${dealer.id}</span>
      </div>
    </div>
  `;
}
