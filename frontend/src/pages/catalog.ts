import { getAllVehicles, type Vehicle } from "../api/vehicles";

export function renderCatalog(container: HTMLElement, onLogout: () => void): void {
  container.innerHTML = `
    <div id="catalog">
      <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h2>Catálogo de vehículos</h2>
        <button id="logout-btn">Cerrar sesión</button>
      </header>
      <div id="vehicle-list">Cargando...</div>
    </div>
  `;

  document.querySelector("#logout-btn")?.addEventListener("click", onLogout);

  loadVehicles();
}

async function loadVehicles(): Promise<void> {
  const listEl = document.querySelector("#vehicle-list");
  if (!(listEl instanceof HTMLElement)) return;

  try {
    const vehicles = await getAllVehicles();

    if (vehicles.length === 0) {
      listEl.innerHTML = "<p>No hay vehículos registrados.</p>";
      return;
    }

    listEl.innerHTML = `
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;">Marca</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;">Modelo</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;">Año</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;">Patente</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;">Color</th>
          </tr>
        </thead>
        <tbody>
          ${vehicles.map(renderRow).join("")}
        </tbody>
      </table>
    `;
  } catch {
    listEl.innerHTML = "<p style='color:red;'>Error al cargar los vehículos.</p>";
  }
}

function renderRow(v: Vehicle): string {
  return `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${v.brand}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${v.model}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${v.year}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${v.plate}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${v.color}</td>
    </tr>
  `;
}
