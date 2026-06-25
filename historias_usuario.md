# Historias de Usuario — Motora

Formato: Como / quiero / para. Criterios de aceptación en Given/When/Then.

---

## Bloque Auth (3 mínimo)

### HU-01 — Registro de dealer
**Como** dealer nuevo
**quiero** crear una cuenta con email y contraseña
**para** poder publicar vehículos en la plataforma

- **Prioridad:** Alta
- **Módulo:** `auth`
- **Endpoint:** `POST /auth/register`
- **Pantalla:** Página de registro
- **Criterios de aceptación:**
  - Given que no existe una cuenta con mi email, When envío el formulario de registro con datos válidos, Then se crea mi cuenta con rol `dealer` y recibo mis datos sin el password.
  - Given que ya existe una cuenta con mi email, When intento registrarme con ese mismo email, Then recibo un error 400 y no se crea una cuenta duplicada.

### HU-02 — Login de dealer
**Como** dealer registrado
**quiero** iniciar sesión con mis credenciales
**para** acceder a las funciones protegidas de la plataforma

- **Prioridad:** Alta
- **Módulo:** `auth`
- **Endpoint:** `POST /auth/login`
- **Pantalla:** Página de login
- **Criterios de aceptación:**
  - Given que tengo una cuenta registrada, When envío mi email y password correctos, Then recibo un token de acceso válido.
  - Given que tengo una cuenta registrada, When envío un password incorrecto, Then recibo un error 401 y ningún token.

### HU-03 — Cierre de sesión
**Como** dealer logueado
**quiero** cerrar mi sesión
**para** proteger mi cuenta en un dispositivo compartido

- **Prioridad:** Media
- **Módulo:** `auth` (frontend)
- **Pantalla:** Catálogo (botón logout)
- **Criterios de aceptación:**
  - Given que estoy logueado, When presiono "Cerrar sesión", Then mi token se elimina del navegador y soy redirigido al login.
  - Given que cerré sesión, When intento acceder a una pantalla protegida, Then soy redirigido al login.

---

## Bloque Admin (3 mínimo)

### HU-04 — Listado de dealers (admin)
**Como** administrador
**quiero** ver la lista completa de dealers registrados
**para** supervisar quién usa la plataforma

- **Prioridad:** Media
- **Módulo:** `admin`
- **Endpoint:** `GET /admin/dealers`
- **Pantalla:** Panel admin
- **Criterios de aceptación:**
  - Given que soy administrador autenticado, When solicito la lista de dealers, Then recibo todos los dealers registrados con su rol.
  - Given que soy un dealer común (no admin), When intento acceder a este endpoint, Then recibo un error 403.

### HU-05 — Listado de vehículos (admin)
**Como** administrador
**quiero** ver todos los vehículos de todos los dealers
**para** moderar contenido inapropiado o fraudulento

- **Prioridad:** Media
- **Módulo:** `admin`
- **Endpoint:** `GET /admin/vehicles`
- **Pantalla:** Panel admin
- **Criterios de aceptación:**
  - Given que soy administrador, When solicito todos los vehículos, Then recibo el listado completo sin filtrar por dealer.
  - Given que soy un dealer común, When intento acceder, Then recibo un error 403.

### HU-06 — Gestión de catálogo de modelos
**Como** administrador
**quiero** crear nuevas entradas de marca/modelo en el catálogo
**para** mantener consistencia en los datos que ingresan los dealers

- **Prioridad:** Media
- **Módulo:** `catalog`
- **Endpoint:** `POST /catalog/create`
- **Pantalla:** Panel admin
- **Criterios de aceptación:**
  - Given que soy administrador, When envío una marca y modelo nuevos, Then se crea la entrada en el catálogo.
  - Given que soy un dealer común, When intento crear una entrada, Then recibo un error 403.

---

## Bloque API pública (3 mínimo)

### HU-07 — Ver catálogo público de vehículos
**Como** visitante o dealer
**quiero** ver el listado de vehículos publicados
**para** explorar la oferta disponible en el marketplace

- **Prioridad:** Alta
- **Módulo:** `vehicles`
- **Endpoint:** `GET /vehicles/catalog`
- **Pantalla:** Catálogo
- **Criterios de aceptación:**
  - Given que existen vehículos publicados, When solicito el catálogo, Then recibo la lista con datos del dealer incluidos.
  - Given que el catálogo fue consultado hace menos de 60 segundos, When lo solicito de nuevo, Then la respuesta proviene de caché (Redis) sin consultar la base de datos.

### HU-08 — Buscar vehículos por texto
**Como** visitante o dealer
**quiero** buscar vehículos por marca, modelo o patente
**para** encontrar rápidamente lo que busco sin recorrer todo el catálogo

- **Prioridad:** Alta
- **Módulo:** `vehicles`
- **Endpoint:** `GET /vehicles/search?q=`
- **Pantalla:** Catálogo (buscador)
- **Criterios de aceptación:**
  - Given que escribo un término de búsqueda, When espero 350ms sin seguir escribiendo, Then se ejecuta la búsqueda automáticamente.
  - Given que escribo un término con un error de tipeo leve, When ejecuto la búsqueda, Then recibo resultados igualmente relevantes (fuzziness).

### HU-09 — Ver detalle de un vehículo con historial OBD2
**Como** comprador interesado
**quiero** ver el historial completo de scans de un vehículo
**para** verificar su estado mecánico y kilometraje antes de comprarlo

