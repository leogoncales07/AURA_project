// ─── Theme System ────────────────────────────────────────────────────────────
// Light tokens are mapped 1-to-1 from frontend/src/app/globals.css :root
// Dark  tokens are mapped 1-to-1 from frontend/src/app/globals.css [data-theme="dark"]

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Colors = {
    light: {
        // Backgrounds — page is light gray, cards float as pure white
        bg:         '#f5f5f7',
        surface:    '#ffffff',
        surfaceAlt: '#f0f0f5',
        card:       '#ffffff',

        // Text
        textPrimary:   '#1d1d1f',
        textSecondary: '#3a3a3c',
        textTertiary:  '#6e6e73',
        textGhost:     '#aeaeb2',

        // Borders — visible enough to separate cards from bg
        border:  'rgba(0, 0, 0, 0.13)',
        divider: 'rgba(0, 0, 0, 0.09)',

        // Brand
        primary:    '#10b981',
        primaryDim: 'rgba(16, 185, 129, 0.10)',
        secondary:  '#06b6d4',

        // Accents
        accentMint:  '#30D158',
        accentBlue:  '#4FC3F7',
        accentPink:  '#FF6B9D',
        accentAmber: '#FFB340',

        // Tab bar
        tabBar:    '#ffffff',
        tabBorder: 'rgba(0, 0, 0, 0.12)',

        // Input / pill
        inputBg: '#ebebed',
    },

    dark: {
        // Backgrounds
        bg:         '#020617',
        surface:    'rgba(15, 23, 42, 0.85)',
        surfaceAlt: 'rgba(2, 6, 23, 0.95)',
        card:       'rgba(30, 41, 59, 0.72)',

        // Text
        textPrimary:   '#f8fafc',
        textSecondary: 'rgba(248, 250, 252, 0.92)',
        textTertiary:  'rgba(148, 163, 184, 0.65)',
        textGhost:     'rgba(248, 250, 252, 0.55)',

        // Borders
        border:  'rgba(255, 255, 255, 0.18)',
        divider: 'rgba(255, 255, 255, 0.12)',

        // Brand
        primary:    '#10b981',
        primaryDim: 'rgba(16, 185, 129, 0.12)',
        secondary:  '#06b6d4',

        // Accents
        accentMint:  '#30D158',
        accentBlue:  '#4FC3F7',
        accentPink:  '#FF6B9D',
        accentAmber: '#FFB340',

        // Tab bar
        tabBar:    '#020617',
        tabBorder: 'rgba(255,255,255,0.18)',

        // Input / pill
        inputBg: 'rgba(255, 255, 255, 0.05)',
    },
};

// Legacy export — defaults to dark (keeps existing screens unchanged until
// they opt into useTheme)
export const COLORS = Colors.dark;

// ─── Fonts ───────────────────────────────────────────────────────────────────
export const Fonts = {
    regular:  { fontFamily: 'System', fontWeight: '400' },
    medium:   { fontFamily: 'System', fontWeight: '500' },
    semibold: { fontFamily: 'System', fontWeight: '600' },
    bold:     { fontFamily: 'System', fontWeight: '700' },
    heavy:    { fontFamily: 'System', fontWeight: '800' },
    serif:    { fontFamily: 'System', fontWeight: '400' },
};

// ─── Spacing / Radius ────────────────────────────────────────────────────────
export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const Radius  = { sm: 8, md: 12, lg: 20, xl: 28, full: 9999 };

// ─── ThemeContext ─────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState('dark');

    useEffect(() => {
        AsyncStorage.getItem('aura_theme').then((saved) => {
            if (saved === 'light' || saved === 'dark') {
                setThemeState(saved);
            }
        });
    }, []);

    const setTheme = useCallback((next) => {
        if (next !== 'light' && next !== 'dark') return;
        setThemeState(next);
        AsyncStorage.setItem('aura_theme', next);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            AsyncStorage.setItem('aura_theme', next);
            return next;
        });
    }, []);

    const colors = Colors[theme];

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) return { theme: 'dark', colors: Colors.dark, toggleTheme: () => {}, setTheme: () => {} };
    return ctx;
}
