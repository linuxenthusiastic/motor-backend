import { getAllDealers } from "../api/admin";
import { getAllVehiclesAdmin } from "../api/vehicles";

type AdminSection = "overview" | "dealers" | "vehicles";

export function renderAdmin(container: HTMLElement, onBack: () => void): void {
  renderAdminSection(container, "overview", onBack);
}

function renderAdminSection(container: HTMLElement, section: AdminSection, onBack: () => void): void {
  container.innerHTML = `
    <div class="page">
      <div class="page__header">
        <h2 class="page__title">Panel de administración</h2>
        <div class="page__actions">
          <button class="btn btn--ghost" id="back-btn">&larr; Volver</button>
        </div>
      </div>
      <div class="page__body">
        <div class="admin-layout">
          <nav class="admin-nav">
            <p class="admin-nav__title">Secciones</p>
            <button class="admin-nav__item ${section === "overview" ? "admin-nav__item--active" : ""}" data-section="overview">
              📊 Resumen
            </button>
            <button class="admin-nav__item ${section === "dealers" ? "admin-nav__item--active" : ""}" data-section="dealers">
              👥 Dealers
            </button>
            <button class="admin-nav__item ${section === "vehicles" ? "admin-nav__item--active" : ""}" data-section="vehicles">
              🚗 Vehículos
            </button>
          </nav>
          <div class="admin-content" id="admin-content">
            <p style="color:var(--text-muted);padding:var(--space-4)">Cargando...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.querySelector("#back-btn")?.addEventListener("click", onBack);

  document.querySelectorAll(".admin-nav__item[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sec = (btn as HTMLElement).dataset.section as AdminSection;
      renderAdminSection(container, sec, onBack);
    });
  });

  const contentEl = document.querySelector("#admin-content") as HTMLElement;

  if (section === "overview") renderOverview(contentEl);
  else if (section === "dealers") renderDealers(contentEl);
  else if (section === "vehicles") renderVehiclesAdmin(contentEl);
}

async function renderOverview(el: HTMLElement): Promise<void> {
  try {
    const [dealers, vehicles] = await Promise.all([getAllDealers(), getAllVehiclesAdmin()]);
    const published = vehicles.filter((v) => v.is_published).length;

    el.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card">
          <span class="stat-card__label">Dealers</span>
          <span class="stat-card__value">${dealers.length}</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">Vehículos totales</span>
          <span class="stat-card__value">${vehicles.length}</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">En catálogo</span>
          <span class="stat-card__value">${published}</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">Privados</span>
          <span class="stat-card__value">${vehicles.length - published}</span>
        </div>
      </div>

      <div class="page" style="margin-top:0">
        <div class="page__header">
          <h3 class="page__title">Últimos dealers registrados</h3>
        </div>
        <div>
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__head-cell">Nombre</th>
                <th class="data-table__head-cell">Email</th>
                <th class="data-table__head-cell">Rol</th>
              </tr>
            </thead>
            <tbody>
              ${dealers.slice(0, 5).map((d) => `
                <tr>
                  <td class="data-table__cell">${d.name}</td>
                  <td class="data-table__cell">${d.email}</td>
                  <td class="data-table__cell">
                    <span class="badge ${d.role === "admin" ? "badge--primary" : "badge--muted"}">${d.role}</span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch {
    el.innerHTML = '<p class="page__error">Error al cargar el resumen.</p>';
  }
}

async function renderDealers(el: HTMLElement): Promise<void> {
  try {
    const dealers = await getAllDealers();

    el.innerHTML = `
      <div class="page" style="margin-top:0">
        <div class="page__header">
          <h3 class="page__title">Todos los dealers</h3>
          <span class="badge badge--muted">${dealers.length} registrados</span>
        </div>
        <div>
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__head-cell">Nombre</th>
                <th class="data-table__head-cell">Email</th>
                <th class="data-table__head-cell">Rol</th>
                <th class="data-table__head-cell data-table__cell--muted">ID</th>
              </tr>
            </thead>
            <tbody>
              ${dealers.map((d) => `
                <tr>
                  <td class="data-table__cell">${d.name}</td>
                  <td class="data-table__cell">${d.email}</td>
                  <td class="data-table__cell">
                    <span class="badge ${d.role === "admin" ? "badge--primary" : "badge--muted"}">${d.role}</span>
                  </td>
                  <td class="data-table__cell data-table__cell--muted">${d.id.slice(0, 8)}…</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch {
    el.innerHTML = '<p class="page__error">Error al cargar dealers.</p>';
  }
}

async function renderVehiclesAdmin(el: HTMLElement): Promise<void> {
  try {
    const vehicles = await getAllVehiclesAdmin();

    el.innerHTML = `
      <div class="page" style="margin-top:0">
        <div class="page__header">
          <h3 class="page__title">Todos los vehículos</h3>
          <span class="badge badge--muted">${vehicles.length} registrados</span>
        </div>
        <div>
          <table class="data-table">
            <thead>
              <tr>
                <th class="data-table__head-cell">Marca</th>
                <th class="data-table__head-cell">Modelo</th>
                <th class="data-table__head-cell">Año</th>
                <th class="data-table__head-cell">Patente</th>
                <th class="data-table__head-cell">Estado</th>
                <th class="data-table__head-cell data-table__cell--muted">Dealer ID</th>
              </tr>
            </thead>
            <tbody>
              ${vehicles.map((v) => `
                <tr>
                  <td class="data-table__cell">${v.brand}</td>
                  <td class="data-table__cell">${v.model}</td>
                  <td class="data-table__cell">${v.year}</td>
                  <td class="data-table__cell">${v.plate}</td>
                  <td class="data-table__cell">
                    ${v.is_published
                      ? '<span class="badge badge--success">Publicado</span>'
                      : '<span class="badge badge--muted">Privado</span>'
                    }
                  </td>
                  <td class="data-table__cell data-table__cell--muted">${v.dealer_id ? v.dealer_id.slice(0, 8) + "…" : "—"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch {
    el.innerHTML = '<p class="page__error">Error al cargar vehículos.</p>';
  }
}
