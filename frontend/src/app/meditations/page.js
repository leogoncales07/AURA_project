import styles from '@/app/dashboard/page.module.css';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { Wind, PlayCircle, Headphones, Moon, Activity } from 'lucide-react';

export default function MeditationsPage() {
    return (
        <div className={styles.appContainer}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wind size={20} style={{ color: 'var(--color-accent-mint)' }} />
                        <div className={styles.date}>Sessões Guiadas</div>
                    </div>
                    <div>
                        <ThemeToggle />
                    </div>
                </div>
                <h1 className={styles.greeting}>Pausar</h1>
            </header>

            <main className={styles.mainContent}>
                <section className={styles.summarySection}>
                    <div className={styles.surfaceCard} style={{ background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(48, 209, 88, 0.1) 100%)', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <span className={styles.emotionSub}>RECOMENDADO PARA AGORA</span>
                            <div className={styles.emotionTitle} style={{ marginBottom: '8px' }}>Balanço Emocional</div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Uma pausa de 5 minutos desenhada para estabilizar o sistema nervoso central.</p>
                            <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.875rem' }}>
                                <PlayCircle size={18} /> Iniciar
                            </button>
                        </div>
                        <Wind size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1, color: 'var(--color-accent-mint)' }} />
                    </div>
                </section>

                <section className={styles.actionsSection}>
                    <h2 className={styles.sectionTitle}>Explorar</h2>
                    <div className={styles.actionGrid}>
                        <div className={styles.actionCard}>
                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-accent-blue)" }}>
                                <Moon size={22} strokeWidth={2.5} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>Preparação para o Sono</h3>
                                <p>12 min • Ondas Delta</p>
                            </div>
                            <div className={styles.actionArrow}>
                                <PlayCircle size={24} style={{ color: 'var(--color-primary)' }} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className={styles.actionCard}>
                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-accent-pink)" }}>
                                <Activity size={22} strokeWidth={2.5} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>Foco Profundo</h3>
                                <p>15 min • Ruído Castanho</p>
                            </div>
                            <div className={styles.actionArrow}>
                                <PlayCircle size={24} style={{ color: 'var(--color-primary)' }} strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
