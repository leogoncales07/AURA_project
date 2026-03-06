'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

import pt from './pt.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import de from './de.json';

const dictionaries = { pt, en, es, fr, de };

export const SUPPORTED_LOCALES = [
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

const I18nContext = createContext(null);

/**
 * Resolve a nested key like "dashboard.greeting" from a dictionary object.
 * Supports {placeholder} interpolation.
 */
function resolve(dict, key, vars = {}) {
    const val = key.split('.').reduce((obj, k) => obj?.[k], dict);
    if (typeof val !== 'string') return key; // fallback to key if missing
    // Replace {name}, {hours}, etc.
    return val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

export function I18nProvider({ children }) {
    const [locale, setLocaleState] = useState('pt');

    // Hydrate from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('aura_locale');
        if (stored && dictionaries[stored]) {
            setLocaleState(stored);
        }
    }, []);

    const setLocale = useCallback((code) => {
        if (dictionaries[code]) {
            setLocaleState(code);
            localStorage.setItem('aura_locale', code);
            document.documentElement.lang = code;
        }
    }, []);

    const t = useCallback(
        (key, vars) => resolve(dictionaries[locale], key, vars),
        [locale]
    );

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

/**
 * Hook: const { t, locale, setLocale } = useI18n();
 *   t('dashboard.greeting', { name: 'João' }) → "Olá, João."
 */
export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
    return ctx;
}
