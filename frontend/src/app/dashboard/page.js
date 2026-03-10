'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import AuraLogo from '@/components/AuraLogo';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { User, ClipboardList, Wind, ChevronRight, Activity, TrendingUp, Calendar, Zap, MessageCircle, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ streak: 0, sessions: 0, tasks: '2/5' });
    const [latestLog, setLatestLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { t, locale } = useI18n();

    useEffect(() => {
        const storedUser = localStorage.getItem('aura_user');
        if (!storedUser) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        fetchDashboardData(parsedUser.id);
    }, []);

    const fetchDashboardData = async (userId) => {
        setLoading(true);

        const [userRes, logsRes, historyRes] = await Promise.all([
            api.getUser(userId),
            api.getLogs(userId),
            api.getHistory(userId)
        ]);

        if (userRes.data) setUser(userRes.data.user);

        let streakCount = 0;
        let sessionCount = 0;

        if (logsRes.data && logsRes.data.logs) {
            const logs = logsRes.data.logs;
            if (logs.length > 0) {
                setLatestLog(logs[0]);
                streakCount = logs.length;
            }
        }

        if (historyRes.data && historyRes.data.assessments) {
            sessionCount = historyRes.data.assessments.length;
        }

        setStats({
            streak: streakCount,
            sessions: sessionCount,
            tasks: sessionCount > 0 ? `${sessionCount}` : '0'
        });

        setLoading(false);
    };

    const dateLocaleMap = { pt: 'pt-PT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };

    if (loading) {
        return (
            <div className={styles.appContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Activity className={styles.pulse} size={48} style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
                    <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{t('dashboard.syncing')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.appContainer}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AuraLogo size={48} />
                        <div className={styles.date}>
                            {new Date().toLocaleDateString(dateLocaleMap[locale] || 'pt-PT', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <LanguageSwitcher />
                        <ThemeToggle />
                        <div className={styles.avatar}>
                            <User size={20} />
                        </div>
                    </div>
                </div>
                <h1 className={styles.greeting}>{t('dashboard.greeting', { name: user?.name?.split(' ')[0] || 'User' })}</h1>
            </header>

            <main className={styles.mainContent}>
                <section className={styles.summarySection}>
                    <div className={styles.surfaceCard}>
                        <div className={styles.emotionRow}>
                            <div className={styles.emotionInfo}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <Activity size={14} style={{ color: 'var(--color-primary)' }} />
                                    <span className={styles.emotionSub} style={{ marginBottom: 0 }}>{t('dashboard.statusLabel')}</span>
                                </div>
                                <div className={styles.emotionTitle}>
                                    {!latestLog?.mood_score ? 'No data yet' : latestLog?.mood_score > 7 ? t('dashboard.moodHigh') : latestLog?.mood_score > 4 ? t('dashboard.moodMid') : t('dashboard.moodLow')}
                                </div>
                                <div className={styles.insightPills}>
                                    {latestLog?.sleep_hours && <span className={styles.pill}><Zap size={12} /> {t('dashboard.sleep', { hours: latestLog.sleep_hours })}</span>}
                                    <span className={styles.pill}><TrendingUp size={12} /> {t('dashboard.focus')}</span>
                                </div>
                            </div>
                            <div className={styles.emotionRing}>
                                <svg width="80" height="80" viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="36" fill="none" stroke="var(--color-border)" strokeWidth="6" />
                                    <circle cx="40" cy="40" r="36" fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeDasharray="226" strokeDashoffset={226 - (226 * (latestLog?.mood_score || 0) / 10)} strokeLinecap="round" transform="rotate(-90 40 40)" />
                                </svg>
                                <span className={styles.emotionScore}>{latestLog?.mood_score ? latestLog.mood_score * 10 : '--'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.statsSection}>
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <Calendar size={18} className={styles.statIcon} />
                            <div className={styles.statValue}>{stats.streak} {t('dashboard.days')}</div>
                            <div className={styles.statLabel}>{t('dashboard.streak')}</div>
                        </div>
                        <div className={styles.statCard}>
                            <MessageCircle size={18} className={styles.statIcon} />
                            <div className={styles.statValue}>{stats.sessions}</div>
                            <div className={styles.statLabel}>{t('dashboard.sessions')}</div>
                        </div>
                        <div className={styles.statCard}>
                            <ClipboardList size={18} className={styles.statIcon} />
                            <div className={styles.statValue}>{stats.tasks}</div>
                            <div className={styles.statLabel}>{t('dashboard.tasks')}</div>
                        </div>
                    </div>
                </section>

                <section className={styles.actionsSection}>
                    <h2 className={styles.sectionTitle}>{t('dashboard.recommendations')}</h2>
                    <div className={styles.actionGrid}>
                        <div className={styles.actionCard} onClick={() => router.push('/assessment')}>
                            <div className={styles.actionIconWrapper}>
                                <ClipboardList size={22} strokeWidth={2} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>{t('dashboard.weeklyAssessment')}</h3>
                                <p>{t('dashboard.weeklyAssessmentDesc')}</p>
                            </div>
                            <div className={styles.actionArrow}>
                                <ChevronRight size={20} strokeWidth={2} />
                            </div>
                        </div>

                        <div className={styles.actionCard} onClick={() => router.push('/meditations')}>
                            <div className={styles.actionIconWrapper}>
                                <Wind size={22} strokeWidth={2} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>{t('dashboard.breathingPause')}</h3>
                                <p>{t('dashboard.breathingPauseDesc')}</p>
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