- **Prioridad:** Alta
- **Módulo:** `obd2`
- **Endpoint:** `GET /obd2/scans/{vehicle_id}`
- **Pantalla:** Detalle de vehículo
- **Criterios de aceptación:**
  - Given que un vehículo tiene scans registrados, When consulto su detalle, Then veo el historial completo ordenado por fecha.
  - Given que un vehículo no tiene scans, When consulto su detalle, Then veo un estado vacío claro, no un error.

---

## Bloque UGC (2 mínimo)

### HU-10 — Marcar vehículo como favorito
**Como** dealer logueado
**quiero** marcar vehículos como favoritos
**para** seguir su evolución o interés de compra

- **Prioridad:** Media
- **Módulo:** `ugc`
- **Endpoint:** `POST /ugc/favorites`
- **Pantalla:** Catálogo
- **Criterios de aceptación:**
  - Given que estoy logueado, When marco un vehículo como favorito, Then se guarda la relación entre mi cuenta y ese vehículo.
  - Given que no estoy logueado, When intento marcar un favorito, Then recibo un error 401.

### HU-11 — Ver mis favoritos
**Como** dealer logueado
**quiero** ver la lista de vehículos que marqué como favoritos
**para** acceder rápido a los que me interesan

- **Prioridad:** Media
- **Módulo:** `ugc`
- **Endpoint:** `GET /ugc/favorites`
- **Pantalla:** Página de favoritos
- **Criterios de aceptación:**
  - Given que marqué favoritos previamente, When solicito mi lista, Then recibo solo los vehículos que yo marqué, no los de otros dealers.

---

## Bloque Notificaciones (1, opcional pero implementado)

### HU-12 — Recibir notificación al registrar un scan
**Como** dealer propietario de un vehículo
**quiero** recibir una notificación cuando se registra un nuevo scan
**para** estar al tanto de la actividad de mis vehículos sin revisar manualmente

- **Prioridad:** Baja
- **Módulo:** `notifications` / `obd2` (Event Bus)
- **Endpoint:** `GET /notifications`
- **Pantalla:** Centro de notificaciones
- **Criterios de aceptación:**
  - Given que se registra un scan en uno de mis vehículos, When consulto mis notificaciones, Then veo un mensaje nuevo con el kilometraje registrado.
  - Given que el módulo `obd2` publica el evento, When el `NotificationObserver` lo recibe, Then crea la notificación sin que `obd2` conozca la existencia del módulo `notifications`.

---

## Bloque Módulo de negocio nuevo — OBD2 (4 mínimo)

### HU-13 — Registrar vehículo con datos básicos
**Como** dealer
**quiero** registrar un vehículo nuevo con sus datos (VIN, patente, marca, modelo, año, color)
**para** comenzar a construir su historial verificado

- **Prioridad:** Alta
- **Módulo:** `vehicles`
- **Endpoint:** `POST /vehicles/`
- **Pantalla:** Wizard de creación — paso 1
- **Criterios de aceptación:**
  - Given que estoy logueado, When envío los datos del vehículo completos, Then se crea el vehículo asociado a mi cuenta de dealer (el `dealer_id` se asigna desde el token, nunca desde el body).
  - Given que el VIN ya existe en el sistema, When intento crear un vehículo con ese VIN, Then recibo un error de integridad.

### HU-14 — Registrar scan OBD2 de un vehículo
**Como** dealer
**quiero** registrar los valores de un escaneo OBD2 (kilometraje, RPM, temperatura, voltaje, códigos de error)
**para** construir el historial de salud mecánica del vehículo

- **Prioridad:** Alta
- **Módulo:** `obd2`
- **Endpoint:** `POST /obd2/scans`
- **Pantalla:** Wizard de creación — paso 2
- **Criterios de aceptación:**
  - Given que el vehículo existe, When registro un scan con datos válidos, Then se guarda el scan ligado a ese vehículo y se dispara el evento `scan_created`.
  - Given que el vehículo no existe, When intento registrar un scan, Then recibo un error y no se crea el registro.

### HU-15 — Publicar vehículo en el marketplace
**Como** dealer
**quiero** publicar un vehículo ya registrado al catálogo público
**para** ofrecerlo a la venta con su historial verificado adjunto

- **Prioridad:** Alta
- **Módulo:** `vehicles`
- **Endpoint:** `PATCH /vehicles/{id}/publish`
- **Pantalla:** Detalle de vehículo / Mis vehículos
- **Criterios de aceptación:**
  - Given que soy el dealer propietario del vehículo, When lo publico, Then aparece en el catálogo público y se indexa en el buscador.
  - Given que el vehículo pertenece a otro dealer, When intento publicarlo, Then recibo un error de autorización y no se modifica.

### HU-16 — Ver historial de kilometraje verificado
**Como** comprador interesado
**quiero** ver la evolución del kilometraje de un vehículo a través del tiempo
**para** confirmar que no hubo manipulación del odómetro

- **Prioridad:** Alta
- **Módulo:** `obd2`
- **Endpoint:** `GET /obd2/scans/{vehicle_id}`
- **Pantalla:** Detalle de vehículo
- **Criterios de aceptación:**
  - Given que un vehículo tiene múltiples scans, When veo su detalle, Then el kilometraje aparece ordenado cronológicamente y de forma creciente (o se señala una inconsistencia).
  - Given que el kilometraje de un scan es menor al anterior, When se muestra el historial, Then se resalta como posible alerta (mejora futura, no bloqueante para el MVP).

---

**Total: 16 historias de usuario.** Cubre los 6 bloques exigidos por el spec (Auth, Admin, API pública, UGC, Notificaciones, Módulo de negocio nuevo).
