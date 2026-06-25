import { getNotifications, markAsRead } from "../api/notifications";
import { getFavorites, addFavorite } from "../api/ugc";
import { getCatalogVehicles, searchVehicles, type Vehicle } from "../api/vehicles";
import { renderCreateVehicle } from "./create-vehicle";
import { renderFavorites } from "./favorites";
import { renderMyVehicles } from "./my-vehicles";
import { renderProfile } from "./profile";
import { renderVehicleDetail } from "./vehicle-detail";
import { renderAdmin } from "./admin";
import { getMe } from "../api/auth";
import { debounce } from "../utils/debounce";

export function renderCatalog(container: HTMLElement, onLogout: () => void): void {
  container.innerHTML = `
    <div class="page">
      <div class="page__header">
        <h2 class="page__title">Catálogo</h2>
        <div class="page__actions">
          <div class="notif-bell" id="notif-bell">
            <button class="notif-bell__btn" id="notif-btn" title="Notificaciones">🔔</button>
            <div class="notif-dropdown" id="notif-dropdown">
              <div class="notif-dropdown__header">Notificaciones</div>
              <div id="notif-list"><p class="notif-empty">Cargando...</p></div>
            </div>
          </div>
          <button class="btn btn--ghost" id="profile-btn">Mi perfil</button>
          <button class="btn btn--secondary" id="my-vehicles-btn">Mi garage</button>
          <button class="btn btn--secondary" id="favorites-btn">★ Favoritos</button>
          <button class="btn btn--primary" id="add-vehicle-btn">+ Agregar</button>
          <button class="btn btn--danger" id="logout-btn">Salir</button>
        </div>
      </div>
      <div class="page__search">
        <input
          class="form__input"
          type="search"
          id="catalog-search"
          placeholder="Buscar por marca, modelo, color, patente..."
          autocomplete="off"
        />
      </div>
      <div id="vehicle-list" class="page__body">Cargando...</div>
    </div>
  `;

  setupNotifications();

  document.querySelector("#logout-btn")?.addEventListener("click", onLogout);

  document.querySelector("#add-vehicle-btn")?.addEventListener("click", () => {
    renderCreateVehicle(container, () => renderCatalog(container, onLogout), () => renderCatalog(container, onLogout));
  });

  document.querySelector("#profile-btn")?.addEventListener("click", async () => {
    const dealer = await getMe().catch(() => null);
    if (dealer?.role === "admin") {
      renderAdmin(container, () => renderCatalog(container, onLogout));
    } else {
      renderProfile(container, () => renderCatalog(container, onLogout));
    }
  });

  document.querySelector("#my-vehicles-btn")?.addEventListener("click", () => {
    renderMyVehicles(container, () => renderCatalog(container, onLogout));
  });

  document.querySelector("#favorites-btn")?.addEventListener("click", () => {
    renderFavorites(container, () => renderCatalog(container, onLogout));
  });

  loadCatalog(container, onLogout);

  const searchInput = document.querySelector("#catalog-search") as HTMLInputElement | null;
  const handleSearch = debounce(async (query: string) => {
    const listEl = document.querySelector("#vehicle-list");
    if (!(listEl instanceof HTMLElement)) return;
    if (!query.trim()) {
      loadCatalog(container, onLogout);
      return;
    }
    listEl.innerHTML = "Buscando...";
    try {
      const [results, favorites] = await Promise.all([searchVehicles(query), getFavorites()]);
      const favoritedIds = new Set(favorites.map((f) => f.vehicle_id));
      renderVehicleTable(listEl, results, favoritedIds, container, onLogout);
    } catch {
      listEl.innerHTML = '<p class="page__error">Error en la búsqueda.</p>';
    }
  }, 350);

  searchInput?.addEventListener("input", (e) => {
    handleSearch((e.target as HTMLInputElement).value);
  });
}

function setupNotifications(): void {
  const bell = document.querySelector("#notif-btn");
  const dropdown = document.querySelector("#notif-dropdown");

  bell?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle("notif-dropdown--open");
  });

  document.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest("#notif-bell")) {
      dropdown?.classList.remove("notif-dropdown--open");
    }
  }, { once: false });

  loadNotifications();
}

