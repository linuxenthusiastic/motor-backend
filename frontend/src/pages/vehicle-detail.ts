import { type Vehicle } from "../api/vehicles";
import { getScansByVehicle, type Scan } from "../api/obd2";

export function renderVehicleDetail(
  container: HTMLElement,
  vehicle: Vehicle,
  onBack: () => void,
): void {
  container.innerHTML = `
    <div class="page">
      <div class="page__header">
        <h2 class="page__title">${vehicle.brand} ${vehicle.model} (${vehicle.year})</h2>
        <div class="page__actions">
          <button class="btn btn--ghost" id="back-btn">&larr; Volver</button>
        </div>
      </div>
      <div class="page__meta">
        <div class="profile-card">
          <div class="profile-card__row">
            <span class="profile-card__label">Patente</span>
            <span class="profile-card__value">${vehicle.plate}</span>
          </div>
          <div class="profile-card__row">
            <span class="profile-card__label">VIN</span>
            <span class="profile-card__value">${vehicle.vin}</span>
          </div>
          <div class="profile-card__row">
            <span class="profile-card__label">Color</span>
            <span class="profile-card__value">${vehicle.color}</span>
          </div>
          <div class="profile-card__row">
            <span class="profile-card__label">Dealer</span>
            <span class="profile-card__value">${vehicle.dealer_email ?? "—"}</span>
          </div>
        </div>
      </div>
      <h3 class="page__subtitle">Historial OBD2</h3>
      <div id="scan-list">Cargando...</div>
    </div>
  `;

  document.querySelector("#back-btn")?.addEventListener("click", onBack);

  loadScans(vehicle.id);
}

async function loadScans(vehicleId: string): Promise<void> {
  const listEl = document.querySelector("#scan-list");
  if (!(listEl instanceof HTMLElement)) return;

  try {
    const scans = await getScansByVehicle(vehicleId);

    if (scans.length === 0) {
      listEl.innerHTML = '<p class="page__empty">Sin scans registrados.</p>';
      return;
    }

    listEl.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th class="data-table__head-cell">Fecha</th>
            <th class="data-table__head-cell">Odómetro</th>
            <th class="data-table__head-cell">RPM</th>
            <th class="data-table__head-cell">Temp. refrigerante</th>
            <th class="data-table__head-cell">Voltaje batería</th>
            <th class="data-table__head-cell">Códigos de error</th>
          </tr>
        </thead>
        <tbody>
          ${scans.map(renderScanRow).join("")}
        </tbody>
      </table>
    `;
  } catch {
    listEl.innerHTML = '<p class="page__error">Error al cargar el historial.</p>';
  }
}

function renderScanRow(s: Scan): string {
  const date = new Date(s.scan_date).toLocaleString("es-AR");
  const errors = s.error_codes.trim() ? s.error_codes : "—";
  return `
    <tr>
      <td class="data-table__cell">${date}</td>
      <td class="data-table__cell">${s.odometer} km</td>
      <td class="data-table__cell">${s.rpm}</td>
      <td class="data-table__cell">${s.coolant_temp} °C</td>
      <td class="data-table__cell">${s.battery_voltage} V</td>
      <td class="data-table__cell">${errors}</td>
    </tr>
  `;
}
