# Deploy de UMSSY con el flujo completo (login → rol empresa → Publicar vacante)

Se despliega la app **tal como está en `main`**: la raíz lleva al login, el usuario con rol `empresa` entra a `/recruiters` y desde el menú llega a **Registrar nueva vacante**. No hace falta cambiar código; solo configurar variables y cargar los datos de prueba.

```
Navegador ──► Frontend (Vercel) ──► API NestJS (Docker, p. ej. Render) ──► Postgres (Supabase)
  /login → /recruiters            migra la base al arrancar
```

## Cómo funciona el flujo (ya está en `main`)

| Paso | Qué pasa |
|---|---|
| Abrir `/` | Sin sesión redirige a `/login` |
| Abrir una ruta privada sin sesión | Redirige a `/login?next=<ruta>` y vuelve a ella tras entrar |
| Login con rol `empresa` | Va a `/recruiters` |
| Menú lateral | Reclutadores → Portal de empresa / Registrar nueva vacante |
| Un titulado o estudiante en `/recruiters/*` | Ve "No tienes permisos para acceder a esta sección." |

## Pasos

### 1. Base de datos (Supabase)
1. Crea el proyecto y copia los datos de conexión desde **Connect**. Usa el **Session pooler** (el acceso directo suele ser solo IPv6).
2. Guarda: usuario, contraseña, host, puerto y nombre de la base.

### 2. Backend (Docker)
En Render (o Railway/Fly, cualquiera que acepte un Dockerfile): **New Web Service** desde el repo.

- Root Directory: `backend`
- Runtime: Docker, Dockerfile Path: `./dockerfile` (en minúscula)
- Health check path: `/api/`

| Variable | Valor |
|---|---|
| `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` / `DB_NAME` | Los de Supabase |
| `DB_SCHEMA` | `public` |
| `JWT_SECRET` | Genera uno con `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `8h` |
| `JWT_ALGORITHM` | `HS256` |
| `CORS_ORIGIN` | URL exacta del frontend, sin `/` final (se completa en el paso 4) |

El contenedor ejecuta `prisma migrate deploy` al arrancar, así que las tablas se crean solas.

### 3. Datos de prueba (una sola vez, desde tu PC)
Crea `backend/.env` con las mismas credenciales de Supabase y ejecuta:

```bash
cd backend
pnpm install
pnpm seed:run
```

Es el seed completo de `main`: crea roles, usuarios de prueba, catálogos de vacantes, las 20 tecnologías y 3 empresas. Se puede repetir sin duplicar.

**Usuarios para entrar** (todos con la contraseña `Prueba123`):

| Correo | Rol | Entra a |
|---|---|---|
| `empresa@umssy.test` | empresa | `/recruiters` |
| `titulado.1@umssy.test` | titulado | `/profile` |
| `admin.1@umssy.test` | administrativo | `/backoffice/solicitudes` |

### 4. Frontend (Vercel)
**Add New Project** desde el repo, con **Root Directory = `frontend`**.

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_APP_ENV` | `prod` |
| `NEXT_PUBLIC_API_URL_PROD` | `https://<tu-api>/api` |

Las variables `NEXT_PUBLIC_*` se fijan **al compilar**: si las cambias, hay que redeployar.

Opcionales, para que la vacante se publique a nombre de otra empresa: `NEXT_PUBLIC_DEMO_COMPANY_ID` y `NEXT_PUBLIC_DEMO_COMPANY_NAME`. Sin ellas se usa **TechBolivia S.R.L.** (`a0000000-0000-4000-8000-000000000001`), que ya existe en el seed. Si las pones, pon **las dos** y que el id sea el de una empresa sembrada (`…0002` NovaSoft Bolivia, `…0003` Andes Data Labs).

Cuando Vercel te dé la URL, vuelve al backend, ponla en `CORS_ORIGIN` y redeploya.

### 5. Verificación
1. Abre la URL de Vercel: debe mostrar el **login**.
2. Entra con `empresa@umssy.test` / `Prueba123`: debe llevarte a `/recruiters`.
3. Menú → **Registrar nueva vacante** → completa los 3 pasos y **Confirmar publicación**.
4. `curl https://<tu-api>/api/job-offers` debe listar la vacante.

## Cosas a tener en cuenta
- **Las credenciales de prueba son públicas** (están en el repo). En un deploy abierto cualquiera puede entrar como empresa, titulado o administrativo. Para algo más que una demo, cambia las contraseñas en la base o limita qué usuarios se siembran.
- **Los endpoints de vacantes no validan la sesión en el servidor** (el controller tiene un `TODO` hasta que Epic 1 entregue el `companyId` en el login). El login protege la pantalla, pero un `POST /api/companies/<id>/job-offers` directo sin token también publica.
- La empresa que publica sale de la configuración del frontend, no de la cuenta que inició sesión: por ahora todos los usuarios `empresa` publican a nombre de la misma empresa.
- Los planes gratuitos suelen dormir el servicio tras un rato sin tráfico: la primera petición puede tardar.
- Si la migración de disponibilidad de mentores falla en Supabase por la extensión `btree_gist`, actívala desde *Database → Extensions* y redeploya.
