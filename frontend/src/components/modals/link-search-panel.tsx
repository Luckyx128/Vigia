'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, ExternalLink, Loader2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchService, storeLinkService } from '@/services';
import type { SearchCandidate } from '@/types';

const STORE = 'Kabum';
// Abaixo disso, avisamos que nenhum anúncio parece ser o produto pedido
const GOOD_MATCH = 70;

function formatBRL(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function scoreStyle(score: number) {
  if (score >= 90) return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
  if (score >= 60) return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
  return 'bg-muted text-muted-foreground border-border';
}

interface LinkSearchPanelProps {
  productId: number;
  initialQuery: string;
  /** Chamado depois que um link é adicionado, para recarregar a lista de lojas */
  onAdded: () => void | Promise<void>;
}

export function LinkSearchPanel({ productId, initialQuery, onAdded }: LinkSearchPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchCandidate[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingUrl, setAddingUrl] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    try {
      setIsSearching(true);
      setError(null);
      const res = await searchService.search(q, STORE, productId);
      setResults(res.results);
    } catch (err) {
      setResults(null);
      setError(errorMessage(err));
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (candidate: SearchCandidate) => {
    try {
      setAddingUrl(candidate.url);
      await storeLinkService.add(productId, {
        store_name: candidate.store_name,
        url: candidate.url,
      });
      setResults((prev) =>
        prev?.map((r) => (r.url === candidate.url ? { ...r, already_added: true } : r)) ?? null
      );
      toast.success(`Link da ${candidate.store_name} adicionado ao monitoramento`);
      await onAdded();
    } catch (err) {
      toast.error(`Erro ao adicionar link: ${errorMessage(err)}`);
    } finally {
      setAddingUrl(null);
    }
  };

  const bestScore = results?.length ? Math.max(...results.map((r) => r.score)) : 0;

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: RX 7600 8GB"
          className="text-xs h-9"
          minLength={2}
          required
        />
        <Button type="submit" size="sm" disabled={isSearching} className="gap-1.5 text-xs h-9 shrink-0">
          {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Buscar na {STORE}</span>
        </Button>
      </form>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {results && results.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Nenhum anúncio encontrado. Tente outros termos.
        </p>
      )}

      {results && results.length > 0 && bestScore < GOOD_MATCH && (
        <p className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          Nenhum anúncio bate exatamente com a busca. Talvez a {STORE} não venda esse modelo agora — confira
          antes de adicionar ou tente outros termos.
        </p>
      )}

      {results && results.length > 0 && (
        <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {results.map((r) => (
            <li
              key={r.url}
              className="flex flex-col sm:flex-row gap-3 p-2.5 rounded-lg border border-border bg-card/60"
            >
              <div className="flex gap-3 min-w-0 flex-1">
                {r.image ? (
                  // Imagem externa da loja; next/image exigiria liberar o domínio na config
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.image}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 shrink-0 rounded-md bg-white object-contain p-1"
                  />
                ) : (
                  <div className="w-14 h-14 shrink-0 rounded-md bg-muted" />
                )}

                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium text-foreground line-clamp-2" title={r.title}>
                    {r.title}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${scoreStyle(r.score)}`}>
                      {r.score}% parecido
                    </span>
                    {r.differences.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400 border-rose-500/30"
                      >
                        {d}
                      </span>
                    ))}
                    {r.offer_name && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-[#FF6500]/15 text-[#FF6500] border-[#FF6500]/30">
                        {r.offer_name}
                      </span>
                    )}
                    {!r.in_stock && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-muted text-muted-foreground border-border">
                        Esgotado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {r.is_marketplace ? `Vendido por parceiro: ${r.seller ?? '—'}` : `Vendido pela ${r.store_name}`}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    {formatBRL(r.price_cash)} <span className="text-[10px] font-normal text-muted-foreground">PIX</span>
                  </p>
                  {r.installments_text && (
                    <p className="text-[10px] text-muted-foreground">{r.installments_text}</p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir na loja"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <Button
                    type="button"
                    size="sm"
                    variant={r.already_added ? 'outline' : 'default'}
                    disabled={r.already_added || addingUrl !== null}
                    onClick={() => handleAdd(r)}
                    className="gap-1 text-xs h-7"
                  >
                    {r.already_added ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Adicionado</span>
                      </>
                    ) : addingUrl === r.url ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
