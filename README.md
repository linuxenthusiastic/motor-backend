# Motora

Plataforma web para concesionarias (dealers) que permite registrar vehículos con diagnóstico OBD2, construir un historial verificado de kilometraje y salud mecánica, publicarlos en un catálogo compartido con búsqueda, y recibir notificaciones automáticas de actividad.

---

## Tabla de contenidos

1. [Stack tecnológico](#stack-tecnológico)
2. [Arquitectura](#arquitectura)
3. [Módulos de dominio](#módulos-de-dominio)
4. [Patrones de diseño](#patrones-de-diseño)
5. [Modelo de datos](#modelo-de-datos)
6. [Diagramas C4](#diagramas-c4)
7. [ADRs — Decisiones de arquitectura](#adrs--decisiones-de-arquitectura)
8. [Historias de usuario](#historias-de-usuario)
9. [Testing](#testing)
10. [Cómo levantar el proyecto](#cómo-levantar-el-proyecto)
11. [Trazabilidad](#trazabilidad)

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Python 3.12 · FastAPI · SQLAlchemy 2.0 |
| Base de datos | PostgreSQL 16 (múltiples schemas) |
| Caché | Redis 7 |
| Búsqueda | Elasticsearch 8 |
| Frontend | TypeScript · Vite (sin framework) |
| Infraestructura | Docker Compose · Nginx |
| Testing | pytest (backend) · Vitest (frontend) |

---

## Arquitectura

Monolito modular: un único deployable de backend, dividido internamente en módulos desacoplados por dominio. Cada módulo solo se comunica con otros a través de interfaces públicas (dependencias de FastAPI, Event Bus) — nunca con queries directas a tablas de otro módulo.

```
Frontend (TS + Vite) → Nginx → Backend (FastAPI) → PostgreSQL / Redis / Elasticsearch
```

Ver diagramas completos en [Diagramas C4](#diagramas-c4).

---

## Módulos de dominio

| Módulo | Schema PostgreSQL | Responsabilidad |
|--------|-------------------|------------------|
| `auth` | `auth` | Registro, login JWT, roles |
| `vehicles` | `obd2` | CRUD de vehículos, publicación, búsqueda |
| `obd2` | `obd2` | Scans de diagnóstico OBD2 |
| `catalog` | `catalog` | Modelos de auto (gestión admin) |
| `ugc` | `ugc` | Favoritos por dealer |
| `notifications` | `notifications` | Notificaciones in-app |
| `admin` | — | Vistas administrativas (sin tablas propias) |

Cada módulo del backend sigue la misma estructura:

```
app/<dominio>/
  models.py      # Modelo ORM (SQLAlchemy)
  repository.py  # Acceso a datos
  router.py      # Endpoints HTTP (FastAPI)
  schemas.py     # Validación de entrada/salida (Pydantic)
```

---

## Patrones de diseño

| Patrón | Dónde | Para qué |
|--------|-------|----------|
| Repository | `*/repository.py` en todos los módulos | Aísla el acceso a datos del router; el ORM se puede cambiar sin tocar la capa HTTP |
| Observer / Event Bus | `shared/events.py`, `notifications/observer.py` | `obd2` publica `scan_created` sin conocer al módulo `notifications` |
| Dependency Injection | Todos los routers (`Depends`) | Sesión de DB, JWT, autorización por rol, resueltos automáticamente por FastAPI |
| Cache-Aside | `shared/cache.py` | Catálogo y modelos de auto en Redis con invalidación activa al escribir |
| Factory Function | `pages/catalog.ts` → `createVehicleRow()` | Evita duplicar el HTML/eventos de cada fila de vehículo |
| Strategy | Navegación del frontend | Cada página recibe "qué hacer al navegar" como función, no depende de un router global |
| Facade | `api/client.ts` → `apiFetch()` | Oculta el manejo de headers/token detrás de una llamada simple |
| State Machine | `pages/create-vehicle.ts` (wizard) | Pasos explícitos con validación y transición controlada |

Detalle completo de cada patrón con código de ejemplo: ver [resumen técnico interno](#) (agregar enlace si se separa en archivo propio).

---

## Modelo de datos

Ver el esquema completo en `docs/schema.dbml` — pegar en [dbdiagram.io](https://dbdiagram.io) para visualizar el ERD.

**Relaciones principales:**

```
auth.dealers (1) ──── (N) obd2.vehicles
obd2.vehicles (1) ──── (N) obd2.obd2_scan
auth.dealers (1) ──── (N) ugc.favorites (N) ──── obd2.vehicles
auth.dealers (1) ──── (N) notifications.notifications
```

Todas las claves primarias son UUID generados en Python. Cada módulo vive en su propio schema de PostgreSQL (ver [ADR-002](docs/adr/002-postgres-multischema.md)).

---

## Diagramas C4

Ver `docs/c4_diagrams.md` para el código Mermaid completo de:
- **C1 — Contexto:** actores (dealer, comprador, admin) y sistemas externos (Elasticsearch)
- **C2 — Contenedores:** frontend, backend, Postgres, Redis, Elasticsearch, Nginx
- **C3 — Componentes:** los 7 módulos internos del backend y sus relaciones

> Espacio para capturas renderizadas (insertar imagen exportada de Mermaid Live Editor):
>
> `![C1](docs/img/c1-contexto.png)`
> `![C2](docs/img/c2-contenedores.png)`
> `![C3](docs/img/c3-componentes.png)`

---

## ADRs — Decisiones de arquitectura

Documentadas en `docs/adr/`, formato Michael Nygard:

| ADR | Decisión |
|-----|----------|
| [001](docs/adr/001-backend-unico-fastapi.md) | Backend único en FastAPI, sin Django |
| [002](docs/adr/002-postgres-multischema.md) | PostgreSQL con un schema por módulo |
| [003](docs/adr/003-jwt-localstorage.md) | JWT en localStorage, no httpOnly cookie |
| [004](docs/adr/004-frontend-vanilla-ts-mvc.md) | Frontend Vanilla TS + arquitectura MVC |
| [005](docs/adr/005-observer-pattern-notificaciones.md) | Observer Pattern para notificaciones |

---

## Historias de usuario

16 historias formalizadas en `docs/historias_usuario.md`, formato Given/When/Then, cubriendo los bloques: Auth (3), Admin (3), API pública (3), UGC (2), Notificaciones (1), Módulo de negocio nuevo — OBD2 (4).

---

## Testing

**Backend (pytest):**

```bash
docker exec $(docker ps -qf "name=db") psql -U motora -c "CREATE DATABASE motora_test;"
pip install -r requirements-dev.txt
pytest tests/ -v
```

| Archivo | Cubre |
|---------|-------|
| `test_auth.py` | Registro, login, email duplicado |
| `test_vehicles.py` | Protección JWT (401/200), publicación, catálogo |
| `test_obd2.py` | Integridad referencial, autorización (403) |
| `test_repositories.py` | Métodos de cada Repository de forma aislada |

**Frontend (Vitest):**

```bash
cd frontend
npm install
npm test
```

| Archivo | Cubre |
|---------|-------|
| `api/client.test.ts` | `apiFetch` inyecta token y headers correctamente |
| `pages/login.test.ts` | Formulario, error visual, callbacks de éxito |
| `router.test.ts` | Ruta inicial según estado de sesión |

---

## Cómo levantar el proyecto

```bash
# Infraestructura completa
docker compose up db redis elasticsearch -d

# Backend
source venv/bin/activate
uvicorn main:app --reload
# API:  http://127.0.0.1:8000
# Docs: http://127.0.0.1:8000/docs

# Frontend
cd frontend
npm run dev
# App: http://localhost:5173
```

Producción (todo en contenedores, vía Nginx):

```bash
cd frontend && npm run build && cd ..
docker compose up --build
# App completa: http://localhost
```

---

## Trazabilidad

| Historia | Endpoint | Pantalla | Test |
|----------|----------|----------|------|
| HU-01 Registro | `POST /auth/register` | Registro | `test_auth.py::test_register_new_dealer` |
| HU-02 Login | `POST /auth/login` | Login | `test_auth.py::test_login_with_correct_credentials` |
| HU-07 Catálogo | `GET /vehicles/catalog` | Catálogo | `test_vehicles.py` |
| HU-13 Crear vehículo | `POST /vehicles/` | Wizard paso 1 | `test_vehicles.py::test_create_vehicle_with_token_succeeds` |
| HU-14 Registrar scan | `POST /obd2/scans` | Wizard paso 2 | `test_obd2.py` |
| HU-15 Publicar | `PATCH /vehicles/{id}/publish` | Mis vehículos | `test_vehicles.py` |

*(completar el resto de las 16 historias siguiendo este mismo patrón)*
