'use client';

import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDeal: string;
  onDealChange: (deal: string) => void;
  sortOrder: string;
  onSortChange: (sort: string) => void;
}

const DEAL_LABELS: Record<string, string> = {
  all: 'Todos os Selos',
  real: '🟢 Selo Preço Real',
  target: '🎯 Abaixo da Meta',
  warning: '🔴 Alerta de Alta',
};

const SORT_LABELS: Record<string, string> = {
  default: 'Ordenar: Padrão',
  'price-asc': 'Menor Preço Atual',
  'discount-desc': 'Maior Desconto %',
  'name-asc': 'Nome (A - Z)',
};

export function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDeal,
  onDealChange,
  sortOrder,
  onSortChange,
}: ProductFiltersProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Atalho global Ctrl+K (ou Cmd+K no Mac) para focar na busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card/60 p-4 rounded-2xl border border-border">
      {/* Busca por texto com altura h-9 padronizada */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar por processador, SSD, especificação..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-16 h-9 text-xs sm:text-sm rounded-xl"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border font-semibold shadow-xs">
            Ctrl
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border font-semibold shadow-xs">
            K
          </kbd>
        </div>
      </div>

      {/* Filtros e Ordenação com altura h-9 padronizada */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Filtro de Categoria (container h-9) */}
        <div className="flex items-center gap-1 p-1 h-9 rounded-xl bg-muted/60 border border-border text-xs">
          <Button
            type="button"
            variant={selectedCategory === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onCategoryChange('all')}
            className="h-7 px-3 text-xs rounded-lg"
          >
            Todos
          </Button>
          <Button
            type="button"
            variant={selectedCategory === 'Processador' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onCategoryChange('Processador')}
            className="h-7 px-3 text-xs rounded-lg"
          >
            Processadores
          </Button>
          <Button
            type="button"
            variant={selectedCategory === 'SSD' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onCategoryChange('SSD')}
            className="h-7 px-3 text-xs rounded-lg"
          >
            SSDs
          </Button>
        </div>

        {/* Filtro por Selo / Oportunidade (h-9) */}
        <div className="w-44">
          <Select
            value={selectedDeal}
            onValueChange={(val) => onDealChange(val || 'all')}
          >
            <SelectTrigger className="h-9 w-full text-xs rounded-xl">
              <SelectValue>
                {DEAL_LABELS[selectedDeal] || 'Selos'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Selos</SelectItem>
              <SelectItem value="real">🟢 Selo Preço Real</SelectItem>
              <SelectItem value="target">🎯 Abaixo da Meta</SelectItem>
              <SelectItem value="warning">🔴 Alerta de Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ordenação (h-9) */}
        <div className="w-48">
          <Select
            value={sortOrder}
            onValueChange={(val) => onSortChange(val || 'default')}
          >
            <SelectTrigger className="h-9 w-full text-xs rounded-xl">
              <SelectValue>
                {SORT_LABELS[sortOrder] || 'Ordenar'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Ordenar: Padrão</SelectItem>
              <SelectItem value="price-asc">Menor Preço Atual</SelectItem>
              <SelectItem value="discount-desc">Maior Desconto %</SelectItem>
              <SelectItem value="name-asc">Nome (A - Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
