'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Header,
  KpiSummary,
  ProductFilters,
  ProductGrid,
  BlackFridayLegend,
} from '@/components/dashboard';
import { productService, monitorService } from '@/services';
import type { ProductWithStats, StatsOverviewResponse } from '@/types';

export default function Home() {
  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [stats, setStats] = useState<StatsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingId, setScrapingId] = useState<number | null>(null);

  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDeal, setSelectedDeal] = useState('all');
  const [sortOrder, setSortOrder] = useState('default');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prodsData, statsData] = await Promise.all([
        productService.list(),
        monitorService.getOverview(),
      ]);
      setProducts(prodsData);
      setStats(statsData);
    } catch (error) {
      console.error('Falha ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestNotch = async () => {
    try {
      const res = await monitorService.testNotify();
      alert(`Notch Cortinho: ${res.message}`);
    } catch (err: any) {
      alert(`Erro ao testar Notch: ${err.message}`);
    }
  };

  const handleScrapeAll = async () => {
    try {
      setIsScraping(true);
      const res = await monitorService.scrapeAll();
      alert(
        `Varredura concluída!\n${res.success_count}/${res.total_scraped} lojas atualizadas com sucesso.`
      );
      await loadData();
    } catch (err: any) {
      alert(`Erro na varredura: ${err.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  const handleScrapeSingle = async (productId: number) => {
    try {
      setScrapingId(productId);
      const res = await monitorService.scrapeProduct(productId);
      alert(`Produto #${productId} atualizado com sucesso!`);
      await loadData();
    } catch (err: any) {
      alert(`Erro ao atualizar produto: ${err.message}`);
    } finally {
      setScrapingId(null);
    }
  };

  const handleViewHistory = (product: ProductWithStats) => {
    alert(`Histórico do produto ${product.name} (será aberto no modal com Chart.js na Etapa 4).`);
  };

  const handleManageLinks = (product: ProductWithStats) => {
    alert(`Gerenciar links do produto ${product.name} (será aberto no modal na Etapa 4).`);
  };

  const handleOpenNewProduct = () => {
    alert('Modal de Novo Produto será integrado na Etapa 4.');
  };

  // Filtragem e Ordenação reativa
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Busca textual
        const matchesQuery =
          !searchQuery ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.specs && product.specs.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));

        // Categoria
        const matchesCategory =
          selectedCategory === 'all' || product.category === selectedCategory;

        // Selos
        let matchesDeal = true;
        if (selectedDeal === 'real') {
          matchesDeal = Boolean(product.is_real_discount);
        } else if (selectedDeal === 'target') {
          matchesDeal = Boolean(
            product.target_price &&
              product.lowest_price_now &&
              product.lowest_price_now <= product.target_price
          );
        } else if (selectedDeal === 'warning') {
          matchesDeal = typeof product.discount_vs_avg === 'number' && product.discount_vs_avg > 0;
        }

        return matchesQuery && matchesCategory && matchesDeal;
      })
      .sort((a, b) => {
        if (sortOrder === 'price-asc') {
          return (a.lowest_price_now || Infinity) - (b.lowest_price_now || Infinity);
        }
        if (sortOrder === 'discount-desc') {
          return (a.discount_vs_avg || 0) - (b.discount_vs_avg || 0);
        }
        if (sortOrder === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        return a.id - b.id;
      });
  }, [products, searchQuery, selectedCategory, selectedDeal, sortOrder]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        onTestNotch={handleTestNotch}
        onScrapeAll={handleScrapeAll}
        onOpenNewProduct={handleOpenNewProduct}
        isScraping={isScraping}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Cards de Resumo de KPIs */}
        <KpiSummary stats={stats} products={products} isLoading={isLoading} />

        {/* Barra de Busca, Filtros e Ordenação */}
        <ProductFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedDeal={selectedDeal}
          onDealChange={setSelectedDeal}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />

        {/* Grid de Cards de Produtos Monitorados */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Produtos Monitorados</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                {filteredProducts.length}
              </span>
            </h2>
          </div>

          <ProductGrid
            products={filteredProducts}
            isLoading={isLoading}
            onViewHistory={handleViewHistory}
            onManageLinks={handleManageLinks}
            onScrapeSingle={handleScrapeSingle}
            scrapingId={scrapingId}
          />
        </section>

        {/* Legenda de Selos Black Friday */}
        <BlackFridayLegend />
      </main>
    </div>
  );
}
