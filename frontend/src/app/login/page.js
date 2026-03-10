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

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { t } = useI18n();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { data, error: apiError } = await api.login(email, password);

        if (apiError) {
            setError(apiError === 'Invalid login credentials' ? t('login.invalidCredentials') : apiError);
            setLoading(false);
            return;
        }

        if (data && data.access_token) {
            localStorage.setItem('aura_token', data.access_token);
            localStorage.setItem('aura_user', JSON.stringify(data.user));
            router.push('/dashboard');
        } else {
            setError(t('login.serverError'));
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginWrapper}>
                <div className={styles.logoArea}>
                    <AuraLogo size={96} style={{ marginBottom: '16px' }} />
                    <h2 className={styles.logoTitle}>AURA</h2>
                    <p>{t('login.subtitle')}</p>
                </div>

                <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                    <LanguageSwitcher />
                </div>

                <div className={styles.loginForm}>
                    <form className={styles.form} onSubmit={handleLogin}>
                        <div className={styles.inputGroup}>
                            <div className={styles.inputStack}>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder={t('login.emailPlaceholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={styles.inputTop}
                                    required
                                />
                                <input
                                    type="password"
                                    id="password"
                                    placeholder={t('login.passwordPlaceholder')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={styles.inputBottom}
                                    required
                                />
                            </div>
                        </div>

                        {error && <div className={styles.errorMsg} style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

                        <Button
                            variant="primary"
                            size="lg"
                            className={styles.submitBtn}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? t('login.loading') : t('login.submit')}
                        </Button>

                        <div style={{ marginTop: '16px', textAlign: 'center' }}>
                            <Button
                                variant="outline"
                                size="md"
                                style={{
                                    width: '100%',
                                    borderColor: 'var(--accent-primary)',
                                    color: 'var(--accent-primary)',
                                    fontWeight: '600'
                                }}
                                type="button"
                                onClick={async () => {
                                    setLoading(true);
                                    setError('');
                                    const { data, error: apiError } = await api.login('demo@aura.com', 'demo123456');
                                    if (data && data.access_token) {
                                        localStorage.setItem('aura_token', data.access_token);
                                        localStorage.setItem('aura_user', JSON.stringify(data.user));
                                        router.push('/dashboard');
                                    } else {
                                        setError(t('login.demoFailed'));
                                        setLoading(false);
                                    }
                                }}
                            >
                                {t('login.demoButton')}
                            </Button>
                        </div>


                        <div className={styles.forgotPasswordWrapper}>
                            <Link href="#" className={styles.forgotPassword}>{t('login.forgotPassword')}</Link>
                        </div>
                    </form>

                    <p className={styles.signupText}>
                        {t('login.noAccount')} <Link href="#" className={styles.signupLink}>{t('login.createAccount')}</Link>
                    </p>
                </div>

            </div>
        </div>
    );
}
