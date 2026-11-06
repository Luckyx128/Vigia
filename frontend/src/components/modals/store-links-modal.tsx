'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { storeLinkService, productService } from '@/services';
import { getStoreStyle } from '@/lib/constants';
import { Trash2, Plus, ExternalLink, Search, Link2 } from 'lucide-react';
import { LinkSearchPanel } from './link-search-panel';
import type { ProductWithStats, ProductDetailResponse } from '@/types';

interface StoreLinksModalProps {
  product: ProductWithStats | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function StoreLinksModal({
  product,
  isOpen,
  onClose,
  onUpdated,
}: StoreLinksModalProps) {
  const [details, setDetails] = useState<ProductDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [storeName, setStoreName] = useState('Kabum');
  const [url, setUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadDetails = async () => {
    if (!product) return;
    try {
      setIsLoading(true);
      const data = await productService.getById(product.id);
      setDetails(data);
    } catch (err: any) {
      alert(`Erro ao carregar links: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      loadDetails();
    }
  }, [isOpen, product]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !url.trim()) return;

    try {
      setIsAdding(true);
      await storeLinkService.add(product.id, {
        store_name: storeName,
        url: url.trim(),
      });
      setUrl('');
      await loadDetails();
      onUpdated();
    } catch (err: any) {
      alert(`Erro ao adicionar link: ${err.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    if (!confirm('Deseja realmente remover este link de monitoramento?')) return;
    try {
      await storeLinkService.delete(linkId);
      await loadDetails();
      onUpdated();
    } catch (err: any) {
      alert(`Erro ao remover link: ${err.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Gerenciar Lojas — {product?.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cadastre ou remova links de lojas monitoradas para este produto.
          </DialogDescription>
        </DialogHeader>

        {/* Adicionar link: busca na loja ou URL colada */}
        <Tabs defaultValue="search" className="p-3 rounded-xl bg-muted/40 border border-border">
          <TabsList className="h-8">
            <TabsTrigger value="search" className="text-xs gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Buscar na Kabum
            </TabsTrigger>
            <TabsTrigger value="paste" className="text-xs gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              Colar link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            {product && (
              <LinkSearchPanel
                key={product.id}
                productId={product.id}
                initialQuery={product.name}
                onAdded={async () => {
                  await loadDetails();
                  onUpdated();
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="paste">
            <form onSubmit={handleAddLink} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Select value={storeName} onValueChange={(val) => setStoreName(val || 'Kabum')}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kabum">Kabum</SelectItem>
                    <SelectItem value="Terabyte">Terabyte</SelectItem>
                    <SelectItem value="Pichau">Pichau</SelectItem>
                    <SelectItem value="Amazon">Amazon</SelectItem>
                    <SelectItem value="Mercado Livre">Mercado Livre</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  required
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="sm:col-span-2 text-xs h-9"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={isAdding} className="gap-1.5 text-xs h-8">
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAdding ? 'Adicionando...' : 'Adicionar Loja'}</span>
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        {/* Lista de links cadastrados */}
        <div className="space-y-2 py-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Lojas Ativas</span>
            <span>{details?.links.length || 0} links</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {isLoading ? (
              <p className="text-xs text-muted-foreground text-center py-4">Carregando links...</p>
            ) : details?.links.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum link cadastrado ainda.</p>
            ) : (
              details?.links.map((link) => {
                const style = getStoreStyle(link.store_name);
                return (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-card/60"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border shrink-0 ${style.bg} ${style.text} ${style.border}`}
                      >
                        {link.store_name}
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground truncate flex items-center gap-1"
                      >
                        <span className="truncate max-w-[280px]">{link.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLink(link.id)}
                      className="h-7 w-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
