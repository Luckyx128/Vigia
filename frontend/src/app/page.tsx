'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Header,
  KpiSummary,
  ProductFilters,
  ProductGrid,
  BlackFridayLegend,
} from '@/components/dashboard';
import {
  NewProductModal,
  StoreLinksModal,
  HistoryModal,
  BackgroundModal,
} from '@/components/modals';
import Balatro from '@/components/ui/Balatro';
import SideRays from '@/components/ui/SideRays';
import Radar from '@/components/ui/Radar';
import { useBackground } from '@/context/background-context';
import { Toaster, toast } from 'sonner';
import { productService, monitorService } from '@/services';
import type { ProductWithStats, StatsOverviewResponse } from '@/types';

export default function Home() {
  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [stats, setStats] = useState<StatsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingId, setScrapingId] = useState<number | null>(null);

  // Background selecionado pelo contexto
  const { background } = useBackground();

  // Estados dos Modais
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [selectedProductForLinks, setSelectedProductForLinks] = useState<ProductWithStats | null>(null);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<ProductWithStats | null>(null);

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
    } catch (error: any) {
      toast.error(`Falha ao carregar catálogo: ${error.message}`);
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
      toast.success(res.message);
    } catch (err: any) {
      toast.error(`Erro ao testar Notch: ${err.message}`);
    }
  };

  const handleScrapeAll = async () => {
    try {
      setIsScraping(true);
      const res = await monitorService.scrapeAll();
      toast.success(
        `Varredura concluída! ${res.success_count}/${res.total_scraped} lojas atualizadas.`
      );
      await loadData();
    } catch (err: any) {
      toast.error(`Erro na varredura: ${err.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  const handleScrapeSingle = async (productId: number) => {
    try {
      setScrapingId(productId);
      await monitorService.scrapeProduct(productId);
      toast.success('Preços atualizados com sucesso!');
      await loadData();
    } catch (err: any) {
      toast.error(`Erro ao atualizar produto: ${err.message}`);
    } finally {
      setScrapingId(null);
    }
  };

  // Filtragem e Ordenação reativa
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesQuery =
          !searchQuery ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.specs && product.specs.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory =
          selectedCategory === 'all' || product.category === selectedCategory;

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
    <div className="relative min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      {/* Background Animado Condicional */}
      {background === 'balatro' && (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
          <Balatro
            color1="#DE443B"
            color2="#006BB4"
            color3="#162325"
            swirl={0.25}
            pixelSize={1.5}
            mouseInteraction
            contrast={3.5}
            lighting={0.4}
            speed={1}
            rotationSpeed={0}
            scale={1}
            detail={5}
            crt={0}
            mouseStrength={1}
            clickSwirl
            intro
            lightMode={false}
          />
        </div>
      )}

      {background === 'siderays' && (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
          <SideRays
            rayColor1="#FFC46B"
            rayColor2="#96c8ff"
            origin="top-right"
            speed={2.5}
            intensity={2}
            spread={2}
            density={5}
            followMouse
            blend={0.6}
            sharpness={0.5}
            tilt={0}
            falloff={1.6}
            glow={1}
            saturation={1}
            dust={0}
            mouseInfluence={0.5}
            intro
            lightMode={false}
            opacity={1}
          />
        </div>
      )}

      {background === 'radar' && (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-45">
          <Radar
            color="#3ef09a"
            mode="sweep"
            speed={1}
            trail={0.35}
            scale={0.9}
            ringCount={6}
            spokeCount={12}
            targets={6}
            clutter={0.35}
            mouseInteraction
            ticks
            glow={1}
            tilt={0}
            centerX={0.5}
            centerY={0.5}
            brightness={1}
            gridOpacity={1}
            lineWidth={1}
            grain={0.03}
            fade={0}
            opacity={1}
            intro
            lightMode={false}
          />
        </div>
      )}

      <Toaster position="bottom-right" richColors theme="system" />

      {/* Conteúdo da Aplicação sobreposto */}
      <div className="relative z-10 flex flex-col flex-1">
        <Header
          onTestNotch={handleTestNotch}
          onScrapeAll={handleScrapeAll}
          onOpenNewProduct={() => setIsNewProductOpen(true)}
          onOpenBackgroundModal={() => setIsBackgroundModalOpen(true)}
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
              onViewHistory={(p) => setSelectedProductForHistory(p)}
              onManageLinks={(p) => setSelectedProductForLinks(p)}
              onScrapeSingle={handleScrapeSingle}
              scrapingId={scrapingId}
            />
          </section>

          {/* Legenda de Selos Black Friday */}
          <BlackFridayLegend />
        </main>
      </div>

      {/* Modais Integrados */}
      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => setIsNewProductOpen(false)}
        onSuccess={() => {
          toast.success('Produto cadastrado com sucesso!');
          loadData();
        }}
      />

      <StoreLinksModal
        product={selectedProductForLinks}
        isOpen={Boolean(selectedProductForLinks)}
        onClose={() => setSelectedProductForLinks(null)}
        onUpdated={loadData}
      />

      <HistoryModal
        product={selectedProductForHistory}
        isOpen={Boolean(selectedProductForHistory)}
        onClose={() => setSelectedProductForHistory(null)}
        onUpdated={loadData}
      />

      <BackgroundModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
      />
    </div>
  );
}
