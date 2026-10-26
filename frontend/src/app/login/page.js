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
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMsg, setForgotMsg] = useState('');
    const [forgotErr, setForgotErr] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const router = useRouter();
    const { t } = useI18n();
    const { login } = useAuth();

    const handleForgotPassword = async () => {
        setForgotErr('');
        setForgotMsg('');
        setForgotLoading(true);
        try {
            const res = await api.forgotPassword(forgotEmail);
            if (res.error) {
                setForgotErr(res.error);
            } else {
                setForgotMsg('Link de recuperação enviado com sucesso para o teu email!');
            }
        } catch (e) {
            setForgotErr('Erro ao solicitar recuperação. Tente novamente.');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await login(email, password, rememberMe);

            if (res.error) {
                setError(res.error === 'Invalid login credentials' ? t('login.invalidCredentials') : res.error);
                setLoading(false);
                return;
            }
        } catch (err) {
            console.error("[Login] Exception:", err);
            setError(`Connection error: ${err.message}. Check if the backend server is running.`);
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
                            <button
                                type="button"
                                className={styles.forgotPassword}
                                onClick={() => {
                                    setShowForgot(true);
                                    setForgotEmail(email);
                                    setForgotMsg('');
                                    setForgotErr('');
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                {t('login.forgotPassword')}
                            </button>
                        </div>
                    </form>
                </div>

                {showForgot && (
                    <div style={{
                        marginTop: '20px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'var(--aura-surface, rgba(255,255,255,0.05))',
                        border: '1px solid var(--border-primary, rgba(255,255,255,0.1))',
                        textAlign: 'left'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{t('login.forgotPassword')}</span>
                            <button
                                type="button"
                                onClick={() => setShowForgot(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', fontSize: '14px' }}
                            >
                                ✕
                            </button>
                        </div>
                        <input
                            type="email"
                            placeholder={t('login.emailPlaceholder')}
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className={styles.inputField}
                            style={{ marginBottom: '10px' }}
                        />
                        {forgotMsg && <div style={{ color: '#10b981', fontSize: '13px', marginBottom: '10px' }}>{forgotMsg}</div>}
                        {forgotErr && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '10px' }}>{forgotErr}</div>}
                        <Button
                            variant="primary"
                            type="button"
                            disabled={forgotLoading || !forgotEmail}
                            onClick={handleForgotPassword}
                            style={{ width: '100%', height: '36px', fontSize: '13px' }}
                        >
                            {forgotLoading ? t('login.loading') : (t('common.send') || 'Enviar link de recuperação')}
                        </Button>
                    </div>
                )}

                <p className={styles.signupText}>
                    {t('login.noAccount')} <Link href="/signup" className={styles.signupLink}>{t('login.createAccount')}</Link>
                </p>
            </div>
        </div>
    );
}
