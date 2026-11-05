'use client';

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
  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card/60 p-4 rounded-2xl border border-border">
      {/* Busca por texto */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por processador, SSD, especificação..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 text-xs sm:text-sm"
        />
      </div>

      {/* Filtros e Ordenação */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Filtro de Categoria */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border text-xs">
          <Button
            type="button"
            variant={selectedCategory === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onCategoryChange('all')}
            className="h-7 px-3 text-xs"
          >
            Todos
          </Button>
          <Button
            type="button"
            variant={selectedCategory === 'Processador' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onCategoryChange('Processador')}
            className="h-7 px-3 text-xs"
          >
            Processadores
          </Button>
          <Button
            type="button"
            variant={selectedCategory === 'SSD' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onCategoryChange('SSD')}
            className="h-7 px-3 text-xs"
          >
            SSDs
          </Button>
        </div>

        {/* Filtro por Selo / Oportunidade */}
        <div className="w-36">
          <Select
            value={selectedDeal}
            onValueChange={(val) => onDealChange(val || 'all')}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Selos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Selos</SelectItem>
              <SelectItem value="real">🟢 Selo Preço Real</SelectItem>
              <SelectItem value="target">🎯 Abaixo da Meta</SelectItem>
              <SelectItem value="warning">🔴 Alerta de Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ordenação */}
        <div className="w-44">
          <Select
            value={sortOrder}
            onValueChange={(val) => onSortChange(val || 'default')}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Ordenar" />
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
