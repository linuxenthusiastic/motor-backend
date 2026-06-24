import { type Vehicle } from "../api/vehicles";
import { getScansByVehicle, type Scan } from "../api/obd2";

export function renderVehicleDetail(
  container: HTMLElement,
  vehicle: Vehicle,
  onBack: () => void,
): void {
  container.innerHTML = `
    <div id="vehicle-detail">
      <button id="back-btn">&larr; Volver</button>
      <h2>${vehicle.brand} ${vehicle.model} (${vehicle.year})</h2>
      <table style="margin-bottom:1.5rem;">
        <tbody>
          <tr><td><strong>Patente</strong></td><td>${vehicle.plate}</td></tr>
          <tr><td><strong>VIN</strong></td><td>${vehicle.vin}</td></tr>
          <tr><td><strong>Color</strong></td><td>${vehicle.color}</td></tr>
        </tbody>
      </table>
      <h3>Historial OBD2</h3>
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
      listEl.innerHTML = "<p>Sin scans registrados.</p>";
      return;
    }

    listEl.innerHTML = `
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;">Fecha</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;">Odómetro</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;">RPM</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;">Temp. refrigerante</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;">Voltaje batería</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;">Códigos de error</th>
          </tr>
        </thead>
        <tbody>
          ${scans.map(renderScanRow).join("")}
        </tbody>
      </table>
    `;
  } catch {
    listEl.innerHTML = "<p style='color:red;'>Error al cargar el historial.</p>";
  }
}

function renderScanRow(s: Scan): string {
  const date = new Date(s.scan_date).toLocaleString("es-AR");
  const errors = s.error_codes.trim() ? s.error_codes : "—";
  return `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${date}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${s.odometer} km</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${s.rpm}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${s.coolant_temp} °C</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${s.battery_voltage} V</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${errors}</td>
    </tr>
  `;
}
