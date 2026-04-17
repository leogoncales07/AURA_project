'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuraLogo from '@/components/AuraLogo';
import styles from './page.module.css';
import Button from '@/components/Button';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();
    const { t } = useI18n();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: apiError } = await api.login(email, password);

            if (apiError) {
                setError(apiError === 'Invalid login credentials' ? t('login.invalidCredentials') : apiError);
                setLoading(false);
                return;
            }

            if (data && data.access_token) {
                if (rememberMe) {
                    localStorage.setItem('aura_token', data.access_token);
                    localStorage.setItem('aura_user', JSON.stringify(data.user));
                    sessionStorage.removeItem('aura_token');
                    sessionStorage.removeItem('aura_user');
                } else {
                    sessionStorage.setItem('aura_token', data.access_token);
                    sessionStorage.setItem('aura_user', JSON.stringify(data.user));
                    localStorage.removeItem('aura_token');
                    localStorage.removeItem('aura_user');
                }
                router.push('/dashboard');
            } else {
                setError(t('login.serverError'));
                setLoading(false);
            }
        } catch (err) {
            console.error("[Login] Exception:", err);
            setError(`Connection error: ${err.message}. Check if the backend server and API URL configuration.`);
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setLoading(true);
        setError('');
        
        console.log("Loading presentation demo user...");
        const mockToken = "presentation-demo-token";
        const mockUser = {
            id: "demo-presenter-123",
            email: "demo@aura.com",
            name: "Demo User",
            display_name: "Aura Demo"
        };
        
        // Ensure data is saved before moving
        localStorage.setItem('aura_token', mockToken);
        localStorage.setItem('aura_user', JSON.stringify(mockUser));
        
        // Use hard navigation as a failsafe
        window.location.href = '/dashboard';
    };

    return (
        <div className={styles.container}>
            <div className={`${styles.loginWrapper} fade-up-stagger`}>
                <div style={{ position: 'fixed', top: '32px', right: '40px', display: 'flex', gap: '20px', zIndex: 100 }}>
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>

                <div className={styles.logoArea}>
                    <AuraLogo size={64} style={{ marginBottom: '24px' }} />
                    <h2 className={styles.logoTitle}>{t('login.title')}</h2>
                    <p>{t('login.subtitle')}</p>
                </div>

                <div className={styles.loginForm}>
                    <form className={styles.form} onSubmit={handleLogin}>
                        <div className={styles.inputGroup}>
                            <input
                                type="email"
                                placeholder={t('login.emailPlaceholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.inputField}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <input
                                type="password"
                                placeholder={t('login.passwordPlaceholder')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.inputField}
                                required
                            />
                        </div>

                        {error && <div className={styles.errorMsg}>{error}</div>}

                        <div className={styles.rememberMeWrapper} style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '8px' }}>
                            <input 
                                type="checkbox" 
                                id="rememberMe" 
                                checked={rememberMe} 
                                onChange={(e) => setRememberMe(e.target.checked)} 
                                style={{ accentColor: 'var(--aura-primary)', width: '16px', height: '16px' }}
                            />
                            <label htmlFor="rememberMe" style={{ fontSize: '14px', color: 'var(--aura-text-secondary)', cursor: 'pointer' }}>
                                {t('login.rememberMe') || 'Remember me'}
                            </label>
                        </div>

                        <Button
                            variant="primary"
                            className={styles.submitBtn}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? t('login.loading') : t('login.submit')}
                        </Button>

                        <button
                            type="button"
                            className={styles.demoBtn}
                            onClick={handleDemoLogin}
                            disabled={loading}
                        >
                            {t('login.demoButton')}
                        </button>

                        <div className={styles.forgotPasswordWrapper}>
                            <Link href="#" className={styles.forgotPassword}>{t('login.forgotPassword')}</Link>
                        </div>
                    </form>
                </div>

                <p className={styles.signupText}>
                    {t('login.noAccount')} <Link href="/signup" className={styles.signupLink}>{t('login.createAccount')}</Link>
                </p>
            </div>
        </div>
    );
}
