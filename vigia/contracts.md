# Contrato Tecnico e Especificacao da API - Vigia

## 1. Banco de Dados SQLite (`vigia.db`)
O banco fica na raiz do projeto (`C:\Users\Lucas\Documents\Vigia\vigia.db`).

### Tabelas:
- `products`:
  - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
  - `name`: TEXT NOT NULL
  - `category`: TEXT (ex: "Processador", "SSD")
  - `specs`: TEXT (ex: "32MB Cache L3, 6C/12T, AM4")
  - `target_price`: REAL (ex: 800.0)
  - `created_at`: TEXT ISO8601

- `store_links`:
  - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
  - `product_id`: INTEGER NOT NULL (FK -> products.id)
  - `store_name`: TEXT NOT NULL (Kabum, Terabyte, Pichau, Amazon, Mercado Livre)
  - `url`: TEXT NOT NULL
  - `is_active`: INTEGER DEFAULT 1
  - `created_at`: TEXT ISO8601

- `price_records`:
  - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
  - `store_link_id`: INTEGER NOT NULL (FK -> store_links.id)
  - `product_id`: INTEGER NOT NULL (FK -> products.id)
  - `store_name`: TEXT NOT NULL
  - `price_cash`: REAL (Preco a vista / PIX)
  - `price_installment`: REAL (Preco a prazo)
  - `installments_text`: TEXT (ex: "10x de R$ 94,99 sem juros")
  - `in_stock`: INTEGER DEFAULT 1
  - `scraped_at`: TEXT ISO8601

---

## 2. Endpoints da API (FastAPI)
Porta padrao: 8000

- `GET /api/products`
  Retorna lista de produtos com dados agregados:
  ```json
  [
    {
      "id": 1,
      "name": "AMD Ryzen 5 5600",
      "category": "Processador",
      "specs": "32MB Cache L3, AM4",
      "target_price": 800.0,
      "lowest_price_now": 829.99,
      "lowest_store_now": "Kabum",
      "all_time_low": 799.00,
      "all_time_low_store": "Terabyte",
      "avg_price_30d": 870.00,
      "discount_vs_avg": -4.6,
      "is_real_discount": true,
      "links_count": 3
    }
  ]
  ```

- `POST /api/products`
  Body: `{ "name": "...", "category": "...", "specs": "...", "target_price": 850.0 }`

- `GET /api/products/{id}`
  Retorna o produto, todos os links cadastrados e o ultimo preco de cada link.

- `DELETE /api/products/{id}`
  Remove produto e dados associados.

- `POST /api/products/{id}/links`
  Body: `{ "store_name": "Kabum", "url": "https://..." }`

- `DELETE /api/links/{link_id}`
  Remove um link.

- `GET /api/products/{id}/history`
  Retorna serie temporal para o Chart.js:
  ```json
  {
    "product_id": 1,
    "product_name": "AMD Ryzen 5 5600",
    "stores": ["Kabum", "Terabyte", "Pichau"],
    "records": [
      {
        "scraped_at": "2026-10-15T08:00:00",
        "store_name": "Kabum",
        "price_cash": 839.90,
        "price_installment": 929.90,
        "in_stock": true
      }
    ]
  }
  ```

- `POST /api/scrape/all`
  Varre todos os links ativos, grava os novos precos e dispara alerta na Notch se preco atingir meta.
  Retorna resumo do resultado.

- `POST /api/scrape/{product_id}`
  Varre apenas os links daquele produto.

- `POST /api/notify/test`
  Dispara notificacao de teste para a Notch do Cortinho (`http://127.0.0.1:48123/notify/`).

- `GET /api/stats/overview`
  Estatisticas gerais (total de produtos, menor preco historico atingido, contagem de ofertas ativas).

- `GET /`
  Serve os arquivos estaticos de `vigia/static/` (index.html, app.js, style.css).

---

## 3. Notificacao na Notch do Cortinho
Endpoint local: `POST http://127.0.0.1:48123/notify/`
Body JSON:
```json
{
  "message": "🔥 Vigia: Ryzen 5 5600 atingiu o menor preco historico! R$ 789,90 na Terabyte",
  "kind": "success"
}
```
Tipos (`kind`): "success", "alert", "error".

---

## 4. Seeds Iniciais
Produtos iniciais que devem vir pré-cadastrados ou semeados no banco:
1. AMD Ryzen 5 5600 (32MB Cache L3, 6 núcleos / 12 threads, AM4) - Meta: R$ 800,00
2. AMD Ryzen 7 5700X3D (AM4, 3D V-Cache 96MB L3, 8 núcleos / 16 threads) - Meta: R$ 1.350,00
3. SSD Kingston NV2 1TB M.2 2280 NVMe (PCIe 4.0 x4) - Meta: R$ 350,00
Com links reais e/ou simuladores de histórico prévio para que o gráfico já mostre curva histórica desde o primeiro momento!
