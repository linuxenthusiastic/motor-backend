# Motora — Resumen del Proyecto

## Descripción general

Plataforma web para concesionarias (dealers) que permite registrar vehículos con diagnóstico OBD2, publicarlos en un catálogo compartido, buscarlos con Elasticsearch, marcarlos como favoritos y recibir notificaciones automáticas.

**Stack:**
| Capa | Tecnología |
|------|------------|
| Backend | Python 3.12 · FastAPI · SQLAlchemy 2.0 |
| Base de datos | PostgreSQL 16 (múltiples schemas) |
| Caché | Redis 7 |
| Búsqueda | Elasticsearch 8 |
| Frontend | TypeScript · Vite (sin framework) |
| Infraestructura | Docker Compose · Nginx |

---

## Arquitectura general

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (Vite)                   │
│  TypeScript vanilla — navegación por funciones       │
│  Servido por Nginx en producción (puerto 80)         │
└─────────────────────┬────────────────────────────────┘
                      │ REST / JSON
┌─────────────────────▼────────────────────────────────┐
│                Backend (FastAPI)                     │
│                                                      │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  auth  │ │ vehicles │ │   obd2   │ │ catalog  │  │
│  ├────────┤ ├──────────┤ ├──────────┤ ├──────────┤  │
│  │  ugc   │ │  admin   │ │  notif.  │ │  shared  │  │
│  └────────┘ └──────────┘ └──────────┘ └──────────┘  │
└────────┬──────────────┬──────────────────────────────┘
         │              │
  ┌──────▼──────┐ ┌─────▼──────┐ ┌──────────────────┐
  │ PostgreSQL  │ │   Redis    │ │  Elasticsearch   │
  │  (datos)    │ │  (caché)   │ │  (búsqueda)      │
  └─────────────┘ └────────────┘ └──────────────────┘
```

---

## Módulos de dominio (Backend)

Cada módulo sigue la misma estructura interna:

```
app/<dominio>/
  models.py      — Modelo ORM (SQLAlchemy)
  repository.py  — Acceso a datos (queries SQL)
  router.py      — Endpoints HTTP (FastAPI)
  schemas.py     — Validación entrada/salida (Pydantic)
```

| Módulo | Schema PostgreSQL | Responsabilidad |
|--------|------------------|-----------------|
| `auth` | `auth` | Registro, login JWT, perfil de dealer |
| `vehicles` | `obd2` | CRUD de vehículos, publicación, búsqueda |
| `obd2` | `obd2` | Scans de diagnóstico OBD2 por vehículo |
| `catalog` | `catalog` | Modelos de autos (gestionado por admin) |
| `ugc` | `ugc` | Favoritos por dealer |
| `notifications` | `notifications` | Notificaciones in-app |
| `admin` | — | Vistas de administración |

---

## Patrones de diseño — Backend

### 1. Repository Pattern

**Dónde:** `app/<dominio>/repository.py` en todos los módulos.

Encapsula toda la lógica de acceso a la base de datos en una clase. Los routers **nunca** usan SQLAlchemy directamente — toda query pasa por el repositorio correspondiente.

```
Router → VehicleRepository → SQLAlchemy → PostgreSQL
```

```python
class VehicleRepository:
    def __init__(self, db: Session): ...
    def create_vehicle(...): ...
    def get_published_vehicles(): ...
    def publish_vehicle(vehicle_id, dealer_id): ...
```

**Por qué:** si se cambia el ORM o la base de datos, solo se modifica el repositorio; el router no se toca. También facilita el testing unitario mockeando solo el repositorio.

---

### 2. Observer Pattern / Event Bus

**Dónde:** `app/shared/events.py` + `app/notifications/observer.py`

Implementa un bus de eventos que desacopla productores y consumidores. Cuando el módulo `obd2` registra un scan, **no sabe nada** del módulo `notifications` — solo publica un evento.

```
obd2/router.py
    │
    │  event_bus.publish("scan_created", { dealer_id, odometer })
    ▼
EventBus  ──► NotificationObserver.handle("scan_created", payload)
                    │
                    ▼
              NotificationRepository.create_notification(dealer_id, msg)
```

**Componentes:**

```python
# app/shared/events.py
class EventObserver(ABC):
    @abstractmethod
    def handle(self, event_type: str, payload: dict) -> None: ...

class EventBus:
    def subscribe(self, observer: EventObserver) -> None: ...
    def publish(self, event_type: str, payload: dict) -> None:
        for observer in self._observers:
            observer.handle(event_type, payload)

event_bus = EventBus()  # instancia global compartida

# app/notifications/observer.py
class NotificationObserver(EventObserver):
    def handle(self, event_type, payload):
        if event_type == "scan_created":
            repo.create_notification(dealer_id=..., message=f"Nuevo scan: {odometer} km")
