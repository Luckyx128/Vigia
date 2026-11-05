import { ShieldCheck } from 'lucide-react';

export function BlackFridayLegend() {
  return (
    <section className="bg-card/40 rounded-2xl p-6 border border-border">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        Como Funciona o Selo Black Friday Real do Vigia
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-muted/40 border border-emerald-500/20 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            Selo Verde: Preço Real
          </div>
          <p className="text-muted-foreground leading-relaxed">
            O valor atual está no patamar mais baixo dos últimos 30-90 dias ou rompeu a meta estipulada. Promoção genuína sem maquiagem.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/40 border border-amber-500/20 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Selo Amarelo: Preço Normal
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Preço dentro da média usual de mercado. Vale acompanhar as próximas varreduras antes de fechar a compra.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/40 border border-rose-500/20 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Selo Vermelho: Alerta de Alta
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Preço sofreu aumento recente que pode forjar desconto artificial na Black Friday (&quot;metade do dobro&quot;).
          </p>
        </div>
      </div>
    </section>
  );
}
