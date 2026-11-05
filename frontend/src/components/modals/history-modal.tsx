'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { historyService } from '@/services';
import { STORE_COLORS } from '@/lib/constants';
import { Trash2, RotateCcw, Zap, CreditCard } from 'lucide-react';
import type { ProductWithStats, ProductHistoryResponse, HistoryRecord } from '@/types';

// Chart.js imports & registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HistoryModalProps {
  product: ProductWithStats | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function HistoryModal({
  product,
  isOpen,
  onClose,
  onUpdated,
}: HistoryModalProps) {
  const [historyData, setHistoryData] = useState<ProductHistoryResponse | null>(null);
  const [priceMode, setPriceMode] = useState<'cash' | 'installment'>('cash');
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = async () => {
    if (!product) return;
    try {
      setIsLoading(true);
      const data = await historyService.getByProductId(product.id);
      setHistoryData(data);
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      loadHistory();
    }
  }, [isOpen, product]);

  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm('Deseja excluir esta leitura de preço?')) return;
    try {
      await historyService.deleteRecord(recordId);
      await loadHistory();
      onUpdated();
    } catch (err: any) {
      alert(`Erro ao remover leitura: ${err.message}`);
    }
  };

  const handleResetHistory = async () => {
    if (!product) return;
    if (!confirm('Deseja realmente limpar TODO o histórico deste produto?')) return;
    try {
      await historyService.resetProduct(product.id);
      await loadHistory();
      onUpdated();
    } catch (err: any) {
      alert(`Erro ao resetar histórico: ${err.message}`);
    }
  };

  // Construir dados do Chart.js
  const chartConfig = useMemo(() => {
    if (!historyData || historyData.records.length === 0) return null;

    // Obter datas únicas ordenadas
    const rawDates = Array.from(
      new Set(historyData.records.map((r) => r.scraped_at))
    ).sort();

    const formattedLabels = rawDates.map((d) => {
      const date = new Date(d);
      return isNaN(date.getTime())
        ? d
        : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    });

    const datasets = historyData.stores.map((store) => {
      const storeColor = STORE_COLORS[store]?.text.replace('text-[', '').replace(']', '') || '#3b82f6';

      const data = rawDates.map((dateStr) => {
        const record = historyData.records.find(
          (r) => r.scraped_at === dateStr && r.store_name === store
        );
        if (!record) return null;
        return priceMode === 'cash' ? record.price_cash : record.price_installment;
      });

      return {
        label: store,
        data,
        borderColor: storeColor,
        backgroundColor: storeColor,
        tension: 0.2,
        spanGaps: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    return {
      labels: formattedLabels,
      datasets,
    };
  }, [historyData, priceMode]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{product?.category}</Badge>
            {product?.is_real_discount && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                Preço Real
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold mt-1">{product?.name}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {product?.specs}
          </DialogDescription>
        </DialogHeader>

        {/* Controles do Gráfico (PIX vs Cartão) */}
        <div className="flex items-center justify-between gap-4 py-2 bg-muted/30 p-2.5 rounded-xl border border-border">
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-background border border-border text-xs">
            <Button
              size="sm"
              variant={priceMode === 'cash' ? 'default' : 'ghost'}
              onClick={() => setPriceMode('cash')}
              className="gap-1.5 h-7 text-xs"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>À Vista (PIX)</span>
            </Button>
            <Button
              size="sm"
              variant={priceMode === 'installment' ? 'default' : 'ghost'}
              onClick={() => setPriceMode('installment')}
              className="gap-1.5 h-7 text-xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>A Prazo (Cartão)</span>
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetHistory}
            className="text-xs text-rose-400 hover:text-rose-300 gap-1.5 h-7"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetar Histórico</span>
          </Button>
        </div>

        {/* Container do Gráfico */}
        <div className="w-full h-72 p-2 bg-background/50 rounded-xl border border-border flex items-center justify-center">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando série temporal...</p>
          ) : !chartConfig ? (
            <p className="text-xs text-muted-foreground">Nenhum registro de preço disponível para este produto.</p>
          ) : (
            <Line
              data={chartConfig}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' as const, labels: { boxWidth: 12, font: { size: 11 } } },
                  tooltip: {
                    callbacks: {
                      label: (context) => ` ${context.dataset.label}: R$ ${Number(context.raw).toFixed(2)}`,
                    },
                  },
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => `R$ ${value}`,
                      font: { size: 10 },
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                  },
                  x: {
                    ticks: { font: { size: 9 }, maxRotation: 45 },
                    grid: { display: false },
                  },
                },
              }}
            />
          )}
        </div>

        {/* Tabela de leituras gravadas */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-muted-foreground">
            Leituras Gravadas ({historyData?.records.length || 0})
          </span>
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {historyData?.records.map((record) => (
              <div
                key={record.id || `${record.scraped_at}-${record.store_name}`}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 border border-border"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{record.store_name}</span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {new Date(record.scraped_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-emerald-400 font-bold">
                    R$ {record.price_cash?.toFixed(2) || '--'}
                  </span>
                  {record.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRecord(record.id!)}
                      className="h-6 w-6 text-muted-foreground hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