```

**Por qué:** agregar nuevos efectos a un scan (enviar email, actualizar estadísticas) solo requiere crear un nuevo Observer y suscribirlo — sin tocar el módulo `obd2`.

---

### 3. Dependency Injection (FastAPI)

**Dónde:** todos los routers via `Depends()`.

FastAPI resuelve automáticamente las dependencias en cada request:

```python
@router.post("/vehicles/")
def create_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),                 # sesión DB: abre y cierra sola
    current_dealer = Depends(get_current_dealer),  # valida JWT y devuelve el dealer
):
```

Dependencias encadenadas: `get_current_dealer` → valida token JWT → consulta DB → devuelve `Dealer`.  
`require_admin` → llama a `get_current_dealer` → verifica `dealer.role == "admin"`.

---

### 4. Cache-Aside Pattern

**Dónde:** `app/shared/cache.py`, routers de `vehicles` y `catalog`.

```
GET /vehicles/catalog
    │
    ├── Redis.get("vehicles:catalog") → hit → devuelve JSON cacheado
    │
    └── miss → PostgreSQL → Redis.set(key, data, ttl=60s) → devuelve data
```

La caché se **invalida manualmente** al escribir (no espera el TTL):

```python
# Al crear o publicar un vehículo:
redis_client.delete("vehicles:catalog")
```

| Clave Redis | Contenido | TTL |
|-------------|-----------|-----|
| `vehicles:catalog` | Lista de vehículos publicados con email del dealer | 60 s |
| `catalog:all` | Lista de modelos de auto | 60 s |

---

### 5. Elasticsearch — Búsqueda full-text

**Dónde:** `app/shared/search.py` + endpoint `GET /vehicles/search?q=`.

Los vehículos se indexan en Elasticsearch cuando son publicados. Al iniciar el servidor, se re-indexan todos los publicados existentes.

```
PATCH /vehicles/{id}/publish
    │
    ├── PostgreSQL: vehicle.is_published = True
    ├── Redis: delete("vehicles:catalog")
    └── Elasticsearch: index_vehicle({ brand, model, plate, ... })

GET /vehicles/search?q=toyota
    │
    └── Elasticsearch: multi_match query con fuzziness=AUTO
        fields: brand^2, model^2, color, plate, vin, dealer_email
```

El campo `^2` aumenta el peso de `brand` y `model` en el ranking de resultados.  
`fuzziness: AUTO` permite errores de tipeo ("toytta" encuentra "toyota").

Si Elasticsearch no está disponible, el endpoint devuelve `[]` sin crashear el resto de la app (manejo de errores con `try/except` silencioso).

---

### 6. Multi-schema PostgreSQL

Cada dominio tiene su propio schema, creados en `init-db.sql`:

```sql
CREATE SCHEMA auth;          -- dealers
CREATE SCHEMA obd2;          -- vehicles, obd2_scan
CREATE SCHEMA catalog;       -- car_models
CREATE SCHEMA ugc;           -- favorites
CREATE SCHEMA notifications; -- notifications
```

Las tablas se crean automáticamente al iniciar con `Base.metadata.create_all()`.  
Todas las PKs son UUIDs generados en Python (`str(uuid.uuid4())`).

**Relaciones:**
```
auth.dealers (1) ──── (N) obd2.vehicles
obd2.vehicles (1) ──── (N) obd2.obd2_scan
auth.dealers (1) ──── (N) ugc.favorites (N) ──── obd2.vehicles
auth.dealers (1) ──── (N) notifications.notifications
```

---

## Patrones de diseño — Frontend

El frontend es TypeScript vanilla con Vite. No hay framework — las páginas son **funciones** que reciben un contenedor HTML y callbacks de navegación.

### 1. Factory Function

**Dónde:** `src/pages/catalog.ts` → `createVehicleRow()`

En lugar de duplicar el HTML de cada fila de la tabla, una función factory crea el elemento con sus event listeners encapsulados:

```typescript
function createVehicleRow(
  vehicle: Vehicle,
  isFav: boolean,
  favoritedIds: Set<string>,
  container: HTMLElement,
  onLogout: () => void,
): HTMLTableRowElement {
  const tr = document.createElement("tr");
  tr.innerHTML = `...`;
  tr.addEventListener("click", () => renderVehicleDetail(...));
  // ...
  return tr;
}
```

Se usa tanto para el catálogo completo como para los resultados de búsqueda — misma factory, mismo resultado.

Otro ejemplo: `confirmRow()` y `renderScanRow()` en el wizard son factories de strings HTML.

---

### 2. Strategy Pattern (navegación por callbacks)

**Dónde:** toda la navegación del frontend.

Cada función de renderizado recibe como parámetros **qué hacer** al navegar (en lugar de depender de un router global). Esto es el patrón Strategy: el comportamiento de navegación se inyecta como función.

```typescript
// La "estrategia" de navegación se pasa como argumento
renderCatalog(container, () => {
  localStorage.removeItem("token");
  showLogin();  // ← estrategia de logout
});

