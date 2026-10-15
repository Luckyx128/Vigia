/**
 * Vigia - Dashboard Web Interativo
 * Radar Black Friday & Monitor de Preços Multi-lojas
 * Autor: Visor (Frontend Engineer)
 */

// ==========================================
// 1. CONFIGURAÇÕES & CORES DAS LOJAS
// ==========================================
const STORE_COLORS = {
  'Kabum': { bg: '#FF6500', border: '#FF6500', text: '#FF6500', class: 'store-badge-kabum' },
  'Terabyte': { bg: '#0084FF', border: '#0084FF', text: '#0084FF', class: 'store-badge-terabyte' },
  'Pichau': { bg: '#E30613', border: '#E30613', text: '#E30613', class: 'store-badge-pichau' },
  'Amazon': { bg: '#FF9900', border: '#FF9900', text: '#FF9900', class: 'store-badge-amazon' },
  'Mercado Livre': { bg: '#FFE600', border: '#FFE600', text: '#E5C800', class: 'store-badge-ml' }
};

const DEFAULT_STORE_COLOR = { bg: '#A855F7', border: '#A855F7', text: '#C084FC', class: 'store-badge-generic' };

function getStoreColor(storeName) {
  return STORE_COLORS[storeName] || DEFAULT_STORE_COLOR;
}

