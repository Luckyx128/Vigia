export const STORE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Kabum: {
    bg: 'bg-[#FF6500]/15',
    text: 'text-[#FF6500]',
    border: 'border-[#FF6500]/30',
  },
  Terabyte: {
    bg: 'bg-[#0084FF]/15',
    text: 'text-[#0084FF]',
    border: 'border-[#0084FF]/30',
  },
  Pichau: {
    bg: 'bg-[#E30613]/15',
    text: 'text-[#E30613]',
    border: 'border-[#E30613]/30',
  },
  Amazon: {
    bg: 'bg-[#FF9900]/15',
    text: 'text-[#FF9900]',
    border: 'border-[#FF9900]/30',
  },
  'Mercado Livre': {
    bg: 'bg-[#FFE600]/15',
    text: 'text-[#E5C800]',
    border: 'border-[#FFE600]/30',
  },
};

export function getStoreStyle(storeName?: string | null) {
  if (!storeName || !STORE_COLORS[storeName]) {
    return {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      border: 'border-border',
    };
  }
  return STORE_COLORS[storeName];
}