renderVehicleDetail(
  container,
  vehicle,
  () => renderCatalog(container, onLogout)  // ← estrategia de "volver"
);
```

Ventaja: `renderVehicleDetail` no sabe de dónde viene el usuario — puede volver al catálogo, a favoritos, o a cualquier otra pantalla.

---

### 3. Facade Pattern

**Dónde:** `src/api/client.ts` → `apiFetch()`

Oculta la complejidad de `fetch` detrás de una interfaz simple: agrega el `Authorization` header automáticamente desde `localStorage`.

```typescript
// Sin facade:
fetch(url, {
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
  }
})

// Con facade:
apiFetch("/vehicles/catalog")
```

Cada archivo de `src/api/` es una extensión del facade: agrupa las llamadas por dominio (`vehicles.ts`, `obd2.ts`, `auth.ts`) exponiendo funciones tipadas.

---

### 4. Debounce (patrón funcional)

**Dónde:** `src/utils/debounce.ts` + buscador del catálogo.

Evita llamar a la API en cada tecla del buscador. La función espera 350 ms desde la última pulsación antes de ejecutar la búsqueda:

```typescript
// src/utils/debounce.ts
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// uso en catalog.ts
const handleSearch = debounce(async (query: string) => {
  const results = await searchVehicles(query);
  renderVehicleTable(...);
}, 350);

searchInput.addEventListener("input", (e) => handleSearch(e.target.value));
```

---

### 5. State Machine (Wizard)

**Dónde:** `src/pages/create-vehicle.ts`

El wizard de creación de vehículo implementa una máquina de estados explícita. Cada paso es un **estado** con su propio HTML, validaciones y transiciones:

```
Estado 1: renderStep1()          Estado 2: renderStep2()          Estado 3: renderStep3()
┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
│  Datos del vehículo  │        │    Scan OBD2         │        │  Confirmación        │
│                      │ Next → │                      │ Next → │                      │
│  brand, model, year  │        │  odometer, rpm,      │        │  Resumen completo    │
│  color, plate, vin   │ ← Back │  coolant, battery,   │ ← Back │                      │
│                      │        │  error_codes, date   │        │  [Guardar]           │
└──────────────────────┘        └──────────────────────┘        └──────────────────────┘
```

**Características clave:**

- **El estado viaja como argumentos de función** — `vehicleData` y `scanData` se pasan de step a step, no hay estado global. Si el usuario vuelve al paso 1, los datos de los siguientes pasos se descartan.
- **Cada paso valida antes de avanzar** — si falta un campo, muestra el error y no transiciona.
- **Transición "back" reconstruye el paso anterior** — se vuelve a renderizar el paso 1 o 2 con los mismos datos ya ingresados.
- **Las acciones finales son secuenciales:**

```typescript
// renderStep3 — confirm handler
const vehicle = await createVehicle(vehicleData);         // POST /vehicles/
await createScan({ ...scanData, vehicle_id: vehicle.id }); // POST /obd2/scans
//   └── event_bus.publish("scan_created") → notificación automática
renderSuccess(container, vehicle, onSuccess);  // transición al estado final
```

---

## Flujo principal: registro de un vehículo

```
[Wizard paso 1] Datos del vehículo (brand, model, year, color, plate, vin)
        │  validación local (campos vacíos, año numérico)
        ▼
[Wizard paso 2] Scan OBD2 (odometer, rpm, coolant_temp, battery_voltage, error_codes, scan_date)
        │  validación local (valores numéricos)
        ▼
[Wizard paso 3] Confirmación — resumen de ambos pasos
        │
        ├─ POST /vehicles/
        │       └─ crea Vehicle en PostgreSQL (obd2 schema)
        │       └─ invalida Redis "vehicles:catalog"
        │
        ├─ POST /obd2/scans
        │       └─ crea OBD2Scan ligado al vehículo
        │       └─ event_bus.publish("scan_created", { dealer_id, odometer })
        │               └─ NotificationObserver.handle()
        │                       └─ crea Notification en PostgreSQL
        │
        └─ [opcional] PATCH /vehicles/{id}/publish
                └─ vehicle.is_published = True
                └─ invalida Redis "vehicles:catalog"
                └─ index_vehicle() → Elasticsearch
