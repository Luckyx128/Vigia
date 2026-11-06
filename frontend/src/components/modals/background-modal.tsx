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
import SideRays from '@/components/ui/SideRays';
import Radar from '@/components/ui/Radar';
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
    id: 'siderays',
    title: 'Side Rays',
    description: 'Feixes de luz volumétricos e partículas brilhantes',
  },
  {
    id: 'radar',
    title: 'Radar Monitor',
    description: 'Varredura de radar militar tático com contatos ativos',
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
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Personalizar Fundo</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Escolha o estilo de background animado para o seu dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
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
                  ) : theme.id === 'siderays' ? (
                    <div className="absolute inset-0 pointer-events-none w-full h-full">
                      <SideRays
                        rayColor1="#FFC46B"
                        rayColor2="#96c8ff"
                        origin="top-right"
                        speed={1.5}
                        intensity={1.8}
                        spread={2}
                        density={4}
                        followMouse={false}
                        blend={0.6}
                        sharpness={0.5}
                        tilt={0}
                        falloff={1.6}
                        glow={1}
                        saturation={1}
                        dust={0}
                        intro={false}
                        lightMode={false}
                        opacity={1}
                        className="w-full h-full"
                      />
                    </div>
                  ) : theme.id === 'radar' ? (
                    <div className="absolute inset-0 pointer-events-none w-full h-full">
                      <Radar
                        color="#3ef09a"
                        mode="sweep"
                        speed={1.2}
                        trail={0.4}
                        scale={0.85}
                        ringCount={4}
                        spokeCount={8}
                        targets={4}
                        clutter={0.2}
                        mouseInteraction={false}
                        ticks={false}
                        glow={1}
                        tilt={0}
                        centerX={0.5}
                        centerY={0.5}
                        brightness={1}
                        gridOpacity={0.8}
                        lineWidth={1}
                        grain={0}
                        fade={0}
                        opacity={1}
                        intro={false}
                        lightMode={false}
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