async function loadNotifications(): Promise<void> {
  const listEl = document.querySelector("#notif-list");
  const bellBtn = document.querySelector("#notif-btn");
  if (!(listEl instanceof HTMLElement)) return;

  try {
    const notifications = await getNotifications();
    const unread = notifications.filter((n) => !n.read);

    const badge = document.querySelector(".notif-bell__badge");
    if (unread.length > 0) {
      if (!badge) {
        bellBtn?.insertAdjacentHTML("afterend", `<span class="notif-bell__badge">${unread.length}</span>`);
      } else {
        badge.textContent = unread.length.toString();
      }
    } else {
      badge?.remove();
    }

    if (notifications.length === 0) {
      listEl.innerHTML = '<p class="notif-empty">Sin notificaciones</p>';
      return;
    }

    listEl.innerHTML = notifications.map((n) => `
      <div class="notif-item ${n.read ? "notif-item--read" : "notif-item--unread"}" data-id="${n.id}">
        <span class="notif-item__dot"></span>
        <span class="notif-item__text">${n.message}</span>
      </div>
    `).join("");

    listEl.querySelectorAll(".notif-item").forEach((item) => {
      item.addEventListener("click", async () => {
        const id = (item as HTMLElement).dataset.id!;
        item.classList.remove("notif-item--unread");
        item.classList.add("notif-item--read");
        await markAsRead(id).catch(() => null);
        loadNotifications();
      });
    });
  } catch {
    listEl.innerHTML = '<p class="notif-empty">Error al cargar</p>';
  }
}

function createVehicleRow(
  vehicle: Vehicle,
  isFav: boolean,
  favoritedIds: Set<string>,
  container: HTMLElement,
  onLogout: () => void,
): HTMLTableRowElement {
  const tr = document.createElement("tr");
  tr.className = "data-table__row--clickable";
  tr.innerHTML = `
    <td class="data-table__cell data-table__cell--icon">
      <button class="btn--icon ${isFav ? "btn--icon--active" : ""} fav-btn"
        data-id="${vehicle.id}"
        title="${isFav ? "Ya en favoritos" : "Agregar a favoritos"}">★</button>
    </td>
    <td class="data-table__cell">${vehicle.brand}</td>
    <td class="data-table__cell">${vehicle.model}</td>
    <td class="data-table__cell">${vehicle.year}</td>
    <td class="data-table__cell">${vehicle.plate}</td>
    <td class="data-table__cell">${vehicle.color}</td>
    <td class="data-table__cell">${vehicle.dealer_email ?? "—"}</td>
  `;

  const favBtn = tr.querySelector(".fav-btn") as HTMLButtonElement;
  favBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (favoritedIds.has(vehicle.id)) return;
    try {
      await addFavorite(vehicle.id);
      favoritedIds.add(vehicle.id);
      favBtn.classList.add("btn--icon--active");
      favBtn.title = "Ya en favoritos";
    } catch {
      // silently ignore
    }
  });

  tr.addEventListener("click", () => {
    renderVehicleDetail(container, vehicle, () => renderCatalog(container, onLogout));
  });

  return tr;
}

function renderVehicleTable(
  listEl: HTMLElement,
  vehicles: Vehicle[],
  favoritedIds: Set<string>,
  container: HTMLElement,
  onLogout: () => void,
): void {
  if (vehicles.length === 0) {
    listEl.innerHTML = '<p class="page__empty">No se encontraron vehículos.</p>';
    return;
  }

  listEl.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th class="data-table__head-cell data-table__head-cell--icon"></th>
          <th class="data-table__head-cell">Marca</th>
          <th class="data-table__head-cell">Modelo</th>
          <th class="data-table__head-cell">Año</th>
          <th class="data-table__head-cell">Patente</th>
          <th class="data-table__head-cell">Color</th>
          <th class="data-table__head-cell">Dealer</th>
        </tr>
      </thead>
      <tbody id="vehicle-tbody"></tbody>
    </table>
  `;

  const tbody = listEl.querySelector("#vehicle-tbody");
  if (!(tbody instanceof HTMLElement)) return;

  for (const vehicle of vehicles) {
    tbody.appendChild(
      createVehicleRow(vehicle, favoritedIds.has(vehicle.id), favoritedIds, container, onLogout),
    );
  }
}

async function loadCatalog(container: HTMLElement, onLogout: () => void): Promise<void> {
  const listEl = document.querySelector("#vehicle-list");
  if (!(listEl instanceof HTMLElement)) return;

  try {
    const [vehicles, favorites] = await Promise.all([getCatalogVehicles(), getFavorites()]);
    const favoritedIds = new Set(favorites.map((f) => f.vehicle_id));
    renderVehicleTable(listEl, vehicles, favoritedIds, container, onLogout);
  } catch {
    listEl.innerHTML = '<p class="page__error">Error al cargar el catálogo.</p>';
  }
}
