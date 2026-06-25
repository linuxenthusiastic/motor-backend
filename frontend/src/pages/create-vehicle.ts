import { createScan } from "../api/obd2";
import { createVehicle, publishVehicle, type Vehicle } from "../api/vehicles";

interface VehicleData {
  brand: string;
  model: string;
  year: number;
  color: string;
  plate: string;
  vin: string;
}

interface ScanData {
  odometer: number;
  rpm: number;
  coolant_temp: number;
  battery_voltage: number;
  error_codes: string;
  scan_date: string;
}

export function renderCreateVehicle(
  container: HTMLElement,
  onSuccess: () => void,
  onCancel: () => void,
): void {
  renderStep1(container, onSuccess, onCancel);
}

function renderStep1(
  container: HTMLElement,
  onSuccess: () => void,
  onCancel: () => void,
): void {
  container.innerHTML = `
    <div class="wizard">
      ${stepsHeader(1)}
      <div class="wizard__body">
        <h2 class="wizard__title">Datos del vehículo</h2>
        <p class="wizard__subtitle">Ingresá la información básica del auto</p>
        <div class="wizard__grid">
          <div class="form__field">
            <label class="form__label" for="brand">Marca</label>
            <input class="form__input" type="text" id="brand" placeholder="Toyota" required />
          </div>
          <div class="form__field">
            <label class="form__label" for="model">Modelo</label>
            <input class="form__input" type="text" id="model" placeholder="Corolla" required />
          </div>
          <div class="form__field">
            <label class="form__label" for="year">Año</label>
            <input class="form__input" type="number" id="year" min="1900" max="2100" placeholder="2022" required />
          </div>
          <div class="form__field">
            <label class="form__label" for="color">Color</label>
            <input class="form__input" type="text" id="color" placeholder="Blanco" required />
          </div>
          <div class="form__field">
            <label class="form__label" for="plate">Patente</label>
            <input class="form__input" type="text" id="plate" placeholder="AA123BB" required />
          </div>
          <div class="form__field">
            <label class="form__label" for="vin">VIN</label>
            <input class="form__input" type="text" id="vin" placeholder="1HGBH41JXMN109186" required />
          </div>
        </div>
        <p class="form__error" id="step1-error"></p>
        <div class="wizard__actions">
          <button class="btn btn--primary" id="step1-next">Siguiente →</button>
          <button class="btn btn--ghost" id="step1-cancel">Cancelar</button>
        </div>
      </div>
    </div>
  `;

  document.querySelector("#step1-cancel")?.addEventListener("click", onCancel);

  document.querySelector("#step1-next")?.addEventListener("click", () => {
    const get = (id: string) => (document.querySelector(`#${id}`) as HTMLInputElement)?.value.trim();
    const errorEl = document.querySelector("#step1-error");

    const vehicleData: VehicleData = {
      brand: get("brand"),
      model: get("model"),
      year: parseInt(get("year"), 10),
      color: get("color"),
      plate: get("plate"),
      vin: get("vin"),
    };

    if (!vehicleData.brand || !vehicleData.model || !vehicleData.plate || !vehicleData.vin || isNaN(vehicleData.year)) {
      if (errorEl instanceof HTMLElement) errorEl.textContent = "Completá todos los campos";
      return;
    }

    renderStep2(container, vehicleData, onSuccess, onCancel);
  });
}

