'use client';
import { Globe } from 'lucide-react';

import { useState, useRef, useEffect } from 'react';
import { useI18n, SUPPORTED_LOCALES } from '@/i18n';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher() {
    const { locale, setLocale } = useI18n();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const current = SUPPORTED_LOCALES.find((l) => l.code === locale);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className={styles.wrapper} ref={ref}>
            <button
                className={styles.trigger}
                onClick={() => setOpen((v) => !v)}
                aria-label="Change language"
                title="Change language"
            >
                <Globe size={18} strokeWidth={2} />
                <span className={styles.code}>{current?.flag}</span>
            </button>

            {open && (
                <ul className={styles.dropdown}>
                    {SUPPORTED_LOCALES.map((l) => (
                        <li key={l.code}>
                            <button
                                className={`${styles.option} ${l.code === locale ? styles.active : ''}`}
                                onClick={() => {
                                    setLocale(l.code);
                                    setOpen(false);
                                }}
                            >
                                <span className={styles.flag}>{l.flag}</span>
                                <span className={styles.label}>{l.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
