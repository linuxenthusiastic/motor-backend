import { getFavorites } from "../api/ugc";
import { getCatalogVehicles, getMyVehicles, type Vehicle } from "../api/vehicles";
import { renderVehicleDetail } from "./vehicle-detail";

export function renderFavorites(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = `
    <div class="page">
      <div class="page__header">
        <h2 class="page__title">Mis favoritos</h2>
        <div class="page__actions">
          <button class="btn btn--ghost" id="back-btn">&larr; Volver al catálogo</button>
        </div>
      </div>
      <div id="favorites-list" class="page__body">Cargando...</div>
    </div>
  `;

  document.querySelector("#back-btn")?.addEventListener("click", onBack);

  loadFavorites(container, onBack);
}

async function loadFavorites(container: HTMLElement, onBack: () => void): Promise<void> {
  const listEl = document.querySelector("#favorites-list");
  if (!(listEl instanceof HTMLElement)) return;

  try {
    const [favorites, catalogVehicles, myVehicles] = await Promise.all([getFavorites(), getCatalogVehicles(), getMyVehicles()]);
    const vehicles = [...catalogVehicles, ...myVehicles];

    if (favorites.length === 0) {
      listEl.innerHTML = '<p class="page__empty">No tenés vehículos favoritos todavía.</p>';
      return;
    }

    const vehicleMap = new Map<string, Vehicle>(vehicles.map((v) => [v.id, v]));

    listEl.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th class="data-table__head-cell">Marca</th>
            <th class="data-table__head-cell">Modelo</th>
            <th class="data-table__head-cell">Año</th>
            <th class="data-table__head-cell">Patente</th>
            <th class="data-table__head-cell">Color</th>
          </tr>
        </thead>
        <tbody id="favorites-tbody"></tbody>
      </table>
    `;

    const tbody = document.querySelector("#favorites-tbody");
    if (!(tbody instanceof HTMLElement)) return;

    for (const fav of favorites) {
      const vehicle = vehicleMap.get(fav.vehicle_id);
      if (!vehicle) continue;

      const tr = document.createElement("tr");
      tr.className = "data-table__row--clickable";
      tr.innerHTML = `
        <td class="data-table__cell">${vehicle.brand}</td>
        <td class="data-table__cell">${vehicle.model}</td>
        <td class="data-table__cell">${vehicle.year}</td>
        <td class="data-table__cell">${vehicle.plate}</td>
        <td class="data-table__cell">${vehicle.color}</td>
      `;
      tr.addEventListener("click", () => {
        renderVehicleDetail(container, vehicle, () => renderFavorites(container, onBack));
      });
      tbody.appendChild(tr);
    }
  } catch {
    listEl.innerHTML = '<p class="page__error">Error al cargar favoritos.</p>';
  }
}
