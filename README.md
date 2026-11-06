# 🛡️ Vigia — Radar Black Friday & Monitor de Preços

<p align="center">
  <img src="frontend/public/next.svg" width="120" alt="Next.js" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <b>+</b>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png" width="160" alt="FastAPI" />
</p>

<p align="center">
  <b>Sistema autônomo e inteligente para monitoramento contínuo de hardware, histórico multi-lojas e detecção de descontos autênticos contra a "metade do dobro" na Black Friday.</b>
</p>

<p align="center">
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-stack-tecnológica">Tecnologias</a> •
  <a href="#-arquitetura">Arquitetura</a> •
  <a href="#-como-executar">Como Executar</a> •
  <a href="#-lojas-integradas">Lojas</a> •
  <a href="#-licença">Licença</a>
</p>

---

## 🚀 Funcionalidades

- **Radar Black Friday em Tempo Real:** Varredura autônoma de preços à vista (PIX) e a prazo (cartão) com detecção de estoque.
- **Proteção Contra "Metade do Dobro":**
  - 🟢 **Selo Preço Real:** O preço atual está no menor patamar dos últimos 30 a 90 dias ou abaixo da meta estipulada.
  - 🟡 **Selo Preço Normal:** Valor dentro da média usual histórica de mercado.
  - 🔴 **Selo Alerta de Alta:** Detecta maquiagem prévia e aumento artificial de preço antes de promoções.
- **Gráficos Históricos Interativos (Chart.js):**
  - Série temporal comparativa entre múltiplas lojas no mesmo gráfico.
  - Agrupamento temporal inteligente de varreduras simultâneas na mesma coluna vertical.
  - Linha guia (*crosshair*) com hover unificado em todas as lojas simultaneamente.
  - Alternância instantânea entre modo **À Vista (PIX)** e **A Prazo (Cartão)**.
- **Painel Web Moderno (Next.js 15 & shadcn/ui):**
  - Construído com os primitivos headless **Base UI**.
  - **Atalho Global `Ctrl + K`** para busca instantânea por processadores, SSDs ou especificações.
  - Filtros rápidos por categoria e ordenação reativa.
  - Alternador completo de Tema: **Escuro**, **Claro** ou **Sistema** via `next-themes`.
  - Notificações toast em tempo real com **Sonner**.
- **Gestão de Links & Produtos:**
  - Cadastro rápido de novos itens com categoria, especificações e preço alvo.
  - Adição e remoção de links específicos por produto.
  - **Busca de links na Kabum:** digite o produto, veja os anúncios com foto, preço PIX, oferta ativa, vendedor e nota de semelhança, e adicione o certo com um clique.
  - Gestão de leituras e limpeza de histórico de preços para remoção de anomalias.
- **Notificações Locais:** Suporte a integração via webhook local com servidores de notificação (ex: Notch Cortinho).
- **Rotinas Automáticas:** Agendamento periódico de varreduras via Maestri CLI (`python run.py --scrape`).

---

## 🛠️ Stack Tecnológica

### Frontend
- **Framework:** Next.js 15 (App Router, Turbopack)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v4
- **Componentes:** shadcn/ui com base em **Base UI** (`@base-ui/react`)
- **Visualização de Dados:** Chart.js & `react-chartjs-2`
- **Ícones:** Lucide React
- **Tema & Feedback:** `next-themes` e `sonner`

### Backend
- **Framework:** Python 3.14 + FastAPI
- **Servidor ASGI:** Uvicorn
- **Banco de Dados:** SQLite3 (`vigia.db`) com inicialização e migração automática
- **Scraping & Parsing:** Scrapers modulares resilientes com extração de moedas em BRL e parcelamento
- **Validação & Contratos:** Pydantic v2

---

## 🏪 Lojas Integradas

O Vigia possui scrapers e despachantes especializados para as principais lojas de informática do Brasil:

| Loja | Suporte a PIX | Preço Parcelado | Estoque |
| :--- | :---: | :---: | :---: |
| **Kabum** | ✅ | ✅ | ✅ |
| **TerabyteShop** | ✅ | ✅ | ✅ |
| **Pichau** | ✅ | ✅ | ✅ |
| **Amazon Brasil** | ✅ | ✅ | ✅ |
| **Mercado Livre** | ✅ | ✅ | ✅ |

---

## 📦 Como Executar

### Pré-requisitos
- Python 3.10+ instalado
- Node.js 18+ e npm instalados

### 1. Clonar o repositório
```bash
git clone https://github.com/Luckyx128/Vigia.git
cd Vigia
```

### 2. Configurar o Backend
Instale as dependências Python:
```bash
pip install -r requirements.txt
```

### 3. Configurar o Frontend
Instale os pacotes do Next.js:
```bash
cd frontend
npm install
cd ..
```

### 4. Executar o Projeto (Modo Fullstack)
Com um único comando você inicia a API FastAPI na porta `8000` e o painel Next.js na porta `3001`:
```bash
python run.py --dev
```

Acesse no seu navegador:
- **Painel Web (Frontend):** [http://localhost:3001](http://localhost:3001)
- **Documentação Interativa da API (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## ⚙️ Outros Comandos Úteis

- **Executar bateria de testes automatizados:**
  ```bash
  python run.py --test
  ```
- **Executar uma varredura geral imediata em todas as lojas:**
  ```bash
  python run.py --scrape
  ```
- **Resetar e semear dados padrão de exemplo:**
  ```bash
  python run.py --seed
  ```
- **Build de produção do Frontend:**
  ```bash
  cd frontend
  npm run build
  npm run start
  ```

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
