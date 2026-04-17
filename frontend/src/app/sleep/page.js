'use client';
import { Activity, CheckCircle2, Coffee, Moon, Sun, Wind, Zap } from 'lucide-react';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import Card from '@/components/Card';
import styles from './page.module.css';

export default function SleepPage() {
  const [sleepLogs, setSleepLogs] = useState([]);
  const [timeframe, setTimeframe] = useState('Day');

  const [logModalVisible, setLogModalVisible] = useState(false);
  const [bedTimeInput, setBedTimeInput] = useState('23:30');
  const [wakeTimeInput, setWakeTimeInput] = useState('07:00');

  const sleepScore = 84;
  
  // Mock data for weekly chart
  const weeklyData = [
    { day: 'M', duration: 7.2, quality: 80 },
    { day: 'T', duration: 6.8, quality: 75 },
    { day: 'W', duration: 8.1, quality: 90 },
    { day: 'T', duration: 7.5, quality: 82 },
    { day: 'F', duration: 7.0, quality: 78 },
    { day: 'S', duration: 9.2, quality: 95 },
    { day: 'S', duration: 8.5, quality: 88 },
  ];

  // Load from local storage
  useEffect(() => {
    const saved = window.localStorage.getItem('aura_sleep_logs_array');
    if (saved) {
      try {
        setSleepLogs(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const calculateHours = (bed, wake) => {
    const bedParts = bed.split(':');
    const wakeParts = wake.split(':');
    if (bedParts.length !== 2 || wakeParts.length !== 2) return null;
    
    const bedH = parseInt(bedParts[0], 10);
    const bedM = parseInt(bedParts[1], 10);
    const wakeH = parseInt(wakeParts[0], 10);
    const wakeM = parseInt(wakeParts[1], 10);
    
    if (isNaN(bedH) || isNaN(bedM) || isNaN(wakeH) || isNaN(wakeM)) return null;

    const bedDecimal = bedH + (bedM / 60);
    const wakeDecimal = wakeH + (wakeM / 60);

    let diff = wakeDecimal - bedDecimal;
    if (diff <= 0) diff += 24;
    return parseFloat(diff.toFixed(1));
  };

  const handleSaveLog = () => {
    const calculatedHours = calculateHours(bedTimeInput, wakeTimeInput) || 8;
    setLogModalVisible(false);
    
    const newLog = {
      id: Date.now().toString(),
      bedTime: bedTimeInput,
      wakeTime: wakeTimeInput,
      hours: calculatedHours,
      timestamp: new Date().toISOString()
    };
    const updated = [newLog, ...sleepLogs];
    setSleepLogs(updated);
    window.localStorage.setItem('aura_sleep_logs_array', JSON.stringify(updated));
  };

  const getAggregatedData = () => {
    if (!sleepLogs || !sleepLogs.length) return null;
    const now = new Date();
    let filtered = [];
    
    if (timeframe === 'Day') {
         return sleepLogs[0]; 
    } else if (timeframe === 'Week') {
         const limit = new Date(now.setDate(now.getDate() - 7));
         filtered = sleepLogs.filter(l => new Date(l.timestamp) >= limit);
    } else if (timeframe === 'Month') {
         const limit = new Date(now.setDate(now.getDate() - 30));
         filtered = sleepLogs.filter(l => new Date(l.timestamp) >= limit);
    } else if (timeframe === 'Year') {
         const limit = new Date(now.setFullYear(now.getFullYear() - 1));
         filtered = sleepLogs.filter(l => new Date(l.timestamp) >= limit);
    }

    if (!filtered.length) return sleepLogs[0];

    const avgHours = filtered.reduce((acc, obj) => acc + obj.hours, 0) / filtered.length;
    return {
         hours: parseFloat(avgHours.toFixed(1)),
         bedTime: "--:--", 
         isAvg: true
    };
  };

  const displayData = getAggregatedData();
  const displayTime = displayData ? (displayData.isAvg ? `${displayData.hours}h` : displayData.bedTime) : "22:45";
  const subText = displayData ? (displayData.isAvg ? "AVERAGE SLEEP" : "LOGGED BED TIME") : "WIND DOWN";

  return (
    <AppShell title="sleep sanctuary">
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
              <div className={styles.scoreValue}>{sleepScore}</div>
            </div>
            <div className={styles.scoreInfo}>
              <h3>Restorative Sleep</h3>
              <p>Your quality is 12% higher than last week.</p>
            </div>
          </div>
        </section>

        {/* Tonight's Protocol */}
        <section>
          <h3 className={styles.sectionTitle}>tonight's protocol</h3>
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
                    {data.duration}h · {data.quality}%
                  </div>
                  <div 
                    className={styles.chartBar} 
                    style={{ height: `${(data.duration / 10) * 100}%` }} 
                  />
                  <div 
                    className={styles.chartDot} 
                    style={{ bottom: `${data.quality}%` }} 
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
          <div className={styles.modalContent}>
            <h3>Log Sleep Data</h3>
            <p>Input your times in HH:MM format. We will calculate the total hours automatically.</p>
            
            <div className={styles.inputGroup}>
              <label>Bed Time (e.g. 23:30)</label>
              <input 
                type="text" 
                value={bedTimeInput} 
                onChange={(e) => setBedTimeInput(e.target.value)} 
                placeholder="23:30" 
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Wake Time (e.g. 07:15)</label>
              <input 
                type="text" 
                value={wakeTimeInput} 
                onChange={(e) => setWakeTimeInput(e.target.value)} 
                placeholder="07:15" 
              />
            </div>

            {calculateHours(bedTimeInput, wakeTimeInput) !== null && (
              <div className={styles.previewText}>
                {calculateHours(bedTimeInput, wakeTimeInput)} hours total
              </div>
            )}
            
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setLogModalVisible(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSaveLog}>Save</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
