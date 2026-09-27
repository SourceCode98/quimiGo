# QuimicaLearn

Plataforma de química para colegios de Colombia (grados 6° a 11°, 54 lecciones alineadas a los Estándares y DBA del MEN), con cuentas de docente y estudiante, XP, insignias y panel del docente.

Todo corre en capas gratuitas:

| Parte | Dónde | Plan gratuito |
|---|---|---|
| Web (Next.js 16) | Vercel | Hobby |
| Servidor / API (Node 22 + Express) | Render | Free |
| Base de datos (MongoDB) | MongoDB Atlas | M0 Free (512 MB, no vence) |

```
Navegador ──► Vercel (Next.js) ──/api/*──► Render (Node) ──TLS──► MongoDB Atlas
```

La web reenvía `/api/*` a la API, así la sesión funciona en el mismo dominio y no hace falta configurar CORS.

## Carpetas

- `web/` aplicación Next.js (lo que se sube a Vercel).
- `api/` servidor Node que corre en Render.
- `render.yaml` Blueprint de Render para la API.

## Cómo funcionan las cuentas

- **Docente:** se registra con correo y contraseña, crea cursos (ej. "10A") y recibe un código de 6 caracteres por curso.
- **Estudiante:** entra con el código del curso, su nombre y un PIN de 4 números que inventa la primera vez. No necesita correo (útil con menores de edad). Si olvida el PIN, el docente lo cambia desde el panel.
- **Sin cuenta:** la plataforma funciona igual y guarda el avance en el navegador.
- El XP lo calcula el servidor (20 por actividad, 10 por cada estrella nueva del quiz), así nadie lo puede inflar desde el navegador.

## Probar en tu computador

Requiere Node 22.

```bash
cd api && npm install && npm run dev        # API en :4000 (sin MONGODB_URI usa memoria)
cd web && npm install && npm run dev        # web en http://localhost:3000
cd api && npm test                          # pruebas de la API (con TEST_MONGODB_URI también contra MongoDB)
```

## Despliegue con Vercel + Render

Web en **Vercel**, API en **Render** y base de datos en **MongoDB Atlas**. Todo gratis.

### 0. Subir el código a GitHub
El código ya está en https://github.com/SourceCode98/quimiGo. Si partes de cero: crea un repositorio vacío y súbelo con GitHub Desktop (*File › Add local repository › Publish repository*) o con `git init && git add . && git commit -m "QuimicaLearn" && git branch -M main && git remote add origin <URL> && git push -u origin main`.

### 1. Base de datos en MongoDB Atlas
1. Crea una cuenta en https://www.mongodb.com/cloud/atlas/register (no pide tarjeta).
2. *Create cluster* › elige **M0 (Free)**, proveedor AWS, región **N. Virginia (us-east-1)** o **Ohio (us-east-2)** para que quede cerca de Render.
3. **Database Access** › *Add New Database User*: usuario `quimicalearn` y una contraseña sin símbolos raros (letras y números). Rol: *Read and write to any database*.
4. **Network Access** › *Add IP Address* › **Allow access from anywhere** (`0.0.0.0/0`). Render gratis no tiene IP fija, así que es necesario; la contraseña protege el acceso.
5. En el clúster: *Connect › Drivers* › copia la cadena `mongodb+srv://…` y reemplaza `<db_password>` por la contraseña. Esa es `MONGODB_URI`.

La API crea sola la base `quimicalearn`, sus colecciones e índices la primera vez que arranca.

### 2. API en Render
1. Crea una cuenta en https://render.com con tu cuenta de GitHub.
2. *New › Blueprint* › elige el repositorio. Render lee `render.yaml` y crea el servicio `quimicalearn-api` (plan Free).
3. Te pide `MONGODB_URI`: pega la cadena de Atlas. `SESSION_SECRET` se genera solo.
4. Cuando termine, abre `https://quimicalearn-api.onrender.com/api/health` (tu URL puede variar): debe decir `{"ok":true,"db":"mongodb"}`.

### 3. Web en Vercel
1. En https://vercel.com › *Add New › Project* › importa el repositorio.
2. **Root Directory:** `web`.
3. **Environment Variables:** `API_URL` = la URL de Render, sin `/` al final.
4. Deploy. Si cambias `API_URL`, haz *Redeploy* porque se aplica al compilar.

### 4. Mantenerla despierta
El plan gratuito de Render duerme la API tras 15 minutos sin visitas (la primera visita tarda unos 50 s en despertar). El archivo `.github/workflows/keepalive.yml` la visita cada 10 minutos en horario escolar. Solo agrega en GitHub el secreto `API_URL` (*Settings › Secrets and variables › Actions › New repository secret*) con la URL de Render.

## Cosas a tener en cuenta

- **Atlas M0 no vence**, pero tiene 512 MB (alcanza para miles de estudiantes) y Atlas pausa los clústeres gratuitos sin conexiones durante 60 días. El keep-alive de GitHub evita eso.
- **Vercel Hobby es solo para uso no comercial.** Para mostrar el proyecto y usarlo en un colegio como piloto sirve; si se vende, hay que pasar a Pro.
- **Datos de menores:** solo se guarda nombre, curso y avance. Para un colegio real, acuerden la autorización de tratamiento de datos (Ley 1581 de 2012).
