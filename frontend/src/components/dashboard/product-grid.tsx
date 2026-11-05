'use client';

import { ProductCard } from './product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { PackageSearch } from 'lucide-react';
import type { ProductWithStats } from '@/types';

interface ProductGridProps {
  products: ProductWithStats[];
  isLoading?: boolean;
  onViewHistory: (product: ProductWithStats) => void;
  onManageLinks: (product: ProductWithStats) => void;
  onScrapeSingle: (productId: number) => void;
  scrapingId?: number | null;
}

export function ProductGrid({
  products,
  isLoading = false,
  onViewHistory,
  onManageLinks,
  onScrapeSingle,
  scrapingId,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-2xl border border-border bg-card/60 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-card/40 rounded-2xl border border-border">
        <div className="inline-flex p-4 rounded-2xl bg-muted text-muted-foreground mb-4">
          <PackageSearch className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-foreground">Nenhum produto encontrado</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Tente ajustar sua busca ou filtros para visualizar os itens monitorados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onViewHistory={onViewHistory}
          onManageLinks={onManageLinks}
          onScrapeSingle={onScrapeSingle}
          isScraping={scrapingId === product.id}
        />
      ))}
    </div>
  );
}
