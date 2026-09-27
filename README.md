# QuimicaLearn

Plataforma de química para colegios de Colombia (grados 6° a 11°, 54 lecciones alineadas a los Estándares y DBA del MEN), con cuentas de docente y estudiante, XP, insignias y panel del docente.

Todo corre en capas gratuitas:

| Parte | Dónde | Plan gratuito |
|---|---|---|
| Web (Next.js 16) | Vercel | Hobby |
| Servidor / API (Node 22 + Express) | Render | Free |
| Base de datos (PostgreSQL) | Render | Free (1 GB) |

```
Navegador ──► Vercel (Next.js) ──/api/*──► Render (Node) ──► Render PostgreSQL
```

La web reenvía `/api/*` a la API, así la sesión funciona en el mismo dominio y no hace falta configurar CORS.

## Carpetas

- `web/` aplicación Next.js (lo que se sube a Vercel).
- `api/` servidor Node que corre en Render.
- `api/db/schema.sql` tablas de la base de datos (la API las crea sola al arrancar).
- `render.yaml` Blueprint de Render: crea la API y la base de datos de una vez.

## Cómo funcionan las cuentas

- **Docente:** se registra con correo y contraseña, crea cursos (ej. "10A") y recibe un código de 6 caracteres por curso.
- **Estudiante:** entra con el código del curso, su nombre y un PIN de 4 números que inventa la primera vez. No necesita correo (útil con menores de edad). Si olvida el PIN, el docente lo cambia desde el panel.
- **Sin cuenta:** la plataforma funciona igual y guarda el avance en el navegador.
- El XP lo calcula el servidor (20 por actividad, 10 por cada estrella nueva del quiz), así nadie lo puede inflar desde el navegador.

## Probar en tu computador

Requiere Node 22.

```bash
cd api && npm install && npm run dev        # API en :4000 (sin DATABASE_URL usa memoria)
cd web && npm install && npm run dev        # web en http://localhost:3000
cd api && npm test                          # pruebas de la API (con TEST_DATABASE_URL también contra PostgreSQL)
```

## Despliegue con Vercel + Render

Web en **Vercel**; API y base de datos en **Render**. Todo gratis.

### 0. Subir el código a GitHub
El código ya está en https://github.com/SourceCode98/quimiGo. Si partes de cero: crea un repositorio vacío y súbelo con GitHub Desktop (*File › Add local repository › Publish repository*) o con `git init && git add . && git commit -m "QuimicaLearn" && git branch -M main && git remote add origin <URL> && git push -u origin main`.

### 1. API y base de datos en Render
1. Crea una cuenta en https://render.com con tu cuenta de GitHub.
2. *New › Blueprint* › elige el repositorio. Render lee `render.yaml` y crea dos cosas: la base de datos `quimicalearn-db` y la API `quimicalearn-api`, ya conectadas entre sí. No hay que pegar ninguna contraseña.
3. Cuando termine, abre `https://quimicalearn-api.onrender.com/api/health` (tu URL puede variar): debe decir `{"ok":true,"db":"postgres"}`.

### 2. Web en Vercel
1. En https://vercel.com › *Add New › Project* › importa el repositorio.
2. **Root Directory:** `web`.
3. **Environment Variables:** `API_URL` = la URL de Render, sin `/` al final.
4. Deploy. Si cambias `API_URL`, haz *Redeploy* porque se aplica al compilar.

### 3. Mantenerla despierta
El plan gratuito de Render duerme la API tras 15 minutos sin visitas (la primera visita tarda unos 50 s en despertar). El archivo `.github/workflows/keepalive.yml` la visita cada 10 minutos en horario escolar. Solo agrega en GitHub el secreto `API_URL` (*Settings › Secrets and variables › Actions › New repository secret*) con la URL de Render.

## Cosas a tener en cuenta

- **La base de datos gratuita de Render vence a los 30 días.** Render avisa por correo y da 14 días más para pasarla a un plan pago (desde unos 6 USD/mes); si no, se borra. Para una demostración sirve. Para algo permanente y gratis, crea una base en https://neon.tech (plan Free, no vence), copia su *connection string* y ponla como `DATABASE_URL` del servicio `quimicalearn-api` en Render (*Environment*). La API crea las tablas sola; no hay que cambiar código.
- **Solo se permite una base de datos gratuita por cuenta de Render.**
- **Vercel Hobby es solo para uso no comercial.** Para mostrar el proyecto y usarlo en un colegio como piloto sirve; si se vende, hay que pasar a Pro.
- **Datos de menores:** solo se guarda nombre, curso y avance. Para un colegio real, acuerden la autorización de tratamiento de datos (Ley 1581 de 2012).
