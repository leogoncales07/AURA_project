'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useI18n } from '@/i18n';
import { Activity, Calendar, MessageCircle, ClipboardList, ChevronRight, Wind, Flame, Leaf, BookOpen, TrendingUp, Sparkles, PenLine } from 'lucide-react';

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [stats] = useState({ streak: 12, sessions: 48, tasks: '5/5' });
    const [latestLog] = useState({ mood_score: 8, sleep_hours: 7.5 });
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [reflectionText, setReflectionText] = useState('');
    const router = useRouter();
    const { t } = useI18n();

    // Weekly mood data (simulated — would come from API)
    const weeklyMood = [6, 7, 5, 8, 7, 9, 8];

    // Recent activity (simulated)
    const recentActivities = [
        { type: 'assessment', icon: <ClipboardList size={16} />, text: t('dashboard.activityAssessment', { name: 'GAD-7' }), time: t('dashboard.timeAgo1'), color: '#8b5cf6' },
        { type: 'meditation', icon: <Leaf size={16} />, text: t('dashboard.activityMeditation', { duration: '10min' }), time: t('dashboard.timeAgo2'), color: '#10b981' },
        { type: 'streak', icon: <Flame size={16} />, text: t('dashboard.activityStreak', { days: '12' }), time: t('dashboard.timeAgo3'), color: '#f59e0b' },
        { type: 'chat', icon: <BookOpen size={16} />, text: t('dashboard.activityChat'), time: t('dashboard.timeAgo4'), color: '#06b6d4' },
    ];

    const weekdays = [
        t('dashboard.weekdayMon'), t('dashboard.weekdayTue'), t('dashboard.weekdayWed'),
        t('dashboard.weekdayThu'), t('dashboard.weekdayFri'), t('dashboard.weekdaySat'),
        t('dashboard.weekdaySun'),
    ];

    useEffect(() => {
        const storedUser = (localStorage.getItem('aura_user') || sessionStorage.getItem('aura_user'));
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

    // SVG sparkline path from weekly mood
    const sparklineMax = 10;
    const sparklineWidth = 280;
    const sparklineHeight = 60;
    const sparklinePoints = weeklyMood.map((v, i) => {
        const x = (i / (weeklyMood.length - 1)) * sparklineWidth;
        const y = sparklineHeight - (v / sparklineMax) * sparklineHeight;
        return `${x},${y}`;
    });
    const sparklinePath = `M ${sparklinePoints.join(' L ')}`;
    const sparklineAreaPath = `${sparklinePath} L ${sparklineWidth},${sparklineHeight} L 0,${sparklineHeight} Z`;

    return (
        <AppShell title="">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* Greeting Section */}
                <div style={{ padding: '0 0 8px 0' }}>
                    <h1 style={{
                        fontFamily: 'var(--font-fraunces), serif',
                        fontSize: isMobile ? '32px' : '40px',
                        fontWeight: 400,
                        color: 'var(--fg-foreground)',
                        margin: 0,
                        letterSpacing: '-0.02em',
                    }}>
                        {greeting}
                    </h1>
                    <p style={{
                      margin: '10px 0 0 0',
                      fontSize: '15px',
                      color: 'var(--fg-muted)',
                      letterSpacing: '0.01em',
                      opacity: 0.7
                    }}>
                      {t('app.daily_quote') || 'your sanctuary is ready.'}
                    </p>
                </div>

                {/* Mood Card — scaled up */}
                <div style={{
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-primary)',
                    borderLeft: '3px solid var(--brand-primary)',
                    borderRadius: '24px',
                    padding: isMobile ? '32px' : '48px',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: '40px',
                    boxShadow: 'var(--shadow-lg), -4px 0 24px rgba(16,185,129,0.06)',
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--brand-primary)', boxShadow: '0 0 12px var(--brand-primary)' }} />
                            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--fg-muted)', opacity: 0.6 }}>
                                {t('dashboard.currentState')}
                            </span>
                        </div>
                        <h2 style={{
                            fontFamily: 'var(--font-fraunces), serif',
                            fontSize: isMobile ? '28px' : '34px',
                            fontWeight: 400,
                            color: 'var(--fg-foreground)',
                            lineHeight: 1.3,
                            margin: '0 0 28px 0',
                        }}>
                            {moodText}
                        </h2>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {[
                                { label: t('dashboard.sleep', { hours: latestLog.sleep_hours }), },
                                { label: t('dashboard.focus'), },
                            ].map((pill, i) => (
                                <span key={i} style={{
                                    padding: '8px 18px',
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

                    {/* Score Ring — scaled up */}
                    <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
                        <svg width="140" height="140" viewBox="0 0 140 140">
                            <defs>
                              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--brand-primary)" />
                                <stop offset="100%" stopColor="var(--brand-secondary)" />
                              </linearGradient>
                            </defs>
                            <circle cx="70" cy="70" r="58" fill="none" stroke="var(--bg-pill)" strokeWidth="6" />
                            <circle
                                cx="70" cy="70" r="58" fill="none"
                                stroke="url(#scoreGradient)"
                                strokeWidth="6"
                                strokeDasharray={2 * Math.PI * 58}
                                strokeDashoffset={2 * Math.PI * 58 * (1 - moodPercent)}
                                strokeLinecap="round"
                                transform="rotate(-90 70 70)"
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
                              fontSize: '34px',
                              fontWeight: 600,
                              color: 'var(--fg-foreground)',
                              lineHeight: 1
                          }}>
                              {latestLog?.mood_score ? latestLog.mood_score * 10 : '--'}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
                            AURA
                          </span>
                        </div>
                    </div>
                </div>

                {/* Stats Row — scaled up */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                        { icon: <Calendar size={20} />, value: stats.streak, label: t('dashboard.streak') },
                        { icon: <MessageCircle size={20} />, value: stats.sessions, label: t('dashboard.sessions') },
                        { icon: <ClipboardList size={20} />, value: stats.tasks, label: t('dashboard.tasks') },
                    ].map((stat, i) => (
                        <div key={i} style={{
                            background: 'var(--bg-card)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '20px',
                            padding: '40px 32px',
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
                                fontSize: '32px',
                                fontWeight: 700,
                                color: 'var(--fg-foreground)',
                                marginBottom: '6px',
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

                {/* Weekly Mood Sparkline + Recent Activity — two columns on desktop */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>

                    {/* Weekly Mood Sparkline */}
                    <div style={{
                        background: 'var(--bg-card)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '22px',
                        padding: '32px',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <TrendingUp size={16} style={{ color: 'var(--brand-primary)' }} />
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.12em',
                                    color: 'var(--fg-muted)',
                                }}>
                                    {t('dashboard.weeklyMood')}
                                </span>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--fg-muted)', opacity: 0.5 }}>
                                {t('dashboard.moodToday')}: {weeklyMood[weeklyMood.length - 1]}/10
                            </span>
                        </div>

                        {/* Sparkline SVG */}
                        <div style={{ position: 'relative', width: '100%', height: `${sparklineHeight + 30}px` }}>
                            <svg
                                viewBox={`-10 -5 ${sparklineWidth + 20} ${sparklineHeight + 35}`}
                                style={{ width: '100%', height: '100%' }}
                                preserveAspectRatio="none"
                            >
                                <defs>
                                    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0.02" />
                                    </linearGradient>
                                </defs>
                                <path d={sparklineAreaPath} fill="url(#sparkFill)" />
                                <path d={sparklinePath} fill="none" stroke="var(--brand-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                {weeklyMood.map((v, i) => {
                                    const x = (i / (weeklyMood.length - 1)) * sparklineWidth;
                                    const y = sparklineHeight - (v / sparklineMax) * sparklineHeight;
                                    return (
                                        <g key={i}>
                                            <circle cx={x} cy={y} r="4" fill="var(--bg-background)" stroke="var(--brand-primary)" strokeWidth="2" />
                                            <text x={x} y={sparklineHeight + 20} textAnchor="middle" fontSize="10" fill="var(--fg-muted)" fontFamily="var(--font-dm-sans), sans-serif" opacity="0.6">
                                                {weekdays[i]}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div style={{
                        background: 'var(--bg-card)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '22px',
                        padding: '32px',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                            <Sparkles size={16} style={{ color: 'var(--brand-secondary)' }} />
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                color: 'var(--fg-muted)',
                            }}>
                                {t('dashboard.recentActivity')}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {recentActivities.map((activity, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    padding: '14px 0',
                                    borderBottom: i < recentActivities.length - 1 ? '1px solid var(--border-primary)' : 'none',
                                }}>
                                    <div style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '10px',
                                        background: `${activity.color}18`,
                                        border: `1px solid ${activity.color}25`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: activity.color,
                                        flexShrink: 0,
                                    }}>
                                        {activity.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fg-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {activity.text}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', color: 'var(--fg-muted)', opacity: 0.5, flexShrink: 0 }}>
                                        {activity.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
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
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                        {[
                            { icon: <ClipboardList size={20} />, title: t('dashboard.weeklyAssessment'), desc: t('dashboard.weeklyAssessmentDesc'), href: '/inqueritos' },
                            { icon: <Wind size={20} />, title: t('dashboard.breathingPause'), desc: t('dashboard.breathingPauseDesc'), href: '/meditations' },
                        ].map((action, i) => (
                            <div key={i} onClick={() => router.push(action.href)} style={{
                                background: 'var(--bg-card)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '18px',
                                padding: '28px 28px',
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
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '14px',
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
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--fg-foreground)', marginBottom: '4px' }}>
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

                {/* Daily Reflection Prompt */}
                <div style={{
                    background: 'var(--bg-card)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '22px',
                    padding: '36px',
                    boxShadow: 'var(--shadow-sm)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <PenLine size={16} style={{ color: 'var(--brand-primary)' }} />
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            color: 'var(--fg-muted)',
                        }}>
                            {t('dashboard.dailyReflectionTitle')}
                        </span>
                    </div>
                    <p style={{
                        fontFamily: 'var(--font-fraunces), serif',
                        fontSize: '20px',
                        fontWeight: 400,
                        color: 'var(--fg-foreground)',
                        margin: '0 0 20px 0',
                        lineHeight: 1.5,
                        opacity: 0.85,
                    }}>
                        "{t('dashboard.dailyReflectionPrompt')}"
                    </p>
                    <textarea
                        value={reflectionText}
                        onChange={(e) => setReflectionText(e.target.value)}
                        placeholder={t('dashboard.reflectionPlaceholder')}
                        rows={3}
                        style={{
                            width: '100%',
                            background: 'var(--bg-pill)',
                            border: '1px solid var(--border-pill)',
                            borderRadius: '14px',
                            padding: '16px 20px',
                            fontSize: '14px',
                            fontFamily: 'var(--aura-font-sans)',
                            color: 'var(--fg-foreground)',
                            resize: 'none',
                            outline: 'none',
                            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                            lineHeight: 1.6,
                        }}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--border-pill)'; e.target.style.boxShadow = 'none'; }}
                    />
                </div>

            </div>
        </AppShell>
    );
}
