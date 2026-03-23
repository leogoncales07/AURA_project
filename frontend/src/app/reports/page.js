'use client';
import { Brain, Flame, Info, Moon, TrendingUp, Wind } from 'lucide-react';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import AppShell from '@/components/AppShell';

import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import StaggeredEntrance from '@/components/StaggeredEntrance';

/**
 * AnimatedNumber - Simple counter using requestAnimationFrame
 */
const AnimatedNumber = ({ value, duration = 1500 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return <>{displayValue}</>;
};

export default function ReportsPage() {
    const { t } = useI18n();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        wellnessScore: 84,
        streak: 12,
        chartData: [65, 78, 72, 85, 80, 88, 84],
        days: [
          t('reports.weekdayM'), 
          t('reports.weekdayT'), 
          t('reports.weekdayW'), 
          t('reports.weekdayTh'), 
          t('reports.weekdayF'), 
          t('reports.weekdayS'), 
          t('reports.weekdaySu')
        ]
    });
    const [hoveredData, setHoveredData] = useState(null);
    const chartRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('aura_user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        setLoading(false);
    }, [router]);

    // SVG Line Chart calculations
    const width = 800;
    const height = 200;
    const padding = 40;
    const usableWidth = width - (padding * 2);
    const usableHeight = height - (padding * 2);
    
    // Refresh days if locale changes
    useEffect(() => {
      setStats(prev => ({
        ...prev,
        days: [
          t('reports.weekdayM'), 
          t('reports.weekdayT'), 
          t('reports.weekdayW'), 
          t('reports.weekdayTh'), 
          t('reports.weekdayF'), 
          t('reports.weekdayS'), 
          t('reports.weekdaySu')
        ]
      }));
    }, [t]);

    const points = stats.chartData.map((d, i) => {
      const x = padding + (i * (usableWidth / (stats.chartData.length - 1)));
      const y = height - padding - ((d / 100) * usableHeight);
      return { x, y, value: d, day: stats.days[i] };
    });

    const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    const areaPath = `${linePath} L ${points[points.length-1].x},${height-padding} L ${points[0].x},${height-padding} Z`;

    if (loading) return null;

    return (
        <AppShell title={t('reports.title')}>
            <StaggeredEntrance className={styles.dashboardGrid}>
                
                {/* Main Column */}
                <div className={styles.mainCol}>
                    <div className={styles.heroCard}>
                        <span className={styles.heroLabel}>{t('reports.wellnessIndex')}</span>
                        <div className={styles.heroValue}>
                          <AnimatedNumber value={stats.wellnessScore} />
                        </div>
                        
                        <div className={styles.chartContainer} ref={chartRef}>
                            <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg}>
                                <defs>
                                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="var(--aura-aurora-1)" />
                                        <stop offset="100%" stopColor="var(--aura-aurora-2)" />
                                    </linearGradient>
                                    <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="var(--aura-aurora-1)" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="var(--aura-aurora-1)" stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                {/* Baseline */}
                                <line 
                                  x1={padding} y1={height - padding} 
                                  x2={width - padding} y2={height - padding} 
                                  className={styles.baseline} 
                                />

                                {/* Area Fill */}
                                <path d={areaPath} fill="url(#areaGrad)" />
                                
                                {/* Line Path */}
                                <path 
                                  d={linePath} 
                                  fill="none" 
                                  stroke="url(#lineGrad)" 
                                  strokeWidth="3" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                />

                                {/* Data Points */}
                                {points.map((p, i) => (
                                  <g key={i} onMouseEnter={() => setHoveredData(p)} onMouseLeave={() => setHoveredData(null)}>
                                    <circle 
                                      cx={p.x} cy={p.y} r="6" 
                                      fill="var(--aura-void)" 
                                      stroke="url(#lineGrad)" 
                                      strokeWidth="2" 
                                      style={{ cursor: 'pointer', transition: 'r 0.2s ease' }}
                                    />
                                    <text 
                                      x={p.x} y={height - padding + 20} 
                                      textAnchor="middle" 
                                      className={styles.chartLabel}
                                    >
                                      {p.day}
                                    </text>
                                  </g>
                                ))}
                            </svg>

                            {hoveredData && (
                              <div 
                                className={styles.tooltip}
                                style={{ 
                                  left: `${(hoveredData.x / width) * 100}%`, 
                                  top: `${(hoveredData.y / height) * 100}%`,
                                  transform: 'translate(-50%, -120%)'
                                }}
                              >
                                <span className={styles.tooltipTitle}>{hoveredData.day} {t('reports.insightSuffix')}</span>
                                <span className={styles.tooltipValue}>{hoveredData.value}% {t('reports.balanceSuffix')}</span>
                              </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.statsGrid}>
                      <div className={styles.insightCard} style={{ borderLeft: '3px solid var(--aura-aurora-4)' }}>
                        <div className={styles.insightHeader}>{t('reports.insight1Header')}</div>
                        <div className={styles.insightBody}>{t('reports.insight1Body')}</div>
                      </div>
                      <div className={styles.insightCard} style={{ borderLeft: '3px solid var(--aura-aurora-3)' }}>
                        <div className={styles.insightHeader}>{t('reports.insight2Header')}</div>
                        <div className={styles.insightBody}>{t('reports.insight2Body')}</div>
                      </div>
                    </div>
                </div>

                {/* Side Column */}
                <div className={styles.sideCol}>
                    <div className={styles.streakCard}>
                        <div className={styles.flameIcon}>
                          <Flame size={48} fill="currentColor" />
                        </div>
                        <div className={styles.streakValue}>
                           <AnimatedNumber value={stats.streak} />
                        </div>
                        <span className={styles.heroLabel}>{t('reports.streak')}</span>
                    </div>

                    <div className={styles.statItem}>
                      <div className={styles.statLabel}>{t('reports.totalSessions')}</div>
                      <div className={styles.statValue}>
                        <AnimatedNumber value={42} />
                      </div>
                    </div>

                    <div className={styles.statItem}>
                      <div className={styles.statLabel}>{t('reports.clarityHours')}</div>
                      <div className={styles.statValue}>
                        <AnimatedNumber value={128} />
                      </div>
                    </div>

                    <div className={styles.insightCard} style={{ borderLeft: '3px solid var(--aura-aurora-2)' }}>
                        <div className={styles.insightHeader}>{t('reports.sleepHeader')}</div>
                        <div className={styles.insightBody}>{t('reports.sleepBody')}</div>
                    </div>
                </div>

            </StaggeredEntrance>
        </AppShell>
    );
}
