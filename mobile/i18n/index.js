import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

function resolve(dict, key, vars = {}) {
    const val = key.split('.').reduce((obj, k) => obj?.[k], dict);
    if (typeof val !== 'string') return key;
    return val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

export function I18nProvider({ children }) {
    const [locale, setLocaleState] = useState('pt');

    useEffect(() => {
        AsyncStorage.getItem('aura_locale').then((stored) => {
            if (stored && dictionaries[stored]) {
                setLocaleState(stored);
            }
        });
    }, []);

    const setLocale = useCallback((code) => {
        if (dictionaries[code]) {
            setLocaleState(code);
            AsyncStorage.setItem('aura_locale', code);
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

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
    return ctx;
}