function renderStep2(
  container: HTMLElement,
  vehicleData: VehicleData,
  onSuccess: () => void,
  onCancel: () => void,
): void {
  const nowLocal = new Date().toISOString().slice(0, 16);

  container.innerHTML = `
    <div class="wizard">
      ${stepsHeader(2)}
      <div class="wizard__body">
        <h2 class="wizard__title">Scan OBD2</h2>
        <p class="wizard__subtitle">Datos leídos del sistema de diagnóstico</p>
        <div class="wizard__grid">
          <div class="form__field">
            <label class="form__label" for="odometer">Odómetro (km)</label>
            <input class="form__input" type="number" id="odometer" min="0" placeholder="85000" required />
          </div>
          <div class="form__field">
            <label class="form__label" for="rpm">RPM</label>
            <input class="form__input" type="number" id="rpm" min="0" placeholder="800" required />
          </div>
          <div class="form__field">
            <label class="form__label" for="coolant_temp">Temp. refrigerante (°C)</label>
            <input class="form__input" type="number" id="coolant_temp" step="0.1" placeholder="90.5" required />
          </div>
          <div class="form__field">
            <label class="form__label" for="battery_voltage">Voltaje batería (V)</label>
            <input class="form__input" type="number" id="battery_voltage" step="0.01" placeholder="12.65" required />
          </div>
          <div class="form__field wizard__grid--full">
            <label class="form__label" for="error_codes">Códigos de error (DTC)</label>
            <input class="form__input" type="text" id="error_codes" placeholder="Ej: P0300, P0420 (dejar vacío si no hay)" />
          </div>
          <div class="form__field wizard__grid--full">
            <label class="form__label" for="scan_date">Fecha y hora del scan</label>
            <input class="form__input" type="datetime-local" id="scan_date" value="${nowLocal}" required />
          </div>
        </div>
        <p class="form__error" id="step2-error"></p>
        <div class="wizard__actions">
          <button class="btn btn--primary" id="step2-next">Ver resumen →</button>
          <button class="btn btn--secondary" id="step2-back">← Volver</button>
        </div>
      </div>
    </div>
  `;

  document.querySelector("#step2-back")?.addEventListener("click", () => {
    renderStep1(container, onSuccess, onCancel);
  });

  document.querySelector("#step2-next")?.addEventListener("click", () => {
    const getNum = (id: string) => parseFloat((document.querySelector(`#${id}`) as HTMLInputElement)?.value);
    const getStr = (id: string) => (document.querySelector(`#${id}`) as HTMLInputElement)?.value.trim();
    const errorEl = document.querySelector("#step2-error");

    const scanData: ScanData = {
      odometer: Math.round(getNum("odometer")),
      rpm: Math.round(getNum("rpm")),
      coolant_temp: getNum("coolant_temp"),
      battery_voltage: getNum("battery_voltage"),
      error_codes: getStr("error_codes"),
      scan_date: new Date(getStr("scan_date")).toISOString(),
    };

    if (isNaN(scanData.odometer) || isNaN(scanData.rpm) || isNaN(scanData.coolant_temp) || isNaN(scanData.battery_voltage)) {
      if (errorEl instanceof HTMLElement) errorEl.textContent = "Completá todos los campos numéricos";
      return;
    }

    renderStep3(container, vehicleData, scanData, onSuccess, onCancel);
  });
}

function renderStep3(
  container: HTMLElement,
  vehicleData: VehicleData,
  scanData: ScanData,
  onSuccess: () => void,
  onCancel: () => void,
): void {
  const scanDateFormatted = new Date(scanData.scan_date).toLocaleString("es-AR");

  container.innerHTML = `
    <div class="wizard">
      ${stepsHeader(3)}
      <div class="wizard__body">
        <h2 class="wizard__title">Confirmar datos</h2>
        <p class="wizard__subtitle">¿Los datos están correctos?</p>

        <div>
          <p class="wizard__confirm-section">Vehículo</p>
          <div class="wizard__confirm-table">
            ${confirmRow("Marca", vehicleData.brand)}
            ${confirmRow("Modelo", vehicleData.model)}
            ${confirmRow("Año", vehicleData.year.toString())}
            ${confirmRow("Color", vehicleData.color)}
            ${confirmRow("Patente", vehicleData.plate)}
            ${confirmRow("VIN", vehicleData.vin)}
          </div>
        </div>

        <div>
          <p class="wizard__confirm-section">Scan OBD2</p>
          <div class="wizard__confirm-table">
            ${confirmRow("Odómetro", `${scanData.odometer} km`)}
            ${confirmRow("RPM", scanData.rpm.toString())}
            ${confirmRow("Temp. refrigerante", `${scanData.coolant_temp} °C`)}
            ${confirmRow("Voltaje batería", `${scanData.battery_voltage} V`)}
            ${confirmRow("Códigos DTC", scanData.error_codes || "—")}
            ${confirmRow("Fecha scan", scanDateFormatted)}
          </div>
        </div>

        <p class="form__error" id="step3-error"></p>
        <div class="wizard__actions">
          <button class="btn btn--primary" id="step3-confirm">✓ Guardar vehículo</button>
          <button class="btn btn--secondary" id="step3-back">← Corregir</button>
        </div>
      </div>
    </div>
  `;

  document.querySelector("#step3-back")?.addEventListener("click", () => {
    renderStep2(container, vehicleData, onSuccess, onCancel);
  });

  document.querySelector("#step3-confirm")?.addEventListener("click", async () => {
    const btn = document.querySelector("#step3-confirm") as HTMLButtonElement;
    const errorEl = document.querySelector("#step3-error");
    btn.disabled = true;
    btn.textContent = "Guardando...";

    try {
      const vehicle = await createVehicle(vehicleData);
      await createScan({ ...scanData, vehicle_id: vehicle.id });
      renderSuccess(container, vehicle, onSuccess);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "✓ Guardar vehículo";
      if (errorEl instanceof HTMLElement) {
        errorEl.textContent = err instanceof Error ? err.message : "Error al guardar";
      }
    }
  });
}

