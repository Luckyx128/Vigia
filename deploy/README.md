# Deploy do Vigia numa VPS

Testado para Ubuntu 24.04 / Debian 12. O script instala tudo em `/opt/vigia`, roda com um usuário próprio (`vigia`) e deixa três coisas ligadas no systemd:

| Serviço | O que faz | Porta |
| --- | --- | --- |
| `vigia-api` | FastAPI (uvicorn) | 127.0.0.1:8000 |
| `vigia-web` | Painel Next.js (proxy de `/api` para a API) | 127.0.0.1:3001 |
| `vigia-scrape.timer` | Roda `run.py --scrape` de hora em hora | — |

Nenhuma porta do Vigia fica aberta para a internet. O painel é acessado por túnel SSH ou, se tiver domínio, pelo Caddy com HTTPS e senha.

## 1. No seu Mac: subir o código para o GitHub

A VPS clona o repo do GitHub, então tudo precisa estar lá (incluindo esta pasta `deploy/`):

```bash
git push origin master
```

## 2. Na VPS: rodar o setup

```bash
ssh root@IP_DA_VPS
curl -fsSL https://raw.githubusercontent.com/Luckyx128/Vigia/master/deploy/setup.sh -o setup.sh
```

Escolha **um** dos dois:

```bash
# A) Sem domínio: painel só pelo túnel SSH (mais simples e seguro)
bash setup.sh

# B) Com domínio: antes, crie um registro DNS tipo A apontando para o IP da VPS
DOMAIN=vigia.seudominio.com bash setup.sh
```

Leva uns 3–5 minutos. No modo B ele pede a senha do painel (usuário `admin`; troque com `PANEL_USER=fulano`).

## 3. Abrir o painel

**Modo A (túnel):** no seu Mac, deixe este comando rodando num terminal:

```bash
ssh -N -L 3001:127.0.0.1:3001 root@IP_DA_VPS
```

e abra <http://localhost:3001>. Ao fechar o comando (Ctrl+C), o acesso fecha junto.

**Modo B (domínio):** abra `https://vigia.seudominio.com` e entre com usuário e senha.

## 4. Testar se as lojas respondem a partir da VPS

Lojas como Amazon e Mercado Livre às vezes bloqueiam IPs de datacenter. Rode uma varredura manual e veja o resultado:

```bash
systemctl start vigia-scrape.service
journalctl -u vigia-scrape -n 50 --no-pager
```

## 5. (Opcional) Levar o banco do seu Mac

O banco da VPS começa com os dados de exemplo. Para levar seus produtos e histórico:

```bash
# na VPS
systemctl stop vigia-api vigia-scrape.timer

# no seu Mac, na pasta do projeto
scp vigia.db root@IP_DA_VPS:/opt/vigia/vigia.db

# na VPS
chown vigia:vigia /opt/vigia/vigia.db
systemctl start vigia-api vigia-scrape.timer
```

## Dia a dia

```bash
# atualizar depois de um git push
bash /opt/vigia/deploy/update.sh

# ver status e logs
systemctl status vigia-api vigia-web
journalctl -u vigia-api -f
journalctl -u vigia-scrape -n 50 --no-pager

# quando roda a próxima varredura
systemctl list-timers vigia-scrape.timer
```

Para mudar a frequência da varredura, edite `OnCalendar=` em `deploy/systemd/vigia-scrape.timer` (ex.: `*:0/30` para cada 30 min) e rode o `update.sh`.

## Notificações

A Notch roda no seu Mac, então a VPS não consegue avisar por ela. As varreduras funcionam normalmente, só os alertas não chegam. Para mudar o destino, edite `/etc/vigia/vigia.env` (`VIGIA_NOTCH_URL=...`) e rode `systemctl restart vigia-api`.
