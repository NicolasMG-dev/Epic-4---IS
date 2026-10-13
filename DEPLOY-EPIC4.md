# Deploy independiente de Epic 4 (Publicar vacante)

Publica solo la pantalla **Publicar vacante** (`/recruiters/job-offers/new`) con su backend, sin login ni el resto de la plataforma.

```
Navegador ──► Frontend (Vercel) ──► API NestJS (Docker, p. ej. Render) ──► Postgres (Supabase)
              modo standalone         ya corre las migraciones al arrancar
```

## Qué cambia en el código

| Dónde | Cambio |
|---|---|
| `frontend/src/shared/config/standalone.config.ts` | Flag `NEXT_PUBLIC_STANDALONE_EPIC4=true` |
| `frontend/src/proxy.ts` | Con el flag: sin cookie de sesión; `/` y `/login` van a Publicar vacante |
| `frontend/src/app/(app)/layout.tsx` | Con el flag: las rutas `/recruiters/*` no pasan por `SessionGate` |
| `backend/src/app.module.ts` | Registra `JobOffersModule` (estaba creado pero **no importado**, así que sus endpoints daban 404) |
| `backend/src/common/database/seed-epic4.ts` | Seed que solo carga catálogos de vacantes y empresas de ejemplo (`pnpm seed:epic4`) |

Sin el flag, la app se comporta exactamente igual que antes.

## Pasos

### 1. Base de datos (Supabase)
1. Crea un proyecto y abre **Connect** para copiar los datos de conexión. Usa el **Session pooler** (el acceso directo suele ser solo IPv6 y muchos hosts no lo alcanzan).
2. Guarda: usuario, contraseña, host, puerto y nombre de la base.

### 2. Backend (Docker)
En Render (o Railway/Fly, cualquiera que acepte un Dockerfile): **New Web Service** desde el repo.

- Root Directory: `backend`
- Runtime: Docker, Dockerfile Path: `./dockerfile` (está en minúscula)
- Health check path: `/api/`

Variables de entorno:

| Variable | Valor |
|---|---|
| `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` / `DB_NAME` | Los de Supabase (paso 1) |
| `DB_SCHEMA` | `public` |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `8h` |
| `JWT_ALGORITHM` | `HS256` |
| `CORS_ORIGIN` | URL del frontend (paso 4). Provisional: `http://localhost:3000` |

El contenedor ejecuta `prisma migrate deploy` al arrancar, así que las tablas se crean solas en el primer deploy.

### 3. Seed (una sola vez, desde tu PC)
Crea `backend/.env` con las mismas credenciales de Supabase y corre:

```bash
cd backend
pnpm install
pnpm generate
pnpm seed:epic4
```

Es idempotente (se puede repetir). Carga modalidades, tipos de contrato, estados, 20 tecnologías y 3 empresas de ejemplo.

### 4. Frontend (Vercel)
**Add New Project** desde el repo, con **Root Directory = `frontend`**.

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_APP_ENV` | `prod` |
| `NEXT_PUBLIC_API_URL_PROD` | `https://<tu-api>/api` |
| `NEXT_PUBLIC_STANDALONE_EPIC4` | `true` |
| `NEXT_PUBLIC_DEMO_COMPANY_ID` | `a0000000-0000-4000-8000-000000000002` (NovaSoft Bolivia, la del mockup) |
| `NEXT_PUBLIC_DEMO_COMPANY_NAME` | `NovaSoft Bolivia` |

Las variables `NEXT_PUBLIC_*` se fijan **al compilar**: si las cambias, hay que redeployar.

Cuando Vercel te dé la URL, vuelve al backend, pon esa URL en `CORS_ORIGIN` (sin `/` final) y redeploya.

### 5. Verificación
```bash
curl https://<tu-api>/api/job-offers/skills     # debe listar las tecnologías
```
1. Abre la URL de Vercel: debe caer directo en **Publicar vacante**, sin login.
2. Completa los 3 pasos y confirma la publicación.
3. `curl https://<tu-api>/api/job-offers` debe mostrar la vacante creada.

## Cosas a tener en cuenta
- **Los endpoints no tienen autenticación** (el propio controller tiene un `TODO` hasta que Epic 1 entregue el `companyId` en el login). Cualquiera con la URL puede publicar vacantes de las empresas de ejemplo. Para una demo está bien; no lo uses con datos reales.
- La empresa que publica viene de `NEXT_PUBLIC_DEMO_COMPANY_ID`. Si falta, el botón de publicar muestra "No hay una empresa asociada".
- Los planes gratuitos suelen dormir el servicio tras un rato sin tráfico: la primera petición puede tardar.
- Las demás opciones del menú lateral no hacen nada en este alcance (igual que en el mockup aprobado).
- Para volver al modo normal, borra `NEXT_PUBLIC_STANDALONE_EPIC4` y redeploya.
