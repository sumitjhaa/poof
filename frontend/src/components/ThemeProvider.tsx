'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = string;

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: 'catppuccin-dark', setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export const THEMES = [
  { id: 'catppuccin-dark', label: 'Catppuccin Dark' },
  { id: 'catppuccin-light', label: 'Catppuccin Light' },
  { id: 'rosepine-dark', label: 'Rose Pine Dark' },
  { id: 'rosepine-light', label: 'Rose Pine Light' },
  { id: 'tokyo-dark', label: 'Tokyo Night Dark' },
  { id: 'tokyo-light', label: 'Tokyo Night Light' },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('catppuccin-dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('poof-theme');
    if (saved) setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('poof-theme', theme);
    }
  }, [theme, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