function renderSuccess(container: HTMLElement, vehicle: Vehicle, onSuccess: () => void): void {
  container.innerHTML = `
    <div class="wizard">
      <div class="wizard__success">
        <div class="wizard__success-icon">✓</div>
        <h2 class="wizard__success-title">¡Vehículo registrado!</h2>
        <p class="wizard__success-text">
          <strong>${vehicle.brand} ${vehicle.model} ${vehicle.year}</strong> fue guardado en tu perfil.
          ¿Querés publicarlo al catálogo para que otros dealers lo vean?
        </p>
        <div class="wizard__success-actions">
          <button class="btn btn--accent" id="publish-btn">Publicar al catálogo</button>
          <button class="btn btn--secondary" id="skip-btn">Ahora no</button>
        </div>
        <p class="form__error" id="publish-error"></p>
      </div>
    </div>
  `;

  document.querySelector("#skip-btn")?.addEventListener("click", onSuccess);

  document.querySelector("#publish-btn")?.addEventListener("click", async () => {
    const btn = document.querySelector("#publish-btn") as HTMLButtonElement;
    const errorEl = document.querySelector("#publish-error");
    btn.disabled = true;
    btn.textContent = "Publicando...";

    try {
      await publishVehicle(vehicle.id);
      onSuccess();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Publicar al catálogo";
      if (errorEl instanceof HTMLElement) {
        errorEl.textContent = err instanceof Error ? err.message : "Error al publicar";
      }
    }
  });
}

function stepsHeader(active: 1 | 2 | 3): string {
  const done = (n: number) => active > n;
  const stepClass = (n: number) =>
    `wizard__step${active === n ? " wizard__step--active" : ""}${done(n) ? " wizard__step--done" : ""}`;
  const connClass = (n: number) => `wizard__connector${done(n) ? " wizard__connector--done" : ""}`;

  return `
    <div class="wizard__steps">
      <div class="${stepClass(1)}">
        <span class="wizard__step-num">${done(1) ? "✓" : "1"}</span>
        <span class="wizard__step-label">Vehículo</span>
      </div>
      <div class="${connClass(1)}"></div>
      <div class="${stepClass(2)}">
        <span class="wizard__step-num">${done(2) ? "✓" : "2"}</span>
        <span class="wizard__step-label">Scan OBD2</span>
      </div>
      <div class="${connClass(2)}"></div>
      <div class="${stepClass(3)}">
        <span class="wizard__step-num">3</span>
        <span class="wizard__step-label">Confirmar</span>
      </div>
    </div>
  `;
}

function confirmRow(label: string, value: string): string {
  return `
    <div class="wizard__confirm-row">
      <span class="wizard__confirm-label">${label}</span>
      <span class="wizard__confirm-value">${value}</span>
    </div>
  `;
}
