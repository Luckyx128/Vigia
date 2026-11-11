#!/usr/bin/env bash
# Instala o Vigia numa VPS Ubuntu/Debian. Rode como root:
#   bash setup.sh                        # acesso só por túnel SSH
#   DOMAIN=vigia.seudominio.com bash setup.sh   # expõe com HTTPS + senha
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Luckyx128/Vigia.git}"
BRANCH="${BRANCH:-master}"
DOMAIN="${DOMAIN:-}"
PANEL_USER="${PANEL_USER:-admin}"
APP_USER=vigia
APP_DIR=/opt/vigia

if [[ $EUID -ne 0 ]]; then
  echo "Rode como root (ou com sudo)." >&2
  exit 1
fi

as_app() { runuser -u "$APP_USER" -- bash -c "$1"; }

echo "==> Pacotes do sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl ca-certificates ufw python3 python3-venv python3-pip

echo "==> Node.js 22"
node_major=$(command -v node >/dev/null && node -v | sed 's/^v//' | cut -d. -f1 || echo 0)
if (( node_major < 20 )); then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

echo "==> Usuário '$APP_USER'"
id -u "$APP_USER" >/dev/null 2>&1 || \
  useradd --system --create-home --home-dir "/home/$APP_USER" --shell /usr/sbin/nologin "$APP_USER"

echo "==> Código em $APP_DIR"
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
as_app "cd $APP_DIR && git pull --ff-only origin $BRANCH"

echo "==> Backend (venv + dependências)"
as_app "cd $APP_DIR && python3 -m venv .venv && .venv/bin/pip install -q --upgrade pip && .venv/bin/pip install -q -r requirements.txt"

echo "==> Frontend (npm ci + build)"
as_app "cd $APP_DIR/frontend && npm ci --no-audit --no-fund && npm run build"

echo "==> Configuração em /etc/vigia/vigia.env"
mkdir -p /etc/vigia
if [[ ! -f /etc/vigia/vigia.env ]]; then
  cat > /etc/vigia/vigia.env <<'EOF'
# Variáveis lidas pela API e pela varredura.
# A Notch roda no seu Mac, então na VPS ela não responde. Troque se tiver outro destino.
# VIGIA_NOTCH_URL=http://127.0.0.1:48123/notify/
EOF
fi

echo "==> Serviços systemd"
cp "$APP_DIR"/deploy/systemd/*.service "$APP_DIR"/deploy/systemd/*.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now vigia-api.service vigia-web.service vigia-scrape.timer
systemctl restart vigia-api.service vigia-web.service

echo "==> Firewall"
ufw allow OpenSSH >/dev/null
if [[ -n "$DOMAIN" ]]; then
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
fi
ufw --force enable

if [[ -n "$DOMAIN" ]]; then
  echo "==> Caddy (HTTPS + senha) para $DOMAIN"
  if ! command -v caddy >/dev/null; then
    apt-get install -y debian-keyring debian-archive-keyring apt-transport-https gnupg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
      | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
      > /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -y
    apt-get install -y caddy
  fi
  echo "Escolha a senha do painel (usuário: $PANEL_USER)"
  hash=$(caddy hash-password)
  cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
	encode gzip
	basic_auth {
		$PANEL_USER $hash
	}
	reverse_proxy 127.0.0.1:3001
}
EOF
  systemctl reload caddy || systemctl restart caddy
fi

echo
echo "==> Pronto"
systemctl --no-pager --lines=0 status vigia-api vigia-web | grep -E 'vigia-|Active:' || true
if [[ -n "$DOMAIN" ]]; then
  echo "Painel: https://$DOMAIN (usuário: $PANEL_USER)"
else
  echo "Painel só acessível por túnel SSH. No seu Mac:"
  echo "  ssh -N -L 3001:127.0.0.1:3001 root@IP_DA_VPS"
  echo "e abra http://localhost:3001"
fi