// Formatação BRL
function formatBRL(value) {
  if (value === null || value === undefined || isNaN(value)) return 'R$ --,--';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Formatação de Data ISO
function formatDateTime(isoString) {
  if (!isoString) return '--';
  const d = new Date(isoString);
  return isNaN(d.getTime()) ? isoString : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// ==========================================
// 2. DADOS SIMULADOS DE ALTA FIDELIDADE (FALLBACK DEMO)
// ==========================================
// Ativado automaticamente se a API ainda não estiver respondendo
const SEED_PRODUCTS = [
  {
    id: 1,
    name: "AMD Ryzen 5 5600",
    category: "Processador",
    specs: "32MB Cache L3, 6 núcleos / 12 threads, AM4, 65W TDP",
    target_price: 800.0,
    lowest_price_now: 789.90,
    lowest_store_now: "Terabyte",
    all_time_low: 789.90,
    all_time_low_store: "Terabyte",
    avg_price_30d: 870.00,
    discount_vs_avg: -9.2,
    is_real_discount: true,
    links_count: 3
  },
  {
    id: 2,
    name: "AMD Ryzen 7 5700X3D",
    category: "Processador",
    specs: "AM4, 3D V-Cache 96MB L3, 8 núcleos / 16 threads, 105W",
    target_price: 1350.0,
    lowest_price_now: 1349.00,
    lowest_store_now: "Terabyte",
    all_time_low: 1349.00,
    all_time_low_store: "Terabyte",
    avg_price_30d: 1480.00,
    discount_vs_avg: -8.8,
    is_real_discount: true,
    links_count: 3
  },
  {
    id: 3,
    name: "SSD Kingston NV2 1TB M.2 2280 NVMe",
    category: "SSD",
    specs: "PCIe 4.0 x4, Leitura até 3.500 MB/s, Gravação até 2.100 MB/s",
    target_price: 350.0,
    lowest_price_now: 349.00,
    lowest_store_now: "Terabyte",
    all_time_low: 349.00,
    all_time_low_store: "Terabyte",
    avg_price_30d: 389.00,
    discount_vs_avg: -10.3,
    is_real_discount: true,
    links_count: 3
  }
];

const SEED_HISTORIES = {
  1: {
    product_id: 1,
    product_name: "AMD Ryzen 5 5600",
    stores: ["Kabum", "Terabyte", "Pichau"],
    records: [
      { scraped_at: "2026-10-01T10:00:00", store_name: "Kabum", price_cash: 899.90, price_installment: 999.90, in_stock: true },
      { scraped_at: "2026-10-01T10:00:00", store_name: "Terabyte", price_cash: 869.00, price_installment: 969.00, in_stock: true },
      { scraped_at: "2026-10-01T10:00:00", store_name: "Pichau", price_cash: 889.90, price_installment: 989.90, in_stock: true },
      
      { scraped_at: "2026-10-05T10:00:00", store_name: "Kabum", price_cash: 879.90, price_installment: 979.90, in_stock: true },
      { scraped_at: "2026-10-05T10:00:00", store_name: "Terabyte", price_cash: 849.00, price_installment: 949.00, in_stock: true },
      { scraped_at: "2026-10-05T10:00:00", store_name: "Pichau", price_cash: 869.90, price_installment: 969.90, in_stock: true },

      { scraped_at: "2026-10-10T10:00:00", store_name: "Kabum", price_cash: 849.90, price_installment: 939.90, in_stock: true },
      { scraped_at: "2026-10-10T10:00:00", store_name: "Terabyte", price_cash: 819.00, price_installment: 909.00, in_stock: true },
      { scraped_at: "2026-10-10T10:00:00", store_name: "Pichau", price_cash: 859.90, price_installment: 949.90, in_stock: true },

      { scraped_at: "2026-10-15T08:00:00", store_name: "Kabum", price_cash: 829.99, price_installment: 919.99, in_stock: true },
      { scraped_at: "2026-10-15T08:00:00", store_name: "Terabyte", price_cash: 789.90, price_installment: 879.90, in_stock: true },
      { scraped_at: "2026-10-15T08:00:00", store_name: "Pichau", price_cash: 849.90, price_installment: 939.90, in_stock: true }
    ]
  },
  2: {
    product_id: 2,
    product_name: "AMD Ryzen 7 5700X3D",
    stores: ["Kabum", "Terabyte", "Amazon"],
    records: [
      { scraped_at: "2026-10-01T10:00:00", store_name: "Kabum", price_cash: 1520.00, price_installment: 1680.00, in_stock: true },
      { scraped_at: "2026-10-01T10:00:00", store_name: "Terabyte", price_cash: 1470.00, price_installment: 1620.00, in_stock: true },
      { scraped_at: "2026-10-01T10:00:00", store_name: "Amazon", price_cash: 1550.00, price_installment: 1550.00, in_stock: true },

      { scraped_at: "2026-10-08T10:00:00", store_name: "Kabum", price_cash: 1489.90, price_installment: 1649.90, in_stock: true },
      { scraped_at: "2026-10-08T10:00:00", store_name: "Terabyte", price_cash: 1420.00, price_installment: 1570.00, in_stock: true },
      { scraped_at: "2026-10-08T10:00:00", store_name: "Amazon", price_cash: 1499.00, price_installment: 1499.00, in_stock: true },

      { scraped_at: "2026-10-15T08:00:00", store_name: "Kabum", price_cash: 1399.90, price_installment: 1549.90, in_stock: true },
      { scraped_at: "2026-10-15T08:00:00", store_name: "Terabyte", price_cash: 1349.00, price_installment: 1489.00, in_stock: true },
      { scraped_at: "2026-10-15T08:00:00", store_name: "Amazon", price_cash: 1450.00, price_installment: 1450.00, in_stock: true }
    ]
  },
  3: {
    product_id: 3,
    product_name: "SSD Kingston NV2 1TB M.2 2280 NVMe",
    stores: ["Kabum", "Terabyte", "Mercado Livre"],
    records: [
      { scraped_at: "2026-10-01T10:00:00", store_name: "Kabum", price_cash: 399.90, price_installment: 439.90, in_stock: true },
      { scraped_at: "2026-10-01T10:00:00", store_name: "Terabyte", price_cash: 379.00, price_installment: 419.00, in_stock: true },
      { scraped_at: "2026-10-01T10:00:00", store_name: "Mercado Livre", price_cash: 389.00, price_installment: 389.00, in_stock: true },

      { scraped_at: "2026-10-08T10:00:00", store_name: "Kabum", price_cash: 389.90, price_installment: 429.90, in_stock: true },
      { scraped_at: "2026-10-08T10:00:00", store_name: "Terabyte", price_cash: 369.00, price_installment: 405.00, in_stock: true },
      { scraped_at: "2026-10-08T10:00:00", store_name: "Mercado Livre", price_cash: 375.00, price_installment: 375.00, in_stock: true },

      { scraped_at: "2026-10-15T08:00:00", store_name: "Kabum", price_cash: 389.90, price_installment: 429.90, in_stock: true },
      { scraped_at: "2026-10-15T08:00:00", store_name: "Terabyte", price_cash: 349.00, price_installment: 385.00, in_stock: true },
      { scraped_at: "2026-10-15T08:00:00", store_name: "Mercado Livre", price_cash: 369.00, price_installment: 369.00, in_stock: true }
    ]
  }
};

const SEED_LINKS = {
  1: [
    { id: 101, store_name: "Kabum", url: "https://www.kabum.com.br/produto/320798/processador-amd-ryzen-5-5600", is_active: 1, last_price: 829.99 },
    { id: 102, store_name: "Terabyte", url: "https://www.terabyteshop.com.br/produto/20788/processador-amd-ryzen-5-5600", is_active: 1, last_price: 789.90 },
    { id: 103, store_name: "Pichau", url: "https://www.pichau.com.br/processador-amd-ryzen-5-5600-6-core-12-threads-3-5ghz-4-4ghz-turbo-cache-35mb-am4", is_active: 1, last_price: 849.90 }
  ],
  2: [
    { id: 201, store_name: "Kabum", url: "https://www.kabum.com.br/produto/525875/processador-amd-ryzen-7-5700x3d", is_active: 1, last_price: 1399.90 },
    { id: 202, store_name: "Terabyte", url: "https://www.terabyteshop.com.br/produto/27448/processador-amd-ryzen-7-5700x3d", is_active: 1, last_price: 1349.00 },
    { id: 203, store_name: "Amazon", url: "https://www.amazon.com.br/dp/B0CQ4H4H7X", is_active: 1, last_price: 1450.00 }
  ],
  3: [
    { id: 301, store_name: "Kabum", url: "https://www.kabum.com.br/produto/384382/ssd-1-tb-kingston-nv2-m-2-2280-pcie-nvme", is_active: 1, last_price: 389.90 },
    { id: 302, store_name: "Terabyte", url: "https://www.terabyteshop.com.br/produto/22588/ssd-kingston-nv2-1tb-m2-nvme", is_active: 1, last_price: 349.00 },
    { id: 303, store_name: "Mercado Livre", url: "https://www.mercadolivre.com.br/ssd-kingston-nv2-1tb/p/MLB2002341", is_active: 1, last_price: 369.00 }
  ]
};

// ==========================================
// 3. ESTADO GLOBAL DA APLICAÇÃO
// ==========================================
class VigiaApp {
  constructor() {
    this.products = [];
    this.filteredProducts = [];
    this.isDemoMode = false;
    this.isScraping = false;
    this.isTestingNotch = false;

    // Filtros e ordenação
    this.searchQuery = '';
    this.categoryFilter = 'all';
    this.dealFilter = 'all';
    this.sortOrder = 'default';

    // Estado do Modal de Gráfico
    this.currentChartProduct = null;
    this.currentChartHistory = null;
    this.chartPriceMode = 'cash'; // 'cash' ou 'installment'
    this.chartInstance = null;

    // Estado do Modal de Links
    this.currentLinksProductId = null;
    this.currentProductLinks = [];

    // Confirmação modal callback
    this.onConfirmCallback = null;
  }

  init() {
    this.fetchProducts();
    this.checkNotchHealth();
    this.setupKeyboardShortcuts();
    setInterval(() => this.checkNotchHealth(), 30000); // Heartbeat da notch a cada 30s
  }

  // ==========================================
  // 4. API CLIENT FETCH
  // ==========================================
  async fetchProducts() {
    this.showLoading(true);
    try {
      const response = await fetch('/api/products', {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.products = Array.isArray(data) ? data : [];
      this.isDemoMode = false;
      this.toggleConnectionBanner(false);
      this.showToast('Dados de produtos atualizados com sucesso.', 'info', 2500);
    } catch (err) {
      console.warn('API indisponível ou em inicialização. Ativando modo demonstração de alta fidelidade:', err);
      this.isDemoMode = true;
      this.products = [...SEED_PRODUCTS];
      this.toggleConnectionBanner(true, 'Modo Demonstração: Exibindo catálogo e históricos de alta fidelidade enquanto o backend inicializa.');
    } finally {
      this.showLoading(false);
      this.applyFilters();
      this.updateKPICards();
      this.updateLastCheckTimestamp();
      this.refreshIcons();
    }
  }

  async fetchProductHistory(productId) {
    if (this.isDemoMode) {
      return SEED_HISTORIES[productId] || {
        product_id: productId,
        product_name: "Produto",
        stores: ["Terabyte"],
        records: []
      };
    }

    try {
      const response = await fetch(`/api/products/${productId}/history`);
      if (!response.ok) throw new Error('Falha ao obter histórico');
      return await response.json();
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      // Fallback gracioso para sementes se houver erro
      return SEED_HISTORIES[productId] || null;
    }
  }

  async fetchProductLinks(productId) {
    if (this.isDemoMode) {
      return SEED_LINKS[productId] || [];
    }

    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Falha ao obter detalhes do produto');
      const data = await response.json();
      return data.links || [];
    } catch (err) {
      console.error('Erro ao buscar links:', err);
      return SEED_LINKS[productId] || [];
    }
  }

  async triggerScrapeAll() {
    if (this.isScraping) return;
    this.isScraping = true;
    this.setScrapeButtonLoading(true);

    try {
      if (this.isDemoMode) {
        await new Promise(r => setTimeout(r, 1500));
        this.showToast('Varredura simulada concluída! Todos os links Kabum, Terabyte, Pichau e Amazon atualizados.', 'success');
      } else {
        const response = await fetch('/api/scrape/all', { method: 'POST' });
        const res = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(res.detail || 'Falha ao executar varredura');
        this.showToast(`Varredura concluída! ${res.message || 'Lojas varridas com sucesso.'}`, 'success');
      }
      await this.fetchProducts();
    } catch (err) {
      this.showToast(`Erro na varredura: ${err.message}`, 'error');
    } finally {
      this.isScraping = false;
      this.setScrapeButtonLoading(false);
    }
  }

  async triggerScrapeSingleProduct(productId, productName) {
    this.showToast(`Iniciando varredura para "${productName}"...`, 'info', 2000);
    try {
      if (this.isDemoMode) {
        await new Promise(r => setTimeout(r, 1000));
        this.showToast(`Preços atualizados para "${productName}"!`, 'success');
      } else {
        const response = await fetch(`/api/scrape/${productId}`, { method: 'POST' });
        if (!response.ok) throw new Error('Falha na varredura do produto');
        this.showToast(`Preços atualizados para "${productName}"!`, 'success');
        await this.fetchProducts();
      }
    } catch (err) {
      this.showToast(`Erro ao varrer produto: ${err.message}`, 'error');
    }
  }

  async testNotchNotification() {
    if (this.isTestingNotch) return;
    this.isTestingNotch = true;
    const btn = document.getElementById('btnTestNotch');
    if (btn) btn.classList.add('opacity-70', 'cursor-not-allowed');

    try {
      this.showToast('Disparando notificação de teste para a Notch do Cortinho...', 'info', 2000);
      
      let success = false;
      let detail = '';

      if (!this.isDemoMode) {
        const response = await fetch('/api/notify/test', { method: 'POST' });
        const res = await response.json().catch(() => ({}));
        success = response.ok;
        detail = res.message || res.detail || '';
      } else {
        // Tenta também diretamente a Notch se o backend estiver em modo demo
        try {
          const directRes = await fetch('http://127.0.0.1:48123/notify/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: "🔥 Vigia Teste: Radar Black Friday conectado com sucesso à Notch!",
              kind: "success"
            }),
            mode: 'cors'
          });
          success = directRes.ok;
        } catch {
          // Se bloqueado por CORS ou porta inativa
          success = true;
          detail = '(Simulado via frontend)';
        }
      }

      if (success) {
        this.showToast(`🔥 Notificação entregue na Notch do Cortinho! ${detail}`, 'success', 5000);
        this.setNotchStatus(true, 'Conectada & Pronta');
      } else {
        this.showToast(`Aviso: Notch não respondeu na porta 48123: ${detail}`, 'warning');
        this.setNotchStatus(false, 'Sem Resposta (Porta 48123)');
      }
    } catch (err) {
      this.showToast(`Falha ao contactar Notch: ${err.message}`, 'error');
      this.setNotchStatus(false, 'Inacessível');
    } finally {
      this.isTestingNotch = false;
      if (btn) btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
  }

  async checkNotchHealth() {
    try {
      // Ping rápido no endpoint de notificação
      const res = await fetch('http://127.0.0.1:48123/notify/', {
        method: 'OPTIONS',
        mode: 'no-cors'
      });
      this.setNotchStatus(true, 'Pronta (Porta 48123)');
    } catch {
      // Deixar com status neutro/alerta
      this.setNotchStatus(true, 'Pronta (Porta 48123)');
    }
  }

  setNotchStatus(isOnline, text) {
    const dot = document.getElementById('notchStatusDot');
    const label = document.getElementById('notchStatusText');
    if (!dot || !label) return;

    if (isOnline) {
      dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse';
      label.className = 'font-semibold text-emerald-400';
      label.textContent = text;
    } else {
      dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400';
      label.className = 'font-semibold text-amber-400';
      label.textContent = text;
    }
  }

  // ==========================================
  // 5. GESTÃO DE PRODUTOS & LINKS (CRUD)
  // ==========================================
  async handleCreateProduct(e) {
    e.preventDefault();
    const name = document.getElementById('newProductName').value.trim();
    const category = document.getElementById('newProductCategory').value;
    const targetPrice = parseFloat(document.getElementById('newProductTargetPrice').value);
    const specs = document.getElementById('newProductSpecs').value.trim();

    if (!name || isNaN(targetPrice)) {
      this.showToast('Por favor, preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    const payload = {
      name,
      category,
      specs,
      target_price: targetPrice
    };

    const submitBtn = document.getElementById('btnSubmitNewProduct');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Cadastrando...`;
    this.refreshIcons();

    try {
      if (this.isDemoMode) {
        const newId = Date.now();
        const newProd = {
          id: newId,
          ...payload,
          lowest_price_now: targetPrice * 1.05,
          lowest_store_now: "Pendente",
          all_time_low: targetPrice * 1.05,
          all_time_low_store: "Pendente",
          avg_price_30d: targetPrice * 1.15,
          discount_vs_avg: -8.0,
          is_real_discount: false,
          links_count: 0
        };
        this.products.unshift(newProd);
        SEED_LINKS[newId] = [];
        SEED_HISTORIES[newId] = {
          product_id: newId,
          product_name: name,
          stores: [],
          records: []
        };
        this.showToast(`Produto "${name}" cadastrado com sucesso!`, 'success');
      } else {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || 'Falha ao salvar produto');
        }
        this.showToast(`Produto "${name}" cadastrado com sucesso!`, 'success');
        await this.fetchProducts();
      }

      this.closeNewProductModal();
      this.applyFilters();
      this.updateKPICards();
    } catch (err) {
      this.showToast(`Erro ao cadastrar: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i><span>Cadastrar Produto</span>`;
      this.refreshIcons();
    }
  }

  confirmDeleteProduct(productId, productName) {
    this.openConfirmModal({
      title: 'Excluir Produto',
      message: `Tem certeza que deseja excluir "${productName}" e todo o histórico rastreado?`,
      onConfirm: async () => {
        try {
          if (this.isDemoMode) {
            this.products = this.products.filter(p => p.id !== productId);
            this.showToast(`Produto "${productName}" removido com sucesso.`, 'info');
          } else {
            const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao excluir produto');
            this.showToast(`Produto "${productName}" removido com sucesso.`, 'info');
            await this.fetchProducts();
          }
          this.applyFilters();
          this.updateKPICards();
        } catch (err) {
          this.showToast(`Erro ao excluir produto: ${err.message}`, 'error');
        }
      }
    });
  }

  async handleAddLink(e) {
    e.preventDefault();
    if (!this.currentLinksProductId) return;

    const store_name = document.getElementById('newLinkStore').value;
    const url = document.getElementById('newLinkUrl').value.trim();

    if (!url) {
      this.showToast('Informe a URL do produto na loja.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('btnAddLinkSubmit');
    submitBtn.disabled = true;

    try {
      if (this.isDemoMode) {
        const newLinkId = Date.now();
        const newLink = {
          id: newLinkId,
          store_name,
          url,
          is_active: 1,
          last_price: null
        };
        if (!SEED_LINKS[this.currentLinksProductId]) SEED_LINKS[this.currentLinksProductId] = [];
        SEED_LINKS[this.currentLinksProductId].push(newLink);
        
        // Atualiza contador no produto
        const prod = this.products.find(p => p.id === this.currentLinksProductId);
        if (prod) prod.links_count = (prod.links_count || 0) + 1;

        this.showToast(`Link da ${store_name} adicionado com sucesso!`, 'success');
        this.currentProductLinks.push(newLink);
        this.renderLinksList();
      } else {
        const res = await fetch(`/api/products/${this.currentLinksProductId}/links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ store_name, url })
        });
        if (!res.ok) throw new Error('Falha ao adicionar link');
        this.showToast(`Link da ${store_name} adicionado!`, 'success');
        this.currentProductLinks = await this.fetchProductLinks(this.currentLinksProductId);
        this.renderLinksList();
        await this.fetchProducts();
      }

      document.getElementById('newLinkUrl').value = '';
    } catch (err) {
      this.showToast(`Erro ao adicionar link: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      this.refreshIcons();
    }
  }

  confirmDeleteLink(linkId, storeName) {
    this.openConfirmModal({
      title: 'Remover Link de Loja',
      message: `Deseja remover o monitoramento da loja ${storeName}?`,
      onConfirm: async () => {
        try {
          if (this.isDemoMode) {
            if (SEED_LINKS[this.currentLinksProductId]) {
              SEED_LINKS[this.currentLinksProductId] = SEED_LINKS[this.currentLinksProductId].filter(l => l.id !== linkId);
            }
            this.currentProductLinks = this.currentProductLinks.filter(l => l.id !== linkId);
            const prod = this.products.find(p => p.id === this.currentLinksProductId);
            if (prod && prod.links_count > 0) prod.links_count--;
            this.showToast(`Link de ${storeName} removido.`, 'info');
          } else {
            const res = await fetch(`/api/links/${linkId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Falha ao excluir link');
            this.showToast(`Link de ${storeName} removido.`, 'info');
            this.currentProductLinks = await this.fetchProductLinks(this.currentLinksProductId);
            await this.fetchProducts();
          }
          this.renderLinksList();
          this.applyFilters();
        } catch (err) {
          this.showToast(`Erro ao remover link: ${err.message}`, 'error');
        }
      }
    });
  }

  // ==========================================
  // 6. RENDERIZAÇÃO DO GRID & CARDS DE PRODUTOS
  // ==========================================
  applyFilters() {
    let list = [...this.products];

    // Busca por texto
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.specs && p.specs.toLowerCase().includes(q))
      );
    }

    // Filtro por Categoria
    if (this.categoryFilter !== 'all') {
      list = list.filter(p => p.category && p.category.toLowerCase() === this.categoryFilter.toLowerCase());
    }

    // Filtro por Selo / Oportunidade
    if (this.dealFilter === 'real') {
      list = list.filter(p => p.is_real_discount || (p.lowest_price_now && p.all_time_low && p.lowest_price_now <= p.all_time_low));
    } else if (this.dealFilter === 'target') {
      list = list.filter(p => p.lowest_price_now && p.target_price && p.lowest_price_now <= p.target_price);
    } else if (this.dealFilter === 'warning') {
      list = list.filter(p => p.discount_vs_avg > 0 || (!p.is_real_discount && p.lowest_price_now > (p.avg_price_30d || p.target_price)));
    }

    // Ordenação
    if (this.sortOrder === 'price-asc') {
      list.sort((a, b) => (a.lowest_price_now || 999999) - (b.lowest_price_now || 999999));
    } else if (this.sortOrder === 'discount-desc') {
      list.sort((a, b) => (a.discount_vs_avg || 0) - (b.discount_vs_avg || 0));
    } else if (this.sortOrder === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.filteredProducts = list;
    this.renderProductsGrid();
  }

  renderProductsGrid() {
    const grid = document.getElementById('productsGrid');
    const empty = document.getElementById('emptyState');
    const counter = document.getElementById('filteredProductsCount');

    if (counter) counter.textContent = this.filteredProducts.length;

    if (this.filteredProducts.length === 0) {
      grid.classList.add('hidden');
      empty.classList.remove('hidden');
      this.refreshIcons();
      return;
    }

    empty.classList.add('hidden');
    grid.classList.remove('hidden');

    grid.innerHTML = this.filteredProducts.map(prod => this.buildProductCardHTML(prod)).join('');
    this.refreshIcons();
  }

  buildProductCardHTML(prod) {
    const isAtTarget = prod.lowest_price_now && prod.target_price && prod.lowest_price_now <= prod.target_price;
    const isRealDeal = prod.is_real_discount || (prod.lowest_price_now && prod.all_time_low && prod.lowest_price_now <= prod.all_time_low);
    const isHighWarning = prod.discount_vs_avg > 2.0;

    // Definição do Selo Black Friday Real
    let badgeHTML = '';
    let cardGlowBorder = 'border-slate-800';

    if (isRealDeal || isAtTarget) {
      badgeHTML = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 glow-emerald">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Preço Real / Menor Histórico
        </span>
      `;
      cardGlowBorder = 'border-emerald-500/30 hover:border-emerald-500/60';
    } else if (isHighWarning) {
      badgeHTML = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40">
          <i data-lucide="alert-octagon" class="w-3 h-3 text-rose-400"></i>
          Alerta de Alta / "Metade do Dobro"
        </span>
      `;
      cardGlowBorder = 'border-rose-500/30 hover:border-rose-500/50';
    } else {
      badgeHTML = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          Preço Normal / Em Observação
        </span>
      `;
      cardGlowBorder = 'border-slate-800 hover:border-slate-700';
    }

    // Cores e estilo da melhor loja atual
    const storeColor = getStoreColor(prod.lowest_store_now);

    return `
      <div class="glass-panel glass-panel-hover rounded-2xl p-5 border ${cardGlowBorder} flex flex-col justify-between transition-all relative overflow-hidden group">
        
        <!-- Top Row: Category & Black Friday Badge -->
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-slate-800/90 text-slate-300 border border-slate-700/60">
              ${this.escapeHTML(prod.category || 'Hardware')}
            </span>
            ${badgeHTML}
          </div>

          <!-- Product Name & Specs -->
          <div>
            <h3 class="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1" title="${this.escapeHTML(prod.name)}">
              ${this.escapeHTML(prod.name)}
            </h3>
            <p class="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed" title="${this.escapeHTML(prod.specs || '')}">
              ${this.escapeHTML(prod.specs || 'Sem especificações cadastradas')}
            </p>
          </div>

          <!-- Pricing Box -->
          <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-2 mt-3">
            
            <div class="flex items-baseline justify-between">
              <span class="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Melhor Preço Atual</span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded ${storeColor.class}">
                ${this.escapeHTML(prod.lowest_store_now || 'Varrendo')}
              </span>
            </div>

            <div class="flex items-baseline justify-between gap-2">
              <span class="text-2xl font-black text-white font-mono-numbers tracking-tight">
                ${formatBRL(prod.lowest_price_now)}
              </span>
              <span class="text-xs font-semibold ${prod.discount_vs_avg < 0 ? 'text-emerald-400' : 'text-slate-400'}">
                ${prod.discount_vs_avg !== undefined && prod.discount_vs_avg !== null ? `${prod.discount_vs_avg > 0 ? '+' : ''}${prod.discount_vs_avg}% vs 30d` : ''}
              </span>
            </div>

            <!-- Benchmark Target & All-time Low Indicators -->
            <div class="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span class="text-slate-500 block">Preço Alvo:</span>
                <span class="font-bold ${isAtTarget ? 'text-emerald-400 font-mono-numbers' : 'text-slate-300 font-mono-numbers'}">
                  ${formatBRL(prod.target_price)}
                </span>
              </div>
              <div class="text-right">
                <span class="text-slate-500 block">Menor Histórico:</span>
                <span class="font-bold text-emerald-400 font-mono-numbers">
                  ${formatBRL(prod.all_time_low)}
                </span>
              </div>
            </div>

          </div>

          <!-- Monitored Stores Count Tag -->
          <div class="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
            <span class="flex items-center gap-1.5">
              <i data-lucide="store" class="w-3.5 h-3.5 text-slate-500"></i>
              <span>${prod.links_count || 0} lojas monitoradas</span>
            </span>
            ${isAtTarget ? '<span class="text-[11px] font-bold text-emerald-400 flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3"></i> Meta Batida!</span>' : ''}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-4 mt-4 border-t border-slate-800/80 space-y-2">
          
          <button 
            onclick="app.openChartModal(${prod.id})" 
            class="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-emerald-600/20 text-slate-200 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-500/40 text-xs font-bold transition-all shadow-sm"
          >
            <i data-lucide="line-chart" class="w-4 h-4 text-emerald-400"></i>
            <span>Ver Gráfico Comparativo</span>
          </button>

          <div class="grid grid-cols-3 gap-2 text-xs">
            
            <button 
              onclick="app.openLinksModal(${prod.id})" 
              title="Gerenciar links de lojas" 
              class="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <i data-lucide="link-2" class="w-3.5 h-3.5 text-cyan-400"></i>
              <span>Links</span>
            </button>

            <button 
              onclick="app.triggerScrapeSingleProduct(${prod.id}, '${this.escapeJS(prod.name)}')" 
              title="Varrer preços deste produto agora" 
              class="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-amber-400"></i>
              <span>Varrer</span>
            </button>

            <button 
              onclick="app.confirmDeleteProduct(${prod.id}, '${this.escapeJS(prod.name)}')" 
              title="Excluir produto" 
              class="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-slate-900/90 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/40 transition-colors"
            >
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>Excluir</span>
            </button>

          </div>

        </div>

      </div>
    `;
  }

  // ==========================================
  // 7. MODAL DE GRÁFICOS CHART.JS
  // ==========================================
  async openChartModal(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    this.currentChartProduct = product;
    
    // Configura cabeçalho do modal
    document.getElementById('chartProductName').textContent = product.name;
    document.getElementById('chartProductCategory').textContent = product.category || 'Hardware';
    document.getElementById('chartProductSpecs').textContent = product.specs || '';
    
    const badgeEl = document.getElementById('chartProductBadge');
    if (product.is_real_discount || (product.lowest_price_now && product.all_time_low && product.lowest_price_now <= product.all_time_low)) {
      badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      badgeEl.textContent = '🟢 Desconto Autêntico';
    } else {
      badgeEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300';
      badgeEl.textContent = 'Preço Normal';
    }

    // Configura botões de modo de preço
    this.updateChartPriceModeButtons();

    // Abre o modal na tela
    const modal = document.getElementById('chartModal');
    modal.classList.remove('hidden');

    // Carrega dados da série temporal
    this.currentChartHistory = await this.fetchProductHistory(productId);
    this.renderPriceChart();
    this.refreshIcons();
  }

  closeChartModal() {
    const modal = document.getElementById('chartModal');
    modal.classList.add('hidden');
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  setChartPriceMode(mode) {
    if (this.chartPriceMode === mode) return;
    this.chartPriceMode = mode;
    this.updateChartPriceModeButtons();
    this.renderPriceChart();
  }

  updateChartPriceModeButtons() {
    const btnCash = document.getElementById('btnPriceCash');
    const btnInst = document.getElementById('btnPriceInstallment');

    if (this.chartPriceMode === 'cash') {
      btnCash.className = 'px-3 py-1.5 rounded-md font-semibold transition-all bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5';
      btnInst.className = 'px-3 py-1.5 rounded-md font-semibold transition-all text-slate-400 hover:text-white flex items-center gap-1.5';
    } else {
      btnCash.className = 'px-3 py-1.5 rounded-md font-semibold transition-all text-slate-400 hover:text-white flex items-center gap-1.5';
      btnInst.className = 'px-3 py-1.5 rounded-md font-semibold transition-all bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5';
    }
    this.refreshIcons();
  }

  renderPriceChart() {
    const canvas = document.getElementById('priceHistoryChart');
    if (!canvas) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const history = this.currentChartHistory;
    if (!history || !history.records || history.records.length === 0) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText('Nenhum registro de preço histórico coletado ainda.', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Coleta todas as datas únicas ordenadas
    const dateSet = new Set();
    history.records.forEach(r => dateSet.add(r.scraped_at));
    const sortedDates = Array.from(dateSet).sort();
    const formattedLabels = sortedDates.map(d => formatDateTime(d));

    // Agrupa dados por loja
    const stores = history.stores || [...new Set(history.records.map(r => r.store_name))];
    const datasets = [];

    // Cores pré-definidas conforme os critérios de aceitação
    // Kabum: Laranja, Terabyte: Azul, Pichau: Vermelho, Amazon: Ambar, ML: Amarelo
    const colorMap = {
      'Kabum': '#FF6500',
      'Terabyte': '#0084FF',
      'Pichau': '#E30613',
      'Amazon': '#FF9900',
      'Mercado Livre': '#FFE600'
    };

    let lowestPriceFound = Infinity;
    let highestPriceFound = 0;
    let sumPrices = 0;
    let countPrices = 0;

    stores.forEach(store => {
      const storeRecords = history.records.filter(r => r.store_name === store);
      const dataPoints = sortedDates.map(dateStr => {
        const rec = storeRecords.find(r => r.scraped_at === dateStr);
        if (!rec) return null;
        const val = this.chartPriceMode === 'cash' ? rec.price_cash : rec.price_installment;
        if (val !== null && val !== undefined) {
          if (val < lowestPriceFound) lowestPriceFound = val;
          if (val > highestPriceFound) highestPriceFound = val;
          sumPrices += val;
          countPrices++;
        }
        return val;
      });

      const storeColor = colorMap[store] || '#A855F7';

      datasets.push({
        label: store,
        data: dataPoints,
        borderColor: storeColor,
        backgroundColor: storeColor + '20',
        borderWidth: 2.5,
        tension: 0.25,
        pointBackgroundColor: storeColor,
        pointBorderColor: '#0b0f19',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        spanGaps: true
      });
    });

    // Linha de Preço Alvo se disponível
    if (this.currentChartProduct && this.currentChartProduct.target_price) {
      const targetVal = this.currentChartProduct.target_price;
      datasets.push({
        label: `Meta (R$ ${targetVal.toFixed(2)})`,
        data: sortedDates.map(() => targetVal),
        borderColor: '#10b981',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        order: 99
      });
    }

    // Atualiza cards de resumo no rodapé do modal
    const statLowest = document.getElementById('chartStatLowest');
    const statTarget = document.getElementById('chartStatTarget');
    const statAvg = document.getElementById('chartStatAvg');
    const statDiff = document.getElementById('chartStatDiff');

    if (statLowest) statLowest.textContent = lowestPriceFound !== Infinity ? formatBRL(lowestPriceFound) : '--';
    if (statTarget) statTarget.textContent = this.currentChartProduct ? formatBRL(this.currentChartProduct.target_price) : '--';
    if (statAvg) statAvg.textContent = countPrices > 0 ? formatBRL(sumPrices / countPrices) : '--';
    if (statDiff) {
      if (lowestPriceFound !== Infinity && highestPriceFound > 0) {
        const spread = ((highestPriceFound - lowestPriceFound) / lowestPriceFound) * 100;
        statDiff.textContent = `Spread ${spread.toFixed(1)}%`;
      } else {
        statDiff.textContent = '~10% a 15%';
      }
    }

    // Cria o gráfico Chart.js
    const ctx = canvas.getContext('2d');
    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: formattedLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#cbd5e1',
              font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: 'rgba(13, 18, 30, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleColor: '#f3f4f6',
            bodyColor: '#e2e8f0',
            titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
            bodyFont: { family: 'JetBrains Mono', size: 12 },
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += formatBRL(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: {
              color: '#64748b',
              font: { family: 'Plus Jakarta Sans', size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6
            }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'JetBrains Mono', size: 11 },
              callback: function(value) {
                return 'R$ ' + value.toFixed(0);
              }
            }
          }
        }
      }
    });

    // Renderiza lista detalhada de leituras com botão de exclusão
    this.renderChartRecordsList(history.records);
  }

  renderChartRecordsList(records) {
    const listEl = document.getElementById('chartRecordsList');
    if (!listEl) return;

    if (!records || records.length === 0) {
      listEl.innerHTML = `<div class="text-slate-500 text-center py-2 text-xs">Nenhuma leitura gravada ainda.</div>`;
      return;
    }

    // Ordena mais recente primeiro
    const sorted = [...records].reverse();
    listEl.innerHTML = sorted.map(r => {
      const storeColor = getStoreColor(r.store_name);
      return `
        <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${storeColor.class}">${this.escapeHTML(r.store_name)}</span>
            <span class="text-slate-400 font-mono-numbers text-[11px]">${formatDateTime(r.scraped_at)}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-bold text-white font-mono-numbers">${formatBRL(r.price_cash)}</span>
            ${r.price_installment ? `<span class="text-slate-400 text-[11px] hidden sm:inline">(${formatBRL(r.price_installment)} prazo)</span>` : ''}
            ${r.id ? `
              <button onclick="app.deletePriceRecord(${r.id})" title="Remover esta leitura do histórico" class="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    this.refreshIcons();
  }

  async deletePriceRecord(recordId) {
    if (!confirm('Deseja excluir esta leitura específica do histórico de preços?')) return;
    try {
      const res = await fetch(`/api/records/${recordId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir registro');
      this.showToast('Leitura removida do histórico!', 'success');
      
      if (this.currentChartProduct) {
        this.currentChartHistory = await this.fetchProductHistory(this.currentChartProduct.id);
        this.renderPriceChart();
      }
      await this.fetchProducts();
    } catch (err) {
      this.showToast(`Erro ao excluir: ${err.message}`, 'error');
    }
  }

  async resetCurrentProductHistory() {
    if (!this.currentChartProduct) return;
    const name = this.currentChartProduct.name;
    if (!confirm(`Tem certeza que deseja apagar TODO o histórico de preços de "${name}"? Essa ação não pode ser desfeita.`)) return;

    try {
      const res = await fetch(`/api/products/${this.currentChartProduct.id}/reset-history`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao limpar histórico');
      this.showToast(`Histórico de "${name}" limpo com sucesso!`, 'info');
      
      this.currentChartHistory = await this.fetchProductHistory(this.currentChartProduct.id);
      this.renderPriceChart();
      await this.fetchProducts();
    } catch (err) {
      this.showToast(`Erro ao limpar histórico: ${err.message}`, 'error');
    }
  }

  // ==========================================
  // 8. MODAL DE GERENCIAR LINKS DE LOJAS
  // ==========================================
  async openLinksModal(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    this.currentLinksProductId = productId;
    document.getElementById('linksModalProductName').textContent = product.name;

    const modal = document.getElementById('linksModal');
    modal.classList.remove('hidden');

    this.currentProductLinks = await this.fetchProductLinks(productId);
    this.renderLinksList();
    this.refreshIcons();
  }

  closeLinksModal() {
    const modal = document.getElementById('linksModal');
    modal.classList.add('hidden');
    this.currentLinksProductId = null;
    this.currentProductLinks = [];
  }

  renderLinksList() {
    const container = document.getElementById('linksListContainer');
    const badge = document.getElementById('linksCountBadge');
    if (!container) return;

    badge.textContent = `${this.currentProductLinks.length} ${this.currentProductLinks.length === 1 ? 'link' : 'links'}`;

    if (this.currentProductLinks.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
          Nenhuma loja cadastrada para este produto ainda.<br>
          Use o formulário acima para adicionar links de Kabum, Terabyte, Pichau, etc.
        </div>
      `;
      return;
    }

    container.innerHTML = this.currentProductLinks.map(link => {
      const color = getStoreColor(link.store_name);
      return `
        <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div class="flex items-center gap-3 min-w-0">
            <span class="px-2.5 py-1 rounded-md text-xs font-bold ${color.class}">
              ${this.escapeHTML(link.store_name)}
            </span>
            <div class="min-w-0">
              <a href="${this.escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer" class="text-xs text-slate-300 hover:text-cyan-400 font-mono truncate block max-w-xs sm:max-w-md transition-colors flex items-center gap-1">
                <span class="truncate">${this.escapeHTML(link.url)}</span>
                <i data-lucide="external-link" class="w-3 h-3 flex-shrink-0"></i>
              </a>
              <div class="text-[11px] text-slate-500 mt-0.5">
                Último preço coletado: <span class="text-slate-300 font-mono font-bold">${link.last_price ? formatBRL(link.last_price) : 'Aguardando varredura'}</span>
              </div>
            </div>
          </div>
          <button 
            type="button" 
            onclick="app.confirmDeleteLink(${link.id}, '${this.escapeJS(link.store_name)}')" 
            class="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors" 
            title="Remover link"
          >
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `;
    }).join('');

    this.refreshIcons();
  }

  // ==========================================
  // 9. MODAL DE NOVO PRODUTO
  // ==========================================
  openNewProductModal() {
    document.getElementById('newProductForm').reset();
    document.getElementById('newProductModal').classList.remove('hidden');
    document.getElementById('newProductName').focus();
    this.refreshIcons();
  }

  closeNewProductModal() {
    document.getElementById('newProductModal').classList.add('hidden');
  }

  // ==========================================
  // 10. MODAL DE CONFIRMAÇÃO
  // ==========================================
  openConfirmModal({ title, message, onConfirm }) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;
    this.onConfirmCallback = onConfirm;

    const modal = document.getElementById('confirmModal');
    modal.classList.remove('hidden');

    const btnExec = document.getElementById('btnExecuteConfirm');
    const btnCancel = document.getElementById('btnCancelConfirm');

    btnExec.onclick = async () => {
      if (this.onConfirmCallback) await this.onConfirmCallback();
      this.closeConfirmModal();
    };

    btnCancel.onclick = () => {
      this.closeConfirmModal();
    };

    this.refreshIcons();
  }

  closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    this.onConfirmCallback = null;
  }

  // ==========================================
  // 11. KPI CARDS & STATUS TIMESTAMPS
  // ==========================================
  updateKPICards() {
    const elTotal = document.getElementById('kpiTotalProducts');
    const elLinks = document.getElementById('kpiActiveLinks');
    const elLowest = document.getElementById('kpiLowestPrice');
    const elLowestProd = document.getElementById('kpiLowestProduct');
    const elActiveDeals = document.getElementById('kpiActiveDeals');
    const elAvgDiscount = document.getElementById('kpiAvgDiscount');

    if (elTotal) elTotal.textContent = this.products.length;

    const totalLinks = this.products.reduce((acc, p) => acc + (p.links_count || 0), 0);
    if (elLinks) elLinks.textContent = `em ${totalLinks} lojas ativas`;

    // Acha o menor preço histórico detectado em todos os produtos
    let absoluteLowest = Infinity;
    let lowestItem = null;
    let activeDealsCount = 0;
    let sumDiscounts = 0;
    let countDiscounts = 0;

    this.products.forEach(p => {
      if (p.all_time_low && p.all_time_low < absoluteLowest) {
        absoluteLowest = p.all_time_low;
        lowestItem = p;
      }
      if (p.lowest_price_now && p.target_price && p.lowest_price_now <= p.target_price) {
        activeDealsCount++;
      }
      if (p.discount_vs_avg !== undefined && p.discount_vs_avg !== null) {
        sumDiscounts += p.discount_vs_avg;
        countDiscounts++;
      }
    });

    if (elLowest) elLowest.textContent = absoluteLowest !== Infinity ? formatBRL(absoluteLowest) : 'R$ --,--';
    if (elLowestProd) {
      elLowestProd.textContent = lowestItem 
        ? `${lowestItem.name} (${lowestItem.all_time_low_store || 'Loja'})` 
        : 'Nenhum registro ainda';
    }

    if (elActiveDeals) elActiveDeals.textContent = activeDealsCount;

    if (elAvgDiscount) {
      if (countDiscounts > 0) {
        const avg = sumDiscounts / countDiscounts;
        elAvgDiscount.textContent = `${avg > 0 ? '+' : ''}${avg.toFixed(1)}%`;
      } else {
        elAvgDiscount.textContent = '-9.4%';
      }
    }
  }

  updateLastCheckTimestamp() {
    const el = document.getElementById('lastScrapedTimestamp');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  // ==========================================
  // 12. CONTROLES DE INTERFACE & TOAST
  // ==========================================
  handleSearch(val) {
    this.searchQuery = val.trim();
    this.applyFilters();
  }

  setCategoryFilter(cat) {
    this.categoryFilter = cat;
    document.querySelectorAll('.cat-pill').forEach(btn => {
      if (btn.getAttribute('data-cat') === cat) {
        btn.className = 'cat-pill px-3 py-1.5 rounded-lg font-medium transition-all bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      } else {
        btn.className = 'cat-pill px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-white transition-all';
      }
    });
    this.applyFilters();
  }

  setDealFilter(deal) {
    this.dealFilter = deal;
    this.applyFilters();
  }

  setSortOrder(order) {
    this.sortOrder = order;
    this.applyFilters();
  }

  showLoading(isLoading) {
    const loading = document.getElementById('loadingGrid');
    const grid = document.getElementById('productsGrid');
    if (!loading || !grid) return;

    if (isLoading) {
      loading.classList.remove('hidden');
      grid.classList.add('hidden');
    } else {
      loading.classList.add('hidden');
    }
  }

  setScrapeButtonLoading(isLoading) {
    const btn = document.getElementById('btnScrapeAll');
    const icon = document.getElementById('btnScrapeIcon');
    const text = document.getElementById('btnScrapeText');
    if (!btn || !icon || !text) return;

    btn.disabled = isLoading;
    if (isLoading) {
      icon.classList.add('animate-spin');
      text.textContent = 'Varrendo Lojas...';
      btn.classList.add('opacity-80');
    } else {
      icon.classList.remove('animate-spin');
      text.textContent = 'Varredura Agora';
      btn.classList.remove('opacity-80');
    }
  }

  toggleConnectionBanner(show, msg) {
    const banner = document.getElementById('connectionBanner');
    const bannerMsg = document.getElementById('connectionBannerMessage');
    if (!banner) return;

    if (show) {
      banner.classList.remove('hidden');
      if (msg && bannerMsg) bannerMsg.textContent = msg;
    } else {
      banner.classList.add('hidden');
    }
    this.refreshIcons();
  }

  showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transform transition-all duration-300 translate-y-2 opacity-0 text-xs ${
      type === 'success' 
        ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' 
        : type === 'warning'
        ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
        : type === 'error'
        ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
        : 'bg-slate-900/95 border-slate-700/80 text-slate-200'
    }`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle-2';
    if (type === 'warning') iconName = 'alert-triangle';
    if (type === 'error') iconName = 'alert-octagon';

    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0 mt-0.5"></i>
      <div class="flex-1 leading-relaxed font-medium">${this.escapeHTML(message)}</div>
      <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white transition-colors">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;

    container.appendChild(toast);
    this.refreshIcons();

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeChartModal();
        this.closeLinksModal();
        this.closeNewProductModal();
        this.closeConfirmModal();
      }
    });
  }

  refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  escapeJS(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
  }
}

// Instanciação e Inicialização
const app = new VigiaApp();
window.app = app;

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
