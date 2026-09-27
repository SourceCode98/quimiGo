# QuimicaLearn

Plataforma de química para colegios de Colombia (grados 6° a 11°, 54 lecciones alineadas a los Estándares y DBA del MEN), con cuentas de docente y estudiante, XP, insignias y panel del docente.

Todo corre en capas gratuitas:

| Parte | Dónde | Plan gratuito |
|---|---|---|
| Web (Next.js 16) | Vercel | Hobby |
| Servidor / API (Node 22 + Express) | Render (o una VM de Oracle Cloud) | Free / Always Free |
| Base de datos | Oracle Autonomous Database | Always Free (20 GB) |

```
Navegador ──► Vercel (Next.js) ──/api/*──► Render (Node) ──TLS──► Oracle Autonomous Database
```

La web reenvía `/api/*` a la API, así la sesión funciona en el mismo dominio y no hace falta configurar CORS.

## Carpetas

- `web/` aplicación Next.js (lo que se sube a Vercel).
- `api/` servidor Node que corre en la VM de Oracle.
- `db/schema.sql` tablas de la base de datos.
- `deploy/` script de instalación de la VM, Caddy y servicio systemd.

## Cómo funcionan las cuentas

- **Docente:** se registra con correo y contraseña, crea cursos (ej. "10A") y recibe un código de 6 caracteres por curso.
- **Estudiante:** entra con el código del curso, su nombre y un PIN de 4 números que inventa la primera vez. No necesita correo (útil con menores de edad). Si olvida el PIN, el docente lo cambia desde el panel.
- **Sin cuenta:** la plataforma funciona igual y guarda el avance en el navegador.
- El XP lo calcula el servidor (20 por actividad, 10 por cada estrella nueva del quiz), así nadie lo puede inflar desde el navegador.

## Probar en tu computador

Requiere Node 22.

```bash
cd api && npm install && npm run dev        # API en :4000 (sin Oracle configurado usa memoria)
cd web && npm install && npm run dev        # web en http://localhost:3000
cd api && npm test                          # pruebas de la API
```

## Despliegue con Vercel + Render (recomendado)

Web en **Vercel**, API en **Render** y base de datos en **Oracle Autonomous Database**, todo gratis.

### 0. Subir el código a GitHub
1. Crea una cuenta en https://github.com y un repositorio vacío, por ejemplo `quimicalearn` (privado está bien).
2. La forma más fácil en Windows o Mac: instala **GitHub Desktop**, *File › Add local repository* › elige la carpeta `quimicalearn` que descomprimiste › *Publish repository*.
   Con terminal: `git init && git add . && git commit -m "QuimicaLearn" && git branch -M main && git remote add origin https://github.com/TU_USUARIO/quimicalearn.git && git push -u origin main`.

### 1. Base de datos en Oracle
Sigue el paso 1 de la sección "Despliegue en Oracle Cloud" más abajo (crear la Autonomous Database, usuario QUIMICALEARN y ejecutar `db/schema.sql`). Guarda la contraseña y la cadena de conexión TLS.

### 2. API en Render
1. Crea una cuenta en https://render.com con tu cuenta de GitHub.
2. *New › Blueprint* › elige el repositorio. Render lee `render.yaml` y crea el servicio `quimicalearn-api` (plan Free).
3. Te pide `ORACLE_PASSWORD` y `ORACLE_CONNECT_STRING`: pega los de Oracle. `SESSION_SECRET` se genera solo.
4. Cuando termine, abre `https://quimicalearn-api.onrender.com/api/health` (tu URL puede variar): debe decir `{"ok":true,"db":"oracle"}`.
   - ¿Aún no tienes Oracle? Deja `DB_DRIVER` en `memory` para probar: funciona, pero los datos se borran cada vez que Render reinicia.

### 3. Web en Vercel
1. En https://vercel.com › *Add New › Project* › importa el repositorio.
2. **Root Directory:** `web`.
3. **Environment Variables:** `API_URL` = la URL de Render, sin `/` al final.
4. Deploy. Si cambias `API_URL`, haz *Redeploy*.

### 4. Mantenerla despierta
El plan gratuito de Render duerme la API tras 15 minutos sin visitas (la primera visita tarda unos 50 s en despertar). El archivo `.github/workflows/keepalive.yml` la visita cada 10 minutos en horario escolar y también evita que Oracle apague la base de datos. Solo agrega en GitHub el secreto `API_URL` (*Settings › Secrets and variables › Actions › New repository secret*) con la URL de Render.

## Despliegue en Oracle Cloud (alternativa: servidor propio)

### 1. Base de datos: Oracle Autonomous Database (Always Free)

