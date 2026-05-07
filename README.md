# V-Stats 🏐

**V-Stats** es una aplicación Progressive Web App (PWA) diseñada para registrar, visualizar y analizar estadísticas de partidos de voleibol en tiempo real. 

El objetivo de la aplicación es proveer a entrenadores y estadígrafos una herramienta rápida e intuitiva para registrar acciones durante un partido oficial o amistoso, calcular rotaciones, y luego analizar métricas avanzadas de los jugadores y del equipo global.

## 🛠 Tecnologías y Stack

El proyecto está construido utilizando tecnologías web modernas para asegurar un rendimiento óptimo tanto en Desktop como en Mobile:

- **Framework Principal**: [Next.js 14](https://nextjs.org/) (App Router)
- **Lenguaje**: TypeScript
- **Estilos y Componentes**: 
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/) (Componentes accesibles y personalizables)
  - [Lucide Icons](https://lucide.dev/)
- **Gestión de Estado**: [Zustand](https://zustand-demo.pmnd.rs/) (con soporte offline vía localStorage persist)
- **Base de Datos**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **Autenticación**: JSON Web Tokens (JWT) guardados en cookies HTTP-only.
- **Contenedores y Despliegue**: Docker & Docker Compose (Entorno unificado de DB + App)

## 🏗 Arquitectura

La arquitectura se divide en:
1. **Frontend (Client Components)**: Formularios, dashboards, y el tablero de partido en vivo. Utilizan Zustand para manejar el estado complejo del partido sin requerir llamadas constantes a la base de datos hasta que el partido finaliza.
2. **Backend (Route Handlers)**: APIs en `/app/api/...` que manejan la lógica de negocio, validación y persistencia en la base de datos PostgreSQL utilizando Prisma.
3. **Autenticación Middleware**: Un middleware de Next.js (`middleware.ts`) que intercepta las rutas protegidas, validando el token JWT antes de permitir el acceso a la aplicación.

## 📁 Estructura de Carpetas

```text
v-stats/
├── app/                  # Next.js App Router
│   ├── api/              # Endpoints del backend (auth, matches, players, stats, teams, etc)
│   ├── (rutas)/          # Rutas del frontend (dashboard, match, team, history, etc)
│   ├── layout.tsx        # Layout principal de la app
│   └── page.tsx          # Landing page
├── components/           # Componentes de React
│   ├── ui/               # Componentes genéricos (shadcn/ui)
│   └── v-stats/          # Componentes específicos de V-Stats
│       └── action-pad/   # Tablero de partido en vivo (Court, Bench, Scoreboard)
├── lib/                  # Utilidades y configuración
│   ├── stores/           # Zustand stores (auth-store, match-store)
│   ├── types/            # Tipos de TypeScript (acciones de voleibol, posiciones)
│   ├── prisma.ts         # Cliente global de Prisma
│   └── auth.ts           # Funciones de autenticación JWT
├── prisma/               # Configuración de base de datos
│   ├── schema.prisma     # Modelos de datos
│   └── migrations/       # Historial de migraciones SQL
├── public/               # Assets estáticos (imágenes, iconos PWA, manifest)
├── docker-compose.yml    # Orquestación de contenedores (App + DB)
├── Dockerfile            # Construcción de la imagen de la aplicación
└── middleware.ts         # Middleware de protección de rutas
```

## 🚀 Cómo empezar

1. Clonar el repositorio.
2. Ejecutar `docker compose up --build -d` para levantar la base de datos PostgreSQL y la aplicación Next.js.
3. Aplicar migraciones: `docker compose exec app npx prisma migrate deploy`.
4. Acceder a `http://localhost:3000`.

Para más detalles sobre el funcionamiento interno, reglas de negocio y mantenimiento, por favor referirse a **[DOCU.md](./DOCU.md)**.
