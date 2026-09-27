#!/usr/bin/env bash
# Prepara una VM Always Free de Oracle (Ubuntu 22.04/24.04) para la API de QuimicaLearn.
# Uso: sudo bash setup-vm.sh TU_IP_PUBLICA
set -euo pipefail
IP="${1:?Escribe la IP pública de la VM: sudo bash setup-vm.sh 129.151.10.20}"
HOST="${IP}.sslip.io"
DIR=/opt/quimicalearn

echo "== Node.js 22 =="
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "== Caddy (HTTPS automático) =="
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update && apt-get install -y caddy

echo "== Firewall de Ubuntu en Oracle: abrir 80 y 443 =="
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
netfilter-persistent save || true

echo "== Usuario y código =="
id quimicalearn >/dev/null 2>&1 || useradd --system --home "$DIR" --shell /usr/sbin/nologin quimicalearn
mkdir -p "$DIR"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
cp -r "$SRC/api" "$DIR/"
cd "$DIR/api" && npm ci --omit=dev || npm install --omit=dev
if [ ! -f "$DIR/api/.env" ]; then
  cp .env.example .env
  sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$(openssl rand -hex 32)|" .env
  echo ">> Edita $DIR/api/.env con la contraseña y la cadena de conexión de tu base de datos."
fi
chown -R quimicalearn:quimicalearn "$DIR"
chmod 600 "$DIR/api/.env"

echo "== Servicio =="
cp "$SRC/deploy/quimicalearn-api.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable quimicalearn-api

sed "s/TU_IP.sslip.io/$HOST/" "$SRC/deploy/Caddyfile" > /etc/caddy/Caddyfile
systemctl reload caddy || systemctl restart caddy

echo "== Mantener despierta la base de datos (Oracle apaga la gratuita tras 7 días sin uso) =="
echo "0 */6 * * * root curl -fsS http://127.0.0.1:4000/api/health > /dev/null" > /etc/cron.d/quimicalearn-keepalive

echo
echo "Listo. Cuando hayas editado .env ejecuta:  sudo systemctl start quimicalearn-api"
echo "Prueba:  curl https://$HOST/api/health"
echo "En Vercel usa  API_URL=https://$HOST"
