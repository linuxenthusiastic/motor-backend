import { publishVehicle, getMyVehicles } from "../api/vehicles";
import { renderVehicleDetail } from "./vehicle-detail";

export function renderMyVehicles(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = `
    <div class="page">
      <div class="page__header">
        <h2 class="page__title">Mis vehículos</h2>
        <div class="page__actions">
          <button class="btn btn--ghost" id="back-btn">&larr; Volver</button>
        </div>
      </div>
      <div id="my-vehicle-list" class="page__body">Cargando...</div>
    </div>
  `;

  document.querySelector("#back-btn")?.addEventListener("click", onBack);
  loadMyVehicles(container, onBack);
}

async function loadMyVehicles(container: HTMLElement, onBack: () => void): Promise<void> {
  const listEl = document.querySelector("#my-vehicle-list");
  if (!(listEl instanceof HTMLElement)) return;

  try {
    const vehicles = await getMyVehicles();

    if (vehicles.length === 0) {
      listEl.innerHTML = '<p class="page__empty">No tenés vehículos registrados todavía.</p>';
      return;
    }

    listEl.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th class="data-table__head-cell">Marca</th>
            <th class="data-table__head-cell">Modelo</th>
            <th class="data-table__head-cell">Año</th>
            <th class="data-table__head-cell">Patente</th>
            <th class="data-table__head-cell">Estado</th>
            <th class="data-table__head-cell"></th>
          </tr>
        </thead>
        <tbody id="my-vehicle-tbody"></tbody>
      </table>
    `;

    const tbody = document.querySelector("#my-vehicle-tbody");
    if (!(tbody instanceof HTMLElement)) return;

    for (const vehicle of vehicles) {
      const tr = document.createElement("tr");
      tr.className = "data-table__row--clickable";
      tr.innerHTML = `
        <td class="data-table__cell">${vehicle.brand}</td>
        <td class="data-table__cell">${vehicle.model}</td>
        <td class="data-table__cell">${vehicle.year}</td>
        <td class="data-table__cell">${vehicle.plate}</td>
        <td class="data-table__cell">
          ${vehicle.is_published
            ? '<span class="badge badge--success">Publicado</span>'
            : '<span class="badge badge--muted">Privado</span>'
          }
        </td>
        <td class="data-table__cell">
          ${!vehicle.is_published
            ? `<button class="btn btn--accent publish-btn" data-id="${vehicle.id}" style="padding:5px 10px;font-size:0.75rem;">Publicar</button>`
            : ""
          }
        </td>
      `;

      tr.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest(".publish-btn")) return;
        renderVehicleDetail(container, vehicle, () => renderMyVehicles(container, onBack));
      });

      tbody.appendChild(tr);
    }

    document.querySelectorAll(".publish-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const vehicleId = (btn as HTMLElement).dataset.id!;
        (btn as HTMLButtonElement).disabled = true;
        (btn as HTMLButtonElement).textContent = "...";
        try {
          await publishVehicle(vehicleId);
          loadMyVehicles(container, onBack);
        } catch {
          (btn as HTMLButtonElement).disabled = false;
          (btn as HTMLButtonElement).textContent = "Publicar";
        }
      });
    });
  } catch {
    listEl.innerHTML = '<p class="page__error">Error al cargar tus vehículos.</p>';
  }
}
