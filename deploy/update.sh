#!/usr/bin/env bash
# Atualiza o Vigia na VPS com o que estiver no GitHub. Rode como root.
set -euo pipefail

APP_DIR=/opt/vigia
BRANCH="${BRANCH:-master}"
as_app() { runuser -u vigia -- bash -c "$1"; }

as_app "cd $APP_DIR && git pull --ff-only origin $BRANCH"
as_app "cd $APP_DIR && .venv/bin/pip install -q -r requirements.txt"
as_app "cd $APP_DIR/frontend && npm ci --no-audit --no-fund && npm run build"

cp "$APP_DIR"/deploy/systemd/*.service "$APP_DIR"/deploy/systemd/*.timer /etc/systemd/system/
systemctl daemon-reload
systemctl restart vigia-api.service vigia-web.service
systemctl --no-pager --lines=0 status vigia-api vigia-web | grep -E 'vigia-|Active:' || true
