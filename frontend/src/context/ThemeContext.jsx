'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark');
  const setTheme = useCallback((value) => {
    const resolved = value === 'system' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : value;
    if (!['light', 'dark'].includes(resolved)) return;
    setThemeState(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('aura_theme', value);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('aura_theme');
    const accent = localStorage.getItem('aura_accent');
    if (/^#[0-9a-fA-F]{6}$/.test(accent || '')) document.documentElement.style.setProperty('--brand-primary', accent);
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      // Default to dark for Aura, but respect system if needed?
      // User said "fix dark/light perfectly", so let's start with dark.
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [setTheme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('aura_theme', next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
