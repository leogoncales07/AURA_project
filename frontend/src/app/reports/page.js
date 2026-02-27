import styles from '@/app/dashboard/page.module.css';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { BarChart2, TrendingUp, Calendar } from 'lucide-react';

export default function ReportsPage() {
    return (
        <div className={styles.appContainer}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart2 size={20} style={{ color: 'var(--color-primary)' }} />
                        <div className={styles.date}>O Teu Progresso</div>
                    </div>
                    <div>
                        <ThemeToggle />
                    </div>
                </div>
                <h1 className={styles.greeting}>Relatórios</h1>
            </header>

            <main className={styles.mainContent}>
                <section className={styles.summarySection}>
                    <h2 className={styles.sectionTitle}>Resumo Semanal</h2>
                    <div className={styles.surfaceCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '140px', paddingBottom: '16px', borderBottom: '0.5px solid var(--color-divider)' }}>
                            <div style={{ width: '10%', height: '40%', background: 'var(--color-border)', borderRadius: '6px' }}></div>
                            <div style={{ width: '10%', height: '60%', background: 'var(--color-border)', borderRadius: '6px' }}></div>
                            <div style={{ width: '10%', height: '30%', background: 'var(--color-border)', borderRadius: '6px' }}></div>
                            <div style={{ width: '10%', height: '80%', background: 'var(--color-accent-blue)', borderRadius: '6px' }}></div>
                            <div style={{ width: '10%', height: '50%', background: 'var(--color-border)', borderRadius: '6px' }}></div>
                            <div style={{ width: '10%', height: '90%', background: 'var(--color-primary)', borderRadius: '6px' }}></div>
                            <div style={{ width: '10%', height: '70%', background: 'var(--color-accent-mint)', borderRadius: '6px' }}></div>
                        </div>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600 }}>S</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600 }}>T</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600 }}>Q</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600 }}>Q</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600 }}>S</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>S</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600 }}>D</span>
                        </div>
                    </div>
                </section>

                <section className={styles.actionsSection}>
                    <h2 className={styles.sectionTitle}>Estatísticas</h2>
                    <div className={styles.actionGrid}>
                        <div className={styles.actionCard}>
                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-accent-mint)" }}>
                                <TrendingUp size={22} strokeWidth={2.5} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>Humor Médio</h3>
                                <p>Melhoria de +15% vs semana anterior.</p>
                            </div>
                        </div>
                        <div className={styles.actionCard}>
                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-accent-blue)" }}>
                                <Calendar size={22} strokeWidth={2.5} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>Dias Consecutivos</h3>
                                <p>5 dias seguidos a usar a AURA.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
