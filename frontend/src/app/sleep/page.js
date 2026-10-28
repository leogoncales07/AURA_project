'use client';
import { Activity, Moon, Sun, Wind } from 'lucide-react';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import styles from './page.module.css';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { calculateSleepHours, sleepSummary } from '@/lib/wellness-metrics.mjs';

export default function SleepPage() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const [sleepLogs, setSleepLogs] = useState([]);
  const [timeframe, setTimeframe] = useState('Day');
  const [referenceDate, setReferenceDate] = useState(null);

  useEffect(() => {
    // Server and first client render share an empty chart. Local dates are only
    // calculated after mounting, when the browser's time zone is available.
    setReferenceDate(new Date());
  }, []);

  const [logModalVisible, setLogModalVisible] = useState(false);
  const [bedTimeInput, setBedTimeInput] = useState('23:30');
  const [wakeTimeInput, setWakeTimeInput] = useState('07:00');

  // Dynamic weekly chart data
  const [sleepError, setSleepError] = useState('');
  const [savingLog, setSavingLog] = useState(false);
  useEffect(() => {
    let active = true;
    setSleepLogs([]); setSleepError('');
    if (!user?.id) return;
    api.getSleepLogs(user.id, 365).then(result => {
      if (!active) return;
      if (result.error) setSleepError(result.error);
      else setSleepLogs(result.data.logs);
    });
    return () => { active = false; };
  }, [user?.id]);

  const handleSaveLog = async () => {
    if (!user?.id || savingLog) return;
    const hours = calculateSleepHours(bedTimeInput, wakeTimeInput);
    if (!hours || hours <= 0 || hours > 24) { setSleepError('Verifique os horários de sono. / Check sleep times.'); return; }
    setSavingLog(true); setSleepError('');
    const result = await api.logSleep(user.id, bedTimeInput, wakeTimeInput, hours);
    setSavingLog(false);
    if (result.error) { setSleepError(result.error); return; }
    const log = result.data.log;
    setSleepLogs(previous => [log, ...previous.filter(entry => entry.id !== log.id)]);
    setLogModalVisible(false);
  };

  const dateLocale = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : locale;
  const { displayData, weeklyData, sleepScore } = referenceDate
    ? sleepSummary(sleepLogs, timeframe, referenceDate, dateLocale)
    : { displayData: null, weeklyData: [], sleepScore: null };
  const displayTime = displayData ? (displayData.isAvg ? `${displayData.hours}h` : displayData.bedTime) : '—';
  const subText = displayData ? (displayData.isAvg ? 'AVERAGE SLEEP' : 'LOGGED BED TIME') : 'SEM DADOS / NO DATA';

  return (
    <AppShell title="sleep sanctuary">
      {sleepError && !logModalVisible && <p role="alert">{sleepError}</p>}
      <div className={`${styles.container} fade-up-stagger`}>
        
        <div className={styles.timeframeTabs} style={{ alignSelf: 'center', margin: '0 auto', width: 'fit-content' }}>
          {['Day', 'Week', 'Month', 'Year'].map(tab => (
            <button 
              key={tab} 
              className={`${styles.timeframeTab} ${timeframe === tab ? styles.timeframeTabActive : ''}`}
              onClick={() => setTimeframe(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Hero Section: 24h Clock Arc */}
        <section className={styles.hero}>
          <div className={styles.clockContainer}>
            <svg viewBox="0 0 100 100" className={styles.clockFace}>
              {/* Background Circle */}
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke="var(--aura-border)" 
                strokeWidth="1.5" 
              />
              
              {/* Sleep Arc (approx 11 PM to 7 AM) */}
              <path 
                d="M 50 5 A 45 45 0 0 1 95 50 A 45 45 0 0 1 50 95" 
                fill="none" 
                stroke="#5B8AF0" 
                strokeWidth="4" 
                strokeLinecap="round"
                transform="rotate(135 50 50)"
              />
              
              {/* Wake Arc (approx 7 AM to 11 PM) */}
              <path 
                d="M 50 95 A 45 45 0 0 1 5 50 A 45 45 0 0 1 50 5" 
                fill="none" 
                stroke="#F0A070" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                transform="rotate(135 50 50)"
                opacity="0.6"
              />
              
              {/* Current Time Dot */}
              <circle cx="50" cy="5" r="3" fill="var(--aura-white)" transform="rotate(320 50 50)">
                <animateTransform 
                  attributeName="transform" 
                  type="rotate" 
                  from="0 50 50" 
                  to="360 50 50" 
                  dur="60s" 
                  repeatCount="indefinite" 
                />
              </circle>
            </svg>
            
            <div className={styles.clockTime}>
              <h2>{displayTime}</h2>
              <p>{subText}</p>
              {displayData && !displayData.isAvg && (
                <p style={{ color: '#5B8AF0', fontWeight: 'bold' }}>{displayData.hours} HRS SLEPT</p>
              )}
              
              <button className={styles.logButton} onClick={() => setLogModalVisible(true)} style={{ margin: '16px auto 0' }}>
                <Wind size={16} /> Log Sleep
              </button>
            </div>
          </div>

          <div className={styles.scoreSection}>
            <div className={styles.scoreArcContainer}>
              <svg viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="var(--aura-border)" 
                  strokeWidth="6" 
                />
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="url(#aura-grad)" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  strokeDasharray={`${sleepScore * 2.51} 251.2`}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="aura-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7B6EF6" />
                    <stop offset="100%" stopColor="#5B8AF0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className={styles.scoreValue}>{sleepScore ?? '—'}</div>
            </div>
            <div className={styles.scoreInfo}>
              <h3>Restorative Sleep</h3>
              <p>Qualidade registada pelo utilizador / User recorded quality</p>
            </div>
          </div>
        </section>

        {/* Tonight's Protocol */}
        <section>
          <h3 className={styles.sectionTitle}>tonight&apos;s protocol</h3>
          <div className={styles.protocolGrid}>
            <div className={styles.phaseCard} style={{ borderLeft: '4px solid var(--aura-aurora-1)' }}>
              <div className={styles.phaseIcon} style={{ color: 'var(--aura-aurora-1)' }}>
                <Wind size={20} />
              </div>
              <div className={styles.phaseInfo}>
                <div className={styles.phaseHeader}>
                  <h4>Wind Down</h4>
                  <span className={styles.phaseTime}>21:30 - 23:00</span>
                </div>
                <p>No blue light. Soft reading or breathwork.</p>
              </div>
            </div>

            <div className={styles.phaseCard} style={{ borderLeft: '4px solid var(--aura-aurora-2)' }}>
              <div className={styles.phaseIcon} style={{ color: 'var(--aura-aurora-2)' }}>
                <Moon size={20} />
              </div>
              <div className={styles.phaseInfo}>
                <div className={styles.phaseHeader}>
                  <h4>Core Sleep</h4>
                  <span className={styles.phaseTime}>23:00 - 03:00</span>
                </div>
                <p>Consistent temperature at 18°C.</p>
              </div>
            </div>

            <div className={styles.phaseCard} style={{ borderLeft: '4px solid var(--aura-aurora-4)' }}>
              <div className={styles.phaseIcon} style={{ color: 'var(--aura-aurora-4)' }}>
                <Activity size={20} />
              </div>
              <div className={styles.phaseInfo}>
                <div className={styles.phaseHeader}>
                  <h4>Deep Cycle</h4>
                  <span className={styles.phaseTime}>03:00 - 06:00</span>
                </div>
                <p>Peak physical and mental recovery.</p>
              </div>
            </div>

            <div className={styles.phaseCard} style={{ borderLeft: '4px solid var(--aura-aurora-5)' }}>
              <div className={styles.phaseIcon} style={{ color: 'var(--aura-aurora-5)' }}>
                <Sun size={20} />
              </div>
              <div className={styles.phaseInfo}>
                <div className={styles.phaseHeader}>
                  <h4>Wake Window</h4>
                  <span className={styles.phaseTime}>06:00 - 07:30</span>
                </div>
                <p>Light exposure within 15 mins of waking.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Weekly Pattern Chart */}
        <section>
          <h3 className={styles.sectionTitle}>weekly efficiency</h3>
          <div className={styles.chartContainer}>
            <div className={styles.chartGrid}>
              {weeklyData.map((data, i) => (
                <div key={i} className={styles.chartColumn}>
                  <div className={styles.chartTooltip}>
                    {data.duration == null ? '—' : data.duration + 'h'}
                  </div>
                  <div 
                    className={styles.chartBar} 
                    style={{ height: `${Math.min((data.duration ?? 0) / 10, 1) * 100}%` }}
                  />
                  <div 
                    className={styles.chartDot} 
                    style={{ display: data.quality == null ? 'none' : undefined, bottom: `${data.quality}%` }}
                  />
                </div>
              ))}
            </div>
            <div className={styles.chartLabels}>
              {weeklyData.map((data, i) => (
                <span key={i}>{data.day}</span>
              ))}
            </div>
          </div>
        </section>

      </div>

      {logModalVisible && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} role="dialog" aria-modal="true" aria-labelledby="sleep-log-title">
            <h3 id="sleep-log-title">Log Sleep Data</h3>
            <p>Input your times in HH:MM format. We will calculate the total hours automatically.</p>
            {sleepError && <p role="alert">{sleepError}</p>}
            
            <div className={styles.inputGroup}>
              <label htmlFor="sleep-bed-time">Bed Time (e.g. 23:30)</label>
              <input 
                id="sleep-bed-time" type="time" required disabled={savingLog}
                value={bedTimeInput} 
                onChange={(e) => setBedTimeInput(e.target.value)} 
                placeholder="23:30" 
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="sleep-wake-time">Wake Time (e.g. 07:15)</label>
              <input 
                id="sleep-wake-time" type="time" required disabled={savingLog}
                value={wakeTimeInput} 
                onChange={(e) => setWakeTimeInput(e.target.value)} 
                placeholder="07:15" 
              />
            </div>

            {calculateSleepHours(bedTimeInput, wakeTimeInput) !== null && (
              <div className={styles.previewText}>
                {calculateSleepHours(bedTimeInput, wakeTimeInput)} hours total
              </div>
            )}
            
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setLogModalVisible(false)} disabled={savingLog}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSaveLog} disabled={savingLog}>{savingLog ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