1. Crea una cuenta en https://www.oracle.com/cloud/free/ (pide tarjeta para verificar identidad, no cobra en Always Free). Elige como región de origen **Bogotá** o la más cercana; no se puede cambiar después.
2. Menú ☰ › Oracle Database › **Autonomous Database** › Crear.
   - Tipo de carga: *Transaction Processing*. Marca **Always Free**.
   - Crea la contraseña del usuario ADMIN.
   - Acceso de red: **Acceso seguro desde todas partes**.
   - Deja desmarcado **Requerir autenticación TLS mutua (mTLS)**. Si ya la creaste, cámbialo en *Más acciones › Actualizar acceso de red / mTLS*.
3. En la base de datos: **Conexión a base de datos** › tipo de TLS: **TLS** › copia la cadena de `..._low` (empieza por `(description=`). Esa es `ORACLE_CONNECT_STRING`.
4. **Database Actions › SQL** como ADMIN y crea el usuario de la aplicación:
   ```sql
   CREATE USER QUIMICALEARN IDENTIFIED BY "UnaClaveLarga#2026";
   GRANT CREATE SESSION, CREATE TABLE TO QUIMICALEARN;
   ALTER USER QUIMICALEARN QUOTA 1G ON DATA;
   ```
5. Ejecuta `db/schema.sql` como QUIMICALEARN. Lo más fácil: en la misma hoja SQL escribe `ALTER SESSION SET CURRENT_SCHEMA = QUIMICALEARN;`, pega el contenido de `schema.sql` y ejecútalo como script (F5).

### 2. Servidor: máquina virtual Always Free (en vez de Render)

1. Menú ☰ › Compute › **Instancias** › Crear. Imagen **Ubuntu 22.04 o 24.04**; forma **VM.Standard.A1.Flex** (1 OCPU, 6 GB) o **VM.Standard.E2.1.Micro**, ambas Always Free. Descarga la llave SSH.
2. En la VCN de la instancia: *Subred › Lista de seguridad › Agregar regla de entrada* para los puertos **80** y **443** desde `0.0.0.0/0`.
3. Conéctate y ejecuta:
   ```bash
   ssh -i llave.key ubuntu@IP_PUBLICA
   sudo apt-get update && sudo apt-get install -y git
   git clone https://github.com/TU_USUARIO/quimicalearn.git && cd quimicalearn
   sudo bash deploy/setup-vm.sh IP_PUBLICA
   sudo nano /opt/quimicalearn/api/.env      # pon ORACLE_PASSWORD y ORACLE_CONNECT_STRING
   sudo systemctl start quimicalearn-api
   curl https://IP_PUBLICA.sslip.io/api/health   # debe responder {"ok":true,"db":"oracle"}
   ```
   `sslip.io` da un nombre de dominio gratis a partir de la IP, y Caddy le saca certificado HTTPS automáticamente. Si tienes dominio propio, cámbialo en `/etc/caddy/Caddyfile`.

Para actualizar después: `git pull && sudo cp -r api /opt/quimicalearn/ && cd /opt/quimicalearn/api && sudo npm install --omit=dev && sudo chown -R quimicalearn: /opt/quimicalearn && sudo systemctl restart quimicalearn-api`.

### 3. Web: Vercel (Hobby), igual que arriba

1. Sube este repositorio a GitHub.
2. En https://vercel.com › *Add New › Project* › importa el repositorio.
3. **Root Directory:** `web`. Framework: Next.js (se detecta solo).
4. **Environment Variables:** `API_URL = https://IP_PUBLICA.sslip.io` (sin `/` al final).
5. Deploy. Si cambias `API_URL` después, haz *Redeploy* porque se aplica al compilar.

## Cosas a tener en cuenta

- **Vercel Hobby es solo para uso no comercial.** Para mostrar el proyecto y usarlo en un colegio como piloto sirve; si se vende, hay que pasar a Pro o mover la web a la misma VM de Oracle (`npm run build && npm start` detrás de Caddy).
- **La base de datos gratuita se detiene tras 7 días sin uso.** El script instala un cron que la consulta cada 6 horas (`/api/health`). Si aun así se detiene, iníciala desde la consola de Oracle.
- **Instancias Always Free inactivas:** Oracle puede recuperar VMs con uso muy bajo durante 7 días. El tráfico normal de clases lo evita; convertir la cuenta a *Pay As You Go* (sigue sin cobrar dentro de los límites gratuitos) elimina ese riesgo.
- **Datos de menores:** solo se guarda nombre, curso y avance. Para un colegio real, acuerden la autorización de tratamiento de datos (Ley 1581 de 2012).
