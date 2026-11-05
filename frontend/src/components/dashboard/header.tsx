'use client';

import { BellRing, RefreshCw, Plus, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

interface HeaderProps {
  onTestNotch: () => void;
  onScrapeAll: () => void;
  onOpenNewProduct: () => void;
  onOpenBackgroundModal: () => void;
  isScraping?: boolean;
}

export function Header({
  onTestNotch,
  onScrapeAll,
  onOpenNewProduct,
  onOpenBackgroundModal,
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

          {/* Botão de Personalização de Background */}
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenBackgroundModal}
            className="h-8 w-8 text-xs text-muted-foreground hover:text-foreground"
            title="Personalizar Fundo"
          >
            <Palette className="h-4 w-4 text-purple-400" />
            <span className="sr-only">Personalizar Fundo</span>
          </Button>

          {/* Theme Toggle (Escuro / Claro / Sistema) */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
