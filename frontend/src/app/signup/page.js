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

export default function SignUpPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { t } = useI18n();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: apiError } = await api.signup(email, password, name);

            if (apiError) {
                setError(apiError);
                setLoading(false);
                return;
            }

            if (data && data.access_token) {
                localStorage.setItem('aura_token', data.access_token);
                localStorage.setItem('aura_user', JSON.stringify(data.user));
                router.push('/dashboard');
            } else {
                setError(t('login.serverError') || 'Unexpected server error.');
                setLoading(false);
            }
        } catch (err) {
            console.error("[Signup] Exception:", err);
            setError(`Connection error: ${err.message}. Check if backend is running.`);
            setLoading(false);
        }
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
                    <h2 className={styles.logoTitle}>{t('signup.title') || 'Create Account'}</h2>
                    <p>{t('signup.subtitle') || 'Begin your wellness journey.'}</p>
                </div>

                <div className={styles.loginForm}>
                    <form className={styles.form} onSubmit={handleSignUp}>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                id="name"
                                placeholder={t('signup.namePlaceholder') || 'Full Name'}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={styles.inputField}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <input
                                type="email"
                                id="email"
                                placeholder={t('signup.emailPlaceholder') || 'Email'}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.inputField}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <input
                                type="password"
                                id="password"
                                placeholder={t('signup.passwordPlaceholder') || 'Password (min 6 characters)'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.inputField}
                                required
                                minLength={6}
                            />
                        </div>

                        {error && <div className={styles.errorMsg}>{error}</div>}

                        <Button
                            variant="primary"
                            className={styles.submitBtn}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (t('signup.loading') || 'Creating...') : (t('signup.submit') || 'Create Account')}
                        </Button>
                    </form>
                </div>

                <p className={styles.signupText}>
                    {(t('signup.hasAccount') || 'Already have an account?')} <Link href="/login" className={styles.signupLink}>{(t('signup.signIn') || 'Sign In')}</Link>
                </p>
            </div>
        </div>
    );
}
