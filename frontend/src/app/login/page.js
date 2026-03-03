'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Button from '@/components/Button';
import { api } from '@/lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { data, error: apiError } = await api.login(email, password);

        if (apiError) {
            setError(apiError === 'Invalid login credentials' ? 'Credenciais inválidas. Tente novamente.' : apiError);
            setLoading(false);
            return;
        }

        if (data && data.access_token) {
            // Store token and user data
            localStorage.setItem('aura_token', data.access_token);
            localStorage.setItem('aura_user', JSON.stringify(data.user));
            router.push('/dashboard');
        } else {
            setError('Erro inesperado no servidor.');
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginWrapper}>
                <div className={styles.logoArea}>
                    <h2>AURA</h2>
                    <p>O seu refúgio digital.</p>
                </div>

                <div className={styles.loginForm}>
                    <form className={styles.form} onSubmit={handleLogin}>
                        <div className={styles.inputGroup}>
                            <div className={styles.inputStack}>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={styles.inputTop}
                                    required
                                />
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Palavra-passe"
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
                            {loading ? 'A processar...' : 'Iniciar Sessão'}
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
                                        setError('Acesso de demonstração falhou. Verifique o backend.');
                                        setLoading(false);
                                    }
                                }}
                            >
                                Entrar no Modo de Apresentação
                            </Button>
                        </div>


                        <div className={styles.forgotPasswordWrapper}>
                            <Link href="#" className={styles.forgotPassword}>Esqueceu-se da Palavra-passe?</Link>
                        </div>
                    </form>

                    <p className={styles.signupText}>
                        Não tem uma conta AURA? <Link href="#" className={styles.signupLink}>Crie a sua agora.</Link>
                    </p>
                </div>

            </div>
        </div>
    );
}
