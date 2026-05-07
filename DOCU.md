# V-Stats: Documentación Técnica y de Mantenimiento

Este documento detalla el funcionamiento interno de V-Stats, la lógica de negocio, cómo fluyen los datos y proporciona una guía para realizar mantenimiento y escalar la aplicación.

---

## 1. Arquitectura de Estado y Flujo de Datos

V-Stats utiliza una arquitectura híbrida para manejar los datos:
- **Base de Datos (PostgreSQL + Prisma)**: Actúa como la fuente de verdad absoluta para entidades (Usuarios, Jugadores, Equipos) y datos históricos (Partidos finalizados, Estadísticas).
- **Estado Global Local (Zustand)**: Maneja la lógica volátil y rápida que requiere el partido en vivo. Evita latencia de red durante un partido.

### Flujo del Partido (Match Flow)

1. **Configuración (`/match` - `match-view.tsx`)**:
   - El usuario selecciona un Rival (`OpponentTeam`) y un Torneo (`Tournament`). Estos se cargan mediante un combobox (`EntityComboBox`) que permite búsqueda en tiempo real e inserción (Crear/Editar/Eliminar) contra la base de datos de manera directa.
   - *Validación crítica*: El usuario debe tener al menos 6 jugadores `isActive: true` en la base de datos para proceder.

2. **Setup del Roster (`match-setup.tsx`)**:
   - El usuario selecciona quiénes van a jugar (mínimo 6) y puede designar hasta 2 Líberos.
   - También configura las reglas del set (puntos por set, puntos para el 5to set, diferencia mínima).
   - Al darle "Iniciar Partido", se ejecuta `startMatch` en el `match-store.ts`, moviendo los primeros 6 seleccionados a `courtPlayers` (cancha), los líberos a `liberos` y el resto a `benchPlayers` (suplentes).

3. **Partido en Vivo (`/match/[id]` - `action-pad.tsx`)**:
   - **Cancha (`court-view.tsx`)**: Utiliza HTML5 Drag-and-Drop nativo para reordenar jugadores. Muestra posiciones `P1` a `P6`.
   - **Banco y Líberos (`bench-panel.tsx`)**: Maneja el estado de sustitución.
   - **Registro de Acciones (`action-buttons.tsx`)**: Al tocar un botón de acción, se llama a `recordAction` en el store.
     - *Autoscore*: Si la acción es "punto" o "ace", automáticamente suma un punto al contador "Nosotros".
     - *Autoset*: Si un equipo llega a la cantidad límite de puntos con la diferencia necesaria, el store automáticamente avanza `currentSet++`.

4. **Persistencia Final**:
   - Al tocar "Finalizar", el partido cambia a estado `finished`.
   - Se ejecuta un POST a `/api/matches`.
   - **Manejo de Transacción Atómica**: El backend crea el `Match`, itera sobre el historial de acciones y consolida los `PlayerMatchStats` (puntos totales, errores, bloqueos, etc. de cada jugador) en una única transacción de Prisma (`prisma.$transaction`). 

---

## 2. Modelos de Base de Datos Clave (Prisma)

- **User**: Entrenador que posee el equipo.
- **Team**: Representa al equipo del usuario.
- **Player**: Los miembros del equipo. Tienen `isActive` para ocultar ex-jugadores.
- **OpponentTeam / Tournament**: Entidades de referencia cruzada para los partidos.
- **Match**: La cabecera del partido. Guarda el resultado global y el historial de sets en un JSON (`setScores`).
- **PlayerMatchStats**: **Fundamental para el Dashboard**. En lugar de calcular estadísticas leyendo todo el log de acciones, el backend pre-calcula los totales de cada jugador al finalizar el partido y los guarda aquí.
- **MatchActionLog**: Registro crudo (append-only) para auditoría o replay en el futuro.

---

## 3. Guía de Mantenimiento

### 3.1. Agregar una nueva "Acción" de Voleibol
Si se necesita agregar, por ejemplo, "Saque Flotante", los pasos son:
1. Modificar `lib/types/volleyball.ts`:
   - Agregar el string a `VolleyballActionKey`.
   - Agregar la configuración en `VOLLEYBALL_ACTIONS` (label corto, tipo positivo/negativo).
   - Agregarlo a la lista de constantes `POSITIVE_ACTIONS` o `NEGATIVE_ACTIONS`.
2. Modificar la agregación en Base de Datos:
   - Ir a `prisma/schema.prisma`.
   - Agregar la columna correspondiente en el modelo `PlayerMatchStats` (ej. `saquesFlotantes Int @default(0)`).
   - Generar la migración: `npx prisma migrate dev --name add_saque_flotante`.
3. Modificar el Backend:
   - Ir a `app/api/matches/route.ts`.
   - En el bloque `switch (action.action)`, agregar el caso para sumar a la nueva estadística dentro del `statsMap`.

### 3.2. Modificar el cálculo de Puntos por Set
La lógica está centralizada en `checkSetWon` dentro de `lib/stores/match-store.ts`. Si alguna liga utiliza reglas raras (ej. sets por tiempo), deberás modificar cómo se evalúa si el set está ganado en esa función.

### 3.3. Autenticación y Middleware
La app usa un middleware muy simple en `middleware.ts` que busca una cookie llamada `token`. 
- Si cambiás la estrategia de Auth (ej. Auth.js / NextAuth), deberás remover `lib/auth.ts`, eliminar el middleware actual y ajustar los endpoints de `/api/auth/` y todos los getters protegidos (que actualmente usan `getAuthUser()`).

### 3.4. Reseteo de Base de Datos Local
Dado que el proyecto utiliza Docker, si la base de datos se corrompe localmente:
1. `docker compose exec app npx prisma migrate reset` (Esto borrará TODO el contenido).
2. Deberás volver a registrarte en `http://localhost:3000/register`.
3. *(A tener en cuenta)*: Si el JWT guardado en tu navegador pertenece a un usuario que se borró de la DB en el reset, vas a recibir un error al navegar. En ese caso, andá a `http://localhost:3000/api/auth/logout` para limpiar tu cookie y luego logueate/registrate normalmente.

---

## 4. Escalamiento Futuro

- **Rotación Automática**: Actualmente el Drag-and-Drop es manual. Para el futuro, se podría implementar una función `rotateCourt()` en el `match-store.ts` que desplace los índices del array `courtPlayers` 1 posición según las reglas del vóley (ej. index 0 pasa a 5, index 1 a 0, etc.) cada vez que hay un cambio de saque.
- **Sockets/Tiempo Real**: Para que los padres o fanáticos vean el marcador, el `match-store.ts` debería disparar eventos Websocket o sincronizarse mediante Polling hacia una tabla temporal en Prisma.
