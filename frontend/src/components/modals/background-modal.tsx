'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useBackground, BackgroundTheme } from '@/context/background-context';
import Balatro from '@/components/ui/Balatro';
import { Check } from 'lucide-react';

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ThemeOption {
  id: BackgroundTheme;
  title: string;
  description: string;
}

const THEMES: ThemeOption[] = [
  {
    id: 'balatro',
    title: 'Balatro Shader',
    description: 'Ondas dinâmicas em WebGL com interação ao cursor',
  },
  {
    id: 'none',
    title: 'Padrão / Sem Efeito',
    description: 'Fundo minimalista do tema original do sistema',
  },
];

export function BackgroundModal({ isOpen, onClose }: BackgroundModalProps) {
  const { background, setBackground } = useBackground();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Personalizar Fundo</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Escolha o estilo de background animado para o seu dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          {THEMES.map((theme) => {
            const isSelected = background === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setBackground(theme.id)}
                className={`group relative flex flex-col text-left rounded-xl border p-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
                    : 'border-border bg-muted/30 hover:border-border/80 hover:bg-muted/50'
                }`}
              >
                {/* Preview Thumbnail ocupando 100% do container */}
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border/60 bg-slate-950 flex items-center justify-center">
                  {theme.id === 'balatro' ? (
                    <div className="absolute inset-0 pointer-events-none w-full h-full">
                      <Balatro
                        color1="#DE443B"
                        color2="#006BB4"
                        color3="#162325"
                        speed={0.8}
                        mouseInteraction={false}
                        clickSwirl={false}
                        intro={false}
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground font-medium">Original</span>
                  )}

                  {/* Indicador de Seleção com z-index sobre o canvas */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Título e Descrição */}
                <div className="mt-2.5 px-0.5">
                  <span className="text-xs font-bold text-foreground block truncate">
                    {theme.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1 block mt-0.5">
                    {theme.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
