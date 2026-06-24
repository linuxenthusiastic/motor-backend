import { getMe, type Dealer } from "../api/auth";

export function renderProfile(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = `
    <div id="profile">
      <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h2>Mi perfil</h2>
        <button id="back-btn">&larr; Volver</button>
      </header>
      <div id="profile-content">Cargando...</div>
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
    contentEl.innerHTML = "<p style='color:red;'>Error al cargar el perfil.</p>";
  }
}

function renderDealerCard(dealer: Dealer): string {
  return `
    <table>
      <tbody>
        <tr>
          <td style="padding:8px;color:#666;">Nombre</td>
          <td style="padding:8px;"><strong>${dealer.name}</strong></td>
        </tr>
        <tr>
          <td style="padding:8px;color:#666;">Email</td>
          <td style="padding:8px;">${dealer.email}</td>
        </tr>
        <tr>
          <td style="padding:8px;color:#666;">Rol</td>
          <td style="padding:8px;">${dealer.role}</td>
        </tr>
        <tr>
          <td style="padding:8px;color:#666;">ID</td>
          <td style="padding:8px;font-size:0.85rem;color:#999;">${dealer.id}</td>
        </tr>
      </tbody>
    </table>
  `;
}
