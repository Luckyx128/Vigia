'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { productService } from '@/services';
import type { ProductCreate } from '@/types';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewProductModal({ isOpen, onClose, onSuccess }: NewProductModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Processador');
  const [targetPrice, setTargetPrice] = useState('');
  const [specs, setSpecs] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const payload: ProductCreate = {
        name: name.trim(),
        category,
        specs: specs.trim() || undefined,
        target_price: targetPrice ? parseFloat(targetPrice) : undefined,
      };

      await productService.create(payload);
      onSuccess();
      onClose();
      // Reset form
      setName('');
      setCategory('Processador');
      setTargetPrice('');
      setSpecs('');
    } catch (err: any) {
      alert(`Erro ao cadastrar produto: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Cadastrar Novo Produto</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Adicione um produto para monitorar preços e receber alertas na Black Friday.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Nome do Produto *</label>
            <Input
              required
              placeholder="Ex: AMD Ryzen 7 5700X3D"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Categoria *</label>
              <Select value={category} onValueChange={(val) => setCategory(val || 'Processador')}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Processador">Processador</SelectItem>
                  <SelectItem value="SSD">SSD / NVMe</SelectItem>
                  <SelectItem value="Placa de Vídeo">Placa de Vídeo</SelectItem>
                  <SelectItem value="Memória RAM">Memória RAM</SelectItem>
                  <SelectItem value="Placa-Mãe">Placa-Mãe</SelectItem>
                  <SelectItem value="Fonte">Fonte</SelectItem>
                  <SelectItem value="Monitor">Monitor</SelectItem>
                  <SelectItem value="Outro">Outro Hardware</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Preço Alvo (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="1"
                placeholder="Ex: 1350.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Especificações Técnicas</label>
            <Input
              placeholder="Ex: 32MB Cache L3, 6C/12T, AM4"
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
