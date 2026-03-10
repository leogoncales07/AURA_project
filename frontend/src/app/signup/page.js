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
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginWrapper}>
                <div className={styles.logoArea}>
                    <AuraLogo size={96} style={{ marginBottom: '16px' }} />
                    <h2 className={styles.logoTitle}>AURA</h2>
                    <p>{t('signup.subtitle') || 'Begin your journey.'}</p>
                </div>

                <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                    <LanguageSwitcher />
                </div>

                <div className={styles.loginForm}>
                    <form className={styles.form} onSubmit={handleSignUp}>
                        <div className={styles.inputGroup}>
                            <div className={styles.inputStack}>
                                <input
                                    type="text"
                                    id="name"
                                    placeholder={t('signup.namePlaceholder') || 'Full Name'}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={styles.inputTop}
                                    required
                                />
                                <input
                                    type="email"
                                    id="email"
                                    placeholder={t('signup.emailPlaceholder') || 'Email'}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={styles.inputMiddle}
                                    required
                                />
                                <input
                                    type="password"
                                    id="password"
                                    placeholder={t('signup.passwordPlaceholder') || 'Password'}
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
                            {loading ? (t('signup.loading') || 'Creating...') : (t('signup.submit') || 'Create Account')}
                        </Button>
                    </form>

                    <p className={styles.signupText}>
                        {(t('signup.hasAccount') || 'Already have an account?')} <Link href="/login" className={styles.signupLink}>{(t('signup.signIn') || 'Sign In')}</Link>
                    </p>
                </div>

            </div>
        </div>
    );
}
