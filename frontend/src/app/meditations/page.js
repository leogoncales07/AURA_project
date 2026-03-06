'use client';

import styles from '@/app/dashboard/page.module.css';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Wind, PlayCircle, Moon, Activity } from 'lucide-react';
import { useI18n } from '@/i18n';

export default function MeditationsPage() {
    const { t } = useI18n();

    return (
        <div className={styles.appContainer}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wind size={20} style={{ color: 'var(--color-accent-mint)' }} />
                        <div className={styles.date}>{t('meditations.headerLabel')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </div>
                <h1 className={styles.greeting}>{t('meditations.title')}</h1>
            </header>

            <main className={styles.mainContent}>
                <section className={styles.summarySection}>
                    <div className={styles.surfaceCard} style={{ background: 'linear-gradient(135deg, var(--color-surface) 0%, rgba(48, 209, 88, 0.1) 100%)', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <span className={styles.emotionSub}>{t('meditations.recommended')}</span>
                            <div className={styles.emotionTitle} style={{ marginBottom: '8px' }}>{t('meditations.featuredTitle')}</div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{t('meditations.featuredDesc')}</p>
                            <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.875rem' }}>
                                <PlayCircle size={18} /> {t('meditations.start')}
                            </button>
                        </div>
                        <Wind size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1, color: 'var(--color-accent-mint)' }} />
                    </div>
                </section>

                <section className={styles.actionsSection}>
                    <h2 className={styles.sectionTitle}>{t('meditations.explore')}</h2>
                    <div className={styles.actionGrid}>
                        <div className={styles.actionCard}>
                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-accent-blue)" }}>
                                <Moon size={22} strokeWidth={2.5} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>{t('meditations.sleepPrep')}</h3>
                                <p>{t('meditations.sleepPrepMeta')}</p>
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
                                <h3>{t('meditations.deepFocus')}</h3>
                                <p>{t('meditations.deepFocusMeta')}</p>
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
