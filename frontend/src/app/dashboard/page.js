import styles from './page.module.css';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { User, ClipboardList, Wind, ChevronRight, Activity } from 'lucide-react';

export default function DashboardPage() {
    return (
        <div className={styles.appContainer}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div className={styles.date}>Terça-feira, 27 Fev</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <ThemeToggle />
                        <div className={styles.avatar}>
                            <User size={20} />
                        </div>
                    </div>
                </div>
                <h1 className={styles.greeting}>Olá, Utilizador</h1>
            </header>

            <main className={styles.mainContent}>
                <section className={styles.summarySection}>
                    <div className={styles.surfaceCard}>
                        <div className={styles.emotionRow}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <Activity size={14} style={{ color: 'var(--color-accent-mint)' }} />
                                    <span className={styles.emotionSub} style={{ marginBottom: 0 }}>O SEU ESTADO HOJE</span>
                                </div>
                                <div className={styles.emotionTitle}>Calmo e Focado</div>
                            </div>
                            <div className={styles.emotionRing}>
                                <svg width="48" height="48" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-border)" strokeWidth="4" />
                                    <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-accent-mint)" strokeWidth="4" strokeDasharray="125.6" strokeDashoffset="31.4" strokeLinecap="round" transform="rotate(-90 24 24)" />
                                </svg>
                                <span className={styles.emotionScore}>75</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.actionsSection}>
                    <h2 className={styles.sectionTitle}>Recomendações</h2>
                    <div className={styles.actionGrid}>
                        <div className={styles.actionCard}>
                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-primary)" }}>
                                <ClipboardList size={22} strokeWidth={2.5} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>Avaliação Semanal</h3>
                                <p>O seu check-in GAD-7 está disponível.</p>
                            </div>
                            <div className={styles.actionArrow}>
                                <ChevronRight size={20} strokeWidth={2} />
                            </div>
                        </div>

                        <div className={styles.actionCard}>
                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-accent-mint)" }}>
                                <Wind size={22} strokeWidth={2.5} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>Pausa Respiratória</h3>
                                <p>3 minutos para descompressão guiada.</p>
                            </div>
                            <div className={styles.actionArrow}>
                                <ChevronRight size={20} strokeWidth={2} />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
