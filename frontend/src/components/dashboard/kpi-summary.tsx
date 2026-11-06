'use client';

import { Cpu, TrendingDown, Target, Flame } from 'lucide-react';
import { KpiCard } from './kpi-card';
import type { StatsOverviewResponse, ProductWithStats } from '@/types';

interface KpiSummaryProps {
  stats: StatsOverviewResponse | null;
  products: ProductWithStats[];
  isLoading?: boolean;
}

function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'R$ --,--';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function KpiSummary({ stats, products, isLoading = false }: KpiSummaryProps) {
  // Menor preço entre todos os produtos
  const validPrices = products
    .filter((p) => p.lowest_price_now && p.lowest_price_now > 0)
    .sort((a, b) => (a.lowest_price_now || 0) - (b.lowest_price_now || 0));

  const bestProduct = validPrices[0];
  const lowestPriceFormatted = bestProduct?.lowest_price_now
    ? formatBRL(bestProduct.lowest_price_now)
    : 'R$ --,--';

  // Desconto médio vs 30d
  const discounts = products
    .filter((p) => typeof p.discount_vs_avg === 'number')
    .map((p) => p.discount_vs_avg as number);

  const avgDiscount =
    discounts.length > 0
      ? (discounts.reduce((acc, curr) => acc + curr, 0) / discounts.length).toFixed(1)
      : '--';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Total Produtos - Ciano */}
      <KpiCard
        title="Produtos Rastreados"
        value={stats?.total_products ?? products.length}
        subtitle={`em ${stats?.total_links ?? 0} lojas ativas`}
        footerText="Monitoramento 24/7 ativo"
        icon={<Cpu className="w-5 h-5 text-cyan-400" />}
        spotlightColor="#06b6d4"
        isLoading={isLoading}
      />

      {/* KPI 2: Menor Preço Registrado - Esmeralda */}
      <KpiCard
        title="Menor Preço Registrado"
        value={lowestPriceFormatted}
        subtitle={bestProduct ? `na ${bestProduct.lowest_store_now}` : undefined}
        footerText={bestProduct ? bestProduct.name : 'Aguardando dados...'}
        icon={<TrendingDown className="w-5 h-5 text-emerald-400" />}
        spotlightColor="#10b981"
        isLoading={isLoading}
      />

      {/* KPI 3: Alertas na Meta - Âmbar */}
      <KpiCard
        title="Alertas na Meta"
        value={stats?.all_time_low_deals_count ?? 0}
        subtitle="produtos abaixo do alvo"
        footerText="Gatilho direto para Notch"
        icon={<Target className="w-5 h-5 text-amber-400" />}
        spotlightColor="#f59e0b"
        isLoading={isLoading}
      />

      {/* KPI 4: Desconto Médio - Roxo */}
      <KpiCard
        title="Desconto Médio Black"
        value={`${avgDiscount}%`}
        subtitle="vs média de 30 dias"
        footerText="Preço limpo de maquiagem"
        icon={<Flame className="w-5 h-5 text-purple-400" />}
        spotlightColor="#a855f7"
        isLoading={isLoading}
      />
    </div>
  );
}
