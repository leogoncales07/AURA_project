'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useI18n } from '@/i18n';
import { Activity, Calendar, MessageCircle, ClipboardList, ChevronRight, Wind } from 'lucide-react';

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [stats] = useState({ streak: 12, sessions: 48, tasks: '5/5' });
    const [latestLog] = useState({ mood_score: 8, sleep_hours: 7.5 });
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const { t } = useI18n();

    useEffect(() => {
        const storedUser = localStorage.getItem('aura_user');
        if (!storedUser) { router.push('/login'); return; }
        setUser(JSON.parse(storedUser));
        
        // Handle responsive check
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        const timer = setTimeout(() => setLoading(false), 600);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('resize', checkMobile);
        };
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-background)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', margin: '0 auto 16px', animation: 'pulse 2s infinite' }} />
                    <p style={{ color: 'var(--bg-pill)', fontSize: '13px', letterSpacing: '0.02em' }}>
                        {t('dashboard.syncing')}
                    </p>
                </div>
            </div>
        );
    }

    const userName = user?.display_name || user?.name || user?.user_metadata?.name || t('dashboard.friend');
    const nameToShow = userName.split(' ')[0];
    const greeting = t('dashboard.greeting', { name: nameToShow });
    const moodText = latestLog?.mood_score > 7 ? t('dashboard.moodHigh') : latestLog?.mood_score > 4 ? t('dashboard.moodMid') : t('dashboard.moodLow');
    const moodPercent = (latestLog?.mood_score || 0) / 10;

    return (
        <AppShell title="">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* Greeting Section */}
                <div style={{ padding: '0 0 16px 0' }}>
                    <h1 style={{
                        fontFamily: 'var(--font-fraunces), serif',
                        fontSize: '32px',
                        fontWeight: 400,
                        color: 'var(--fg-foreground)',
                        margin: 0,
                        letterSpacing: '-0.02em',
                    }}>
                        {greeting}
                    </h1>
                    <p style={{
                      margin: '8px 0 0 0',
                      fontSize: '14px',
                      color: 'var(--fg-muted)',
                      letterSpacing: '0.01em'
                    }}>
                      {t('app.daily_quote') || 'your sanctuary is ready.'}
                    </p>
                </div>

                {/* Mood Card */}
                <div style={{
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '24px',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: '40px',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-primary)', boxShadow: '0 0 10px var(--brand-primary)' }} />
                            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--fg-muted)', opacity: 0.6 }}>
                                {t('dashboard.currentState')}
                            </span>
                        </div>
                        <h2 style={{
                            fontFamily: 'var(--font-fraunces), serif',
                            fontSize: '28px',
                            fontWeight: 400,
                            color: 'var(--fg-foreground)',
                            lineHeight: 1.3,
                            margin: '0 0 24px 0',
                        }}>
                            {moodText}
                        </h2>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {[
                                { label: t('dashboard.sleep', { hours: latestLog.sleep_hours }), },
                                { label: t('dashboard.focus'), },
                            ].map((pill, i) => (
                                <span key={i} style={{
                                    padding: '6px 16px',
                                    background: 'var(--bg-pill)',
                                    border: '1px solid var(--border-pill)',
                                    borderRadius: '100px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--fg-muted)',
                                }}>
                                    {pill.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Score Ring */}
                    <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <defs>
                              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--brand-primary)" />
                                <stop offset="100%" stopColor="var(--brand-secondary)" />
                              </linearGradient>
                            </defs>
                            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-pill)" strokeWidth="6" />
                            <circle
                                cx="60" cy="60" r="50" fill="none"
                                stroke="url(#scoreGradient)"
                                strokeWidth="6"
                                strokeDasharray={2 * Math.PI * 50}
                                strokeDashoffset={2 * Math.PI * 50 * (1 - moodPercent)}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                          <span style={{
                              fontFamily: 'var(--font-dm-sans), sans-serif',
                              fontSize: '28px',
                              fontWeight: 600,
                              color: 'var(--fg-foreground)',
                              lineHeight: 1
                          }}>
                              {latestLog?.mood_score ? latestLog.mood_score * 10 : '--'}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                            AURA
                          </span>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                        { icon: <Calendar size={18} />, value: stats.streak, label: t('dashboard.streak') },
                        { icon: <MessageCircle size={18} />, value: stats.sessions, label: t('dashboard.sessions') },
                        { icon: <ClipboardList size={18} />, value: stats.tasks, label: t('dashboard.tasks') },
                    ].map((stat, i) => (
                        <div key={i} style={{
                            background: 'var(--bg-card)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '20px',
                            padding: '32px 24px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            cursor: 'default',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--brand-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
                        >
                            <span style={{ color: 'var(--fg-muted)', marginBottom: '16px' }}>{stat.icon}</span>
                            <span style={{
                                fontFamily: 'var(--font-dm-sans), sans-serif',
                                fontSize: '26px',
                                fontWeight: 700,
                                color: 'var(--fg-foreground)',
                                marginBottom: '4px',
                            }}>{stat.value}</span>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: 'var(--fg-muted)',
                            }}>{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Action Cards */}
                <div>
                    <h3 style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: 'var(--fg-muted)',
                        marginBottom: '16px',
                        marginLeft: '4px'
                    }}>
                        {t('dashboard.nextStep')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { icon: <ClipboardList size={18} />, title: t('dashboard.weeklyAssessment'), desc: t('dashboard.weeklyAssessmentDesc'), href: '/inqueritos' },
                            { icon: <Wind size={18} />, title: t('dashboard.breathingPause'), desc: t('dashboard.breathingPauseDesc'), href: '/meditations' },
                        ].map((action, i) => (
                            <div key={i} onClick={() => router.push(action.href)} style={{
                                background: 'var(--bg-card)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '18px',
                                padding: '20px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                            >
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: 'var(--bg-pill)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--brand-primary)',
                                    flexShrink: 0,
                                    border: '1px solid var(--border-pill)'
                                }}>
                                    {action.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--fg-foreground)', marginBottom: '2px' }}>
                                        {action.title}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                                        {action.desc}
                                    </div>
                                </div>
                                <ChevronRight size={18} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </AppShell>
    );
}