```

---

## Flujo de búsqueda en el catálogo

```
Usuario escribe en el buscador
        │
        │  debounce(350ms)
        ▼
GET /vehicles/search?q=toyota
        │
        └─ Elasticsearch multi_match
               fields: brand^2, model^2, color, plate, vin, dealer_email
               fuzziness: AUTO
               │
               └─ devuelve lista de Vehicle[]
                       │
                       └─ createVehicleRow() × N  ← Factory Pattern
                               └─ tabla con resultados
```

Si el campo de búsqueda se vacía → vuelve al catálogo completo (desde PostgreSQL/Redis).

---

## Testing

### Backend — pytest

**Setup** (`tests/conftest.py`):
- Mockea Redis y Elasticsearch a nivel de módulo **antes** de importar `main.py`, usando `unittest.mock.patch`. Esto permite correr todos los tests sin esos servicios levantados.
- Usa una base de datos separada `motora_test` (PostgreSQL) — crea schemas y tablas automáticamente.
- Fixture `clean_tables` (autouse) borra todas las filas antes de cada test → cada test parte de estado limpio.
- Fixtures encadenadas: `db` → `client` → `registered_dealer` → `auth_token` → `auth_headers`.

```
tests/
  conftest.py          — fixtures: engine, client, mocks, clean_tables
  test_auth.py         — registro, login, email duplicado, /me
  test_vehicles.py     — JWT 401/200, publicación, catálogo, email del dealer
  test_obd2.py         — integridad: vehicle inexistente/ajeno (403), sin token (401)
  test_repositories.py — DealerRepo, VehicleRepo, OBD2Repo método a método
```

**Cobertura de flujos críticos:**

| Test | Qué verifica |
|------|-------------|
| `test_register_email_duplicado_retorna_400` | No se pueden crear dos cuentas con el mismo email |
| `test_login_password_incorrecta_retorna_401` | El hash bcrypt se verifica correctamente |
| `test_crear_vehiculo_sin_token_retorna_401` | JWT requerido para rutas protegidas |
| `test_crear_scan_vehicle_inexistente_retorna_403` | Integridad: no se puede escanear un vehículo que no existe |
| `test_crear_scan_vehicle_ajeno_retorna_403` | Autorización: un dealer no puede escanear vehículos de otro |
| `test_publish_vehicle_ajeno_retorna_none` | Repository devuelve None al intentar publicar un vehículo ajeno |
| `test_catalogo_incluye_email_del_dealer` | El JOIN dealer→vehicle funciona correctamente |

**Correr:**
```bash
# Crear la DB de test (una sola vez)
docker exec $(docker ps -qf "name=db") psql -U motora -c "CREATE DATABASE motora_test;"

pip install -r requirements-dev.txt
pytest tests/ -v
```

---

### Frontend — Vitest

**Setup** (`frontend/vite.config.ts`):
- Entorno `jsdom` — simula el DOM del browser.
- `setupFiles` inicializa `global.fetch` como `vi.fn()` y limpia mocks + localStorage antes de cada test.

```
frontend/src/__tests__/
  setup.ts                — mock de fetch global, limpieza beforeEach
  api/client.test.ts      — apiFetch inyecta token, Content-Type, URL
  pages/login.test.ts     — formulario, error visual, onSuccess, onRegisterClick
  router.test.ts          — resolveInitialRoute() según estado de localStorage
```

**Decisiones de diseño que habilitan los tests:**
- `src/router.ts` extrae `resolveInitialRoute()` de `main.ts` → función pura testeable sin efectos de importación.
- `src/utils/debounce.ts` es una función pura → testeable con timers falsos si se necesita.
- Las páginas reciben callbacks (Strategy) → los tests pasan `vi.fn()` en lugar de navegación real.

**Correr:**
```bash
cd frontend
npm install   # instala vitest y jsdom
npm test
```

---

## Infraestructura Docker

```yaml
services:
  db:            PostgreSQL 16    — puerto 5432
  redis:         Redis 7          — puerto 6379
  elasticsearch: ES 8.13          — puerto 9200 (single-node, sin auth)
  backend:       FastAPI/uvicorn  — puerto 8000
  nginx:         reverse proxy    — puerto 80 (prod)
```

El backend depende de que los tres servicios estén healthy antes de arrancar.

---

## Cómo levantar el proyecto

```bash
# Infraestructura completa
docker compose up db redis elasticsearch -d

# Backend (desde raíz)
source venv/bin/activate
uvicorn main:app --reload
# API:  http://127.0.0.1:8000
# Docs: http://127.0.0.1:8000/docs

# Frontend (desde frontend/)
npm run dev
# App: http://localhost:5173
```

Al iniciar, el backend re-indexa automáticamente en Elasticsearch todos los vehículos ya publicados.
