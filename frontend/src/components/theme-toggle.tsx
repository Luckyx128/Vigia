'use client';

import * as React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-8 w-8 text-xs" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      title={`Tema atual: ${theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Escuro' : 'Claro'} (Clique para alternar)`}
      className="h-8 w-8 text-xs text-muted-foreground hover:text-foreground"
    >
      {theme === 'dark' ? (
        <Moon className="h-4 w-4 text-cyan-400" />
      ) : theme === 'light' ? (
        <Sun className="h-4 w-4 text-amber-500" />
      ) : (
        <Laptop className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}
