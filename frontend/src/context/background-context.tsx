'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type BackgroundTheme = 'balatro' | 'none';

interface BackgroundContextType {
  background: BackgroundTheme;
  setBackground: (bg: BackgroundTheme) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [background, setBackgroundState] = useState<BackgroundTheme>('balatro');

  useEffect(() => {
    const saved = localStorage.getItem('vigia-background-theme') as BackgroundTheme | null;
    if (saved) {
      setBackgroundState(saved);
    }
  }, []);

  const setBackground = (bg: BackgroundTheme) => {
    setBackgroundState(bg);
    localStorage.setItem('vigia-background-theme', bg);
  };

  return (
    <BackgroundContext.Provider value={{ background, setBackground }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}
