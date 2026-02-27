import Link from 'next/link';
import styles from './page.module.css';
import Button from '@/components/Button';

export default function LoginPage() {
    return (
        <div className={styles.container}>
            <div className={styles.loginWrapper}>
                <div className={styles.logoArea}>
                    <h2>AURA</h2>
                    <p>O seu refúgio digital.</p>
                </div>

                <div className={styles.loginForm}>
                    <form className={styles.form}>
                        <div className={styles.inputGroup}>
                            <div className={styles.inputStack}>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="Email"
                                    className={styles.inputTop}
                                    required
                                />
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Palavra-passe"
                                    className={styles.inputBottom}
                                    required
                                />
                            </div>
                        </div>

                        <Link href="/dashboard" passHref className={styles.submitWrapper}>
                            <Button variant="primary" size="lg" className={styles.submitBtn} type="button">
                                Iniciar Sessão
                            </Button>
                        </Link>

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
