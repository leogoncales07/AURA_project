import styles from '@/app/dashboard/page.module.css';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { ClipboardList, FileText, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

export default function AssessmentPage() {
    return (
        <div className={styles.appContainer}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClipboardList size={20} style={{ color: 'var(--color-primary)' }} />
                        <div className={styles.date}>Avaliações Clínicas</div>
                    </div>
                    <div>
                        <ThemeToggle />
                    </div>
                </div>
                <h1 className={styles.greeting}>Testes</h1>
            </header>

            <main className={styles.mainContent}>
                <section className={styles.actionsSection}>
                    <h2 className={styles.sectionTitle}>Pendentes</h2>
                    <div className={styles.actionGrid}>
                        <div className={styles.actionCard} style={{ background: 'rgba(255, 55, 95, 0.05)' }}>
                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-accent-pink)", background: 'rgba(255, 55, 95, 0.1)' }}>
                                <AlertCircle size={22} strokeWidth={2.5} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>PHQ-9 (Depressão)</h3>
                                <p style={{ color: 'var(--color-accent-pink)' }}>Expirado há 2 dias. Por favor, conclua.</p>
                            </div>
                            <div className={styles.actionArrow}>
                                <ChevronRight size={20} strokeWidth={2} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.actionsSection} style={{ marginTop: '32px' }}>
                    <h2 className={styles.sectionTitle}>Histórico Recente</h2>
                    <div className={styles.actionGrid}>
                        <div className={styles.actionCard}>
                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-accent-mint)", background: 'none' }}>
                                <CheckCircle2 size={24} strokeWidth={2} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>GAD-7 (Ansiedade)</h3>
                                <p>Completado a 24 de Fevereiro</p>
                            </div>
                            <div className={styles.actionArrow}>
                                <FileText size={20} strokeWidth={2} style={{ color: 'var(--color-text-tertiary)' }} />
                            </div>
                        </div>
                        <div className={styles.actionCard}>
                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-accent-mint)", background: 'none' }}>
                                <CheckCircle2 size={24} strokeWidth={2} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>WHO-5 (Bem-estar)</h3>
                                <p>Completado a 15 de Fevereiro</p>
                            </div>
                            <div className={styles.actionArrow}>
                                <FileText size={20} strokeWidth={2} style={{ color: 'var(--color-text-tertiary)' }} />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
