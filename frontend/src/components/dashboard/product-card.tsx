'use client';

import { LineChart, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { getStoreStyle } from '@/lib/constants';
import type { ProductWithStats } from '@/types';

interface ProductCardProps {
  product: ProductWithStats;
  onViewHistory: (product: ProductWithStats) => void;
  onManageLinks: (product: ProductWithStats) => void;
  onScrapeSingle: (productId: number) => void;
  isScraping?: boolean;
}

function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'R$ --,--';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function ProductCard({
  product,
  onViewHistory,
  onManageLinks,
  onScrapeSingle,
  isScraping = false,
}: ProductCardProps) {
  const storeStyle = getStoreStyle(product.lowest_store_now);
  const isBelowTarget =
    product.target_price &&
    product.lowest_price_now &&
    product.lowest_price_now <= product.target_price;

  // Cor do holofote baseada no status de oferta
  const spotlightColor = product.is_real_discount
    ? '#10b981' // Esmeralda para Preço Real
    : isBelowTarget
    ? '#f59e0b' // Âmbar para Na Meta
    : '#06b6d4'; // Ciano para Normal

  return (
    <SpotlightCard
      spotlightColor={spotlightColor}
      intensity={0.2}
      spotlightSize={300}
      softness={0.7}
      shape="circle"
      borderGlow={0.65}
      proximity={85}
      smoothing={0.25}
      flare
      className="flex flex-col justify-between border border-border/80 bg-card/75 backdrop-blur-md hover:border-primary/50 transition-all shadow-sm rounded-2xl"
    >
      <div className="p-5 space-y-4 flex-1">
        {/* Header do Card: Categoria & Selo */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-[11px] font-semibold">
            {product.category || 'Hardware'}
          </Badge>

          {product.is_real_discount ? (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
              🟢 Preço Real
            </Badge>
          ) : isBelowTarget ? (
            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-bold">
              🎯 Na Meta
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              Normal
            </Badge>
          )}
        </div>

        {/* Título & Specs */}
        <div>
          <h3 className="font-bold text-base text-foreground line-clamp-1">{product.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.specs}</p>
        </div>

        {/* Bloco de Preço Destaque */}
        <div className="p-3.5 rounded-xl bg-muted/50 border border-border/70 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Menor Preço Atual</span>
            {product.lowest_store_now && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded border ${storeStyle.bg} ${storeStyle.text} ${storeStyle.border}`}
              >
                {product.lowest_store_now}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-emerald-400">
              {formatBRL(product.lowest_price_now)}
            </span>
            {typeof product.discount_vs_avg === 'number' && (
              <span className="text-xs font-semibold text-purple-400">
                {product.discount_vs_avg > 0 ? `+${product.discount_vs_avg}%` : `${product.discount_vs_avg}%`}
              </span>
            )}
          </div>
        </div>

        {/* Métricas Secundárias: Menor Histórico vs Preço Alvo */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-muted/30 border border-border/60">
            <span className="text-muted-foreground text-[10px]">Menor Histórico</span>
            <div className="font-mono font-semibold text-foreground mt-0.5">
              {formatBRL(product.all_time_low)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/60">
            <span className="text-muted-foreground text-[10px]">Preço Alvo</span>
            <div className="font-mono font-semibold text-amber-400 mt-0.5">
              {formatBRL(product.target_price)}
            </div>
          </div>
        </div>
      </div>

      {/* Ações do Card */}
      <div className="border-t border-border/80 p-3 bg-muted/20 flex items-center justify-between gap-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewHistory(product)}
          className="gap-1.5 text-xs flex-1 h-8"
        >
          <LineChart className="w-3.5 h-3.5 text-cyan-400" />
          <span>Histórico</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onManageLinks(product)}
          className="gap-1.5 text-xs h-8 px-2.5"
          title="Gerenciar links de lojas"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span className="font-mono">{product.links_count}</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onScrapeSingle(product.id)}
          disabled={isScraping}
          className="h-8 w-8"
          title="Verificar preços deste produto agora"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </SpotlightCard>
  );
}
