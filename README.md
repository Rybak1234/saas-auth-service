# SaaS Auth Service

Módulo de identidad y acceso multi-tenant para plataformas SaaS con JWT, RBAC y auditoría de sesiones.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Base de datos:** Neon PostgreSQL + Prisma ORM
- **Autenticación:** JWT (jose) + bcryptjs
- **Estilos:** Tailwind CSS
- **Despliegue:** Vercel

## Características

- Registro y login con hash seguro (bcrypt)
- JWT access tokens + refresh tokens
- Multi-tenant: cada usuario pertenece a un tenant
- RBAC: roles `owner`, `admin`, `member`
- Auditoría de sesiones (login, logout, refresh)
- Middleware de protección de rutas
- Rate limiting básico

## Comenzar

```bash
npm install
cp .env.example .env.local
# Configurar variables de entorno
npx prisma db push
npm run dev
```
