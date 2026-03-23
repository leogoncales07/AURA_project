'use client';

import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useI18n } from '@/i18n';
import { useTheme } from '@/context/ThemeContext';
import { Bell, User, Sun, Moon } from 'lucide-react';

export default function Header({ title, scrolled }) {
    const router = useRouter();
    const { t } = useI18n();
    const { theme, toggleTheme } = useTheme();

    return (
        <header style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 40px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: scrolled ? 'var(--bg-scrolled)' : 'transparent',
            backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
            borderBottom: scrolled ? '1px solid var(--border-primary)' : '1px solid transparent',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            maxWidth: '1000px',
            width: '100%',
            margin: '0 auto',
        }}>
            <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <h1 style={{
                    fontFamily: 'var(--aura-font-sans)',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--fg-foreground)',
                    opacity: 0.9,
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                    margin: 0,
                }}>
                    {title}
                </h1>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}>
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--fg-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                            borderRadius: '50%',
                            transition: 'all 0.2s var(--ease-out-expo)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-foreground)'; e.currentTarget.style.background = 'var(--bg-pill)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-muted)'; e.currentTarget.style.background = 'transparent'; }}
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
                    </button>

                    <button
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--fg-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-foreground)'; e.currentTarget.style.background = 'var(--bg-pill)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-muted)'; e.currentTarget.style.background = 'transparent'; }}
                        aria-label="Notifications"
                    >
                        <Bell size={18} strokeWidth={1.5} />
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '4px',
                            height: '4px',
                            background: 'var(--brand-primary)',
                            borderRadius: '50%',
                            boxShadow: '0 0 6px var(--brand-primary)',
                        }} />
                    </button>

                    <div style={{ margin: '0 4px' }}>
                        <LanguageSwitcher />
                    </div>

                    <button
                        onClick={() => router.push('/settings')}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--bg-pill)',
                            border: '1px solid var(--border-pill)',
                            color: 'var(--fg-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            marginLeft: '6px',
                            padding: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.color = 'var(--fg-foreground)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-pill)'; e.currentTarget.style.color = 'var(--fg-muted)'; }}
                        aria-label="Profile"
                    >
                        <User size={15} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </header>
    );
}
