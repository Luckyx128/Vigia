'use client';

import { BellRing, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

interface HeaderProps {
  onTestNotch: () => void;
  onScrapeAll: () => void;
  onOpenNewProduct: () => void;
  isScraping?: boolean;
}

export function Header({
  onTestNotch,
  onScrapeAll,
  onOpenNewProduct,
  isScraping = false,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end h-16 sm:h-20 gap-2 sm:gap-3">
          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={onTestNotch}
            className="gap-2 text-xs"
          >
            <BellRing className="w-4 h-4 text-cyan-400" />
            <span>Testar Notch</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onScrapeAll}
            disabled={isScraping}
            className="gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
            <span>{isScraping ? 'Varrendo...' : 'Varredura Agora'}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenNewProduct}
            className="gap-1.5 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </Button>

          {/* Theme Toggle (Escuro / Claro / Sistema) */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
