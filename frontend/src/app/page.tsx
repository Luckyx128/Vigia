'use client';

import { useEffect, useState } from 'react';
import { Header, KpiSummary } from '@/components/dashboard';
import { productService, monitorService } from '@/services';
import type { ProductWithStats, StatsOverviewResponse } from '@/types';

export default function Home() {
  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [stats, setStats] = useState<StatsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);

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

  const handleOpenNewProduct = () => {
    alert('Modal de Novo Produto será integrado na Etapa 4.');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        onTestNotch={handleTestNotch}
        onScrapeAll={handleScrapeAll}
        onOpenNewProduct={handleOpenNewProduct}
        isScraping={isScraping}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                Painel de Monitoramento
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  Ao Vivo
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Acompanhamento contínuo de hardware com detecção de descontos autênticos e proteção contra a &quot;metade do dobro&quot;.
              </p>
            </div>
          </div>

          {/* Cards de Resumo de KPIs */}
          <KpiSummary stats={stats} products={products} isLoading={isLoading} />
        </section>
      </main>
    </div>
  );
}
