'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/dashboard/page.module.css';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { BarChart2, TrendingUp, Calendar, Activity } from 'lucide-react';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';

export default function ReportsPage() {
    const { t } = useI18n();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        chartData: [0, 0, 0, 0, 0, 0, 0],
        avgMood: 0,
        streak: 0,
        todayIndex: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('aura_user');
        if (!storedUser) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        fetchReportsData(parsedUser.id);
    }, []);

    const fetchReportsData = async (userId) => {
        setLoading(true);
        const logsRes = await api.getLogs(userId, 14);

        let avgMood = 0;
        let streak = 0;
        let chartData = [0, 0, 0, 0, 0, 0, 0];

        const today = new Date();
        const dayOfWeek = today.getDay();
        const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        // Calculate Monday of this week (00:00:00)
        const monday = new Date(today);
        monday.setDate(today.getDate() - todayIndex);
        monday.setHours(0, 0, 0, 0);

        if (logsRes.data && logsRes.data.logs) {
            const logs = logsRes.data.logs;
            streak = logs.length;

            let totalMood = 0;
            let moodCount = 0;

            logs.forEach((log) => {
                const logDate = new Date(log.log_date || log.created_at);

                // Assign mood to the corresponding week day if it belongs to current week
                if (logDate >= monday) {
                    const lDay = logDate.getDay();
                    const lIndex = lDay === 0 ? 6 : lDay - 1;
                    if (log.mood_score && lIndex <= todayIndex) {
                        chartData[lIndex] = log.mood_score * 10;
                    }
                }

                if (log.mood_score) {
                    totalMood += log.mood_score;
                    moodCount++;
                }
            });

            if (moodCount > 0) {
                avgMood = Math.round((totalMood / moodCount) * 10);
            }
        }

        setStats({ avgMood, streak, chartData, todayIndex });
        setLoading(false);
    };

    if (loading) {
        return (
            <div className={styles.appContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Activity className={styles.pulse} size={48} style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className={styles.appContainer}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart2 size={20} style={{ color: 'var(--color-primary)' }} />
                        <div className={styles.date}>{t('reports.headerLabel')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </div>
                <h1 className={styles.greeting}>{t('reports.title')}</h1>
            </header>

            <main className={styles.mainContent}>
                <section className={styles.summarySection}>
                    <h2 className={styles.sectionTitle}>{t('reports.weeklySummary')}</h2>
                    <div className={styles.surfaceCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '140px', paddingBottom: '16px', borderBottom: '0.5px solid var(--color-divider)' }}>
                            {stats.chartData.map((height, i) => (
                                <div key={i} style={{
                                    width: '10%',
                                    height: `${Math.max(height, 5)}%`,
                                    background: i === stats.todayIndex ? 'var(--color-primary)' : height > 0 ? 'var(--color-accent-blue)' : 'var(--color-border)',
                                    borderRadius: '6px',
                                    transition: 'height 0.5s ease',
                                    opacity: i > stats.todayIndex ? 0.3 : 1
                                }}></div>
                            ))}
                        </div>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                            {['S1', 'T', 'Q1', 'Q2', 'S2', 'Sat', 'D'].map((key, i) => (
                                <span key={key} style={{
                                    fontSize: '0.75rem',
                                    color: i === stats.todayIndex ? 'var(--color-primary)' : 'var(--color-text-light)',
                                    fontWeight: i === stats.todayIndex ? 800 : 600,
                                    borderBottom: i === stats.todayIndex ? '2px solid var(--color-primary)' : 'none',
                                    paddingBottom: '2px'
                                }}>
                                    {t(`reports.weekday${key}`)}
                                </span>
                            ))}
                        </div>
                        {stats.streak === 0 && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: '8px', textAlign: 'center' }}>
                                Not enough data yet. Complete daily sessions to populate your chart.
                            </div>
                        )}
                    </div>
                </section>

                <section className={styles.actionsSection}>
                    <h2 className={styles.sectionTitle}>{t('reports.statistics')}</h2>
                    <div className={styles.actionGrid}>
                        <div className={styles.actionCard}>
                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-accent-mint)" }}>
                                <TrendingUp size={22} strokeWidth={2.5} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>{t('reports.avgMood')}</h3>
                                <p>{stats.avgMood > 0 ? `${stats.avgMood}%` : 'No data yet'}</p>
                            </div>
                        </div>
                        <div className={styles.actionCard}>
                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-accent-blue)" }}>
                                <Calendar size={22} strokeWidth={2.5} />
                            </div>
                            <div className={styles.actionText}>
                                <h3>{t('reports.consecutiveDays')}</h3>
                                <p>{stats.streak} {stats.streak === 1 ? 'Day' : 'Days'}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
