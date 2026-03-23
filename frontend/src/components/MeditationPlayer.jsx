'use client';
import { Pause, Play, RotateCcw, RotateCw, X } from 'lucide-react';

import { useState, useEffect, useRef } from 'react';
import styles from './MeditationPlayer.module.css';

import AuroraBackground from './AuroraBackground';
import { useI18n } from '@/i18n';

/**
 * MeditationPlayer - A premium, full-screen breathing and meditation experience.
 */
export default function MeditationPlayer({ session, onClose }) {
  const { t } = useI18n();
  const [isPlaying, setIsPlaying] = useState(true);
  const [phase, setPhase] = useState('inhale'); // inhale, hold, exhale, reset
  const [phaseTime, setPhaseTime] = useState(4);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const sessionDuration = 300; // 5 mins in seconds

  const timerRef = useRef(null);
  const phaseTimerRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTotalSeconds(prev => prev + 1);
      }, 1000);

      phaseTimerRef.current = setInterval(() => {
        setPhaseTime(prev => {
          if (prev <= 1) {
            // Switch phases
            setPhase(current => {
              if (current === 'inhale') return 'hold_in';
              if (current === 'hold_in') return 'exhale';
              if (current === 'exhale') return 'hold_out';
              return 'inhale';
            });
            return 4; // Reset phase clock
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      clearInterval(phaseTimerRef.current);
    }

    return () => {
      clearInterval(timerRef.current);
      clearInterval(phaseTimerRef.current);
    };
  }, [isPlaying]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseText = () => {
    switch(phase) {
      case 'inhale': return `${t('meditations.inhale')} · ${phaseTime}s`;
      case 'hold_in': return `${t('meditations.hold')} · ${phaseTime}s`;
      case 'exhale': return `${t('meditations.exhale')} · ${phaseTime}s`;
      case 'hold_out': return `${t('meditations.rest')} · ${phaseTime}s`;
      default: return '';
    }
  };

  // Mock waveform animation
  const bars = Array.from({ length: 40 }).map((_, i) => (
    <div 
      key={i} 
      className={`${styles.waveBar} ${i / 40 < totalSeconds / sessionDuration ? styles.waveBarActive : ''}`}
      style={{ height: `${30 + Math.sin(i * 0.5 + totalSeconds) * 40}%` }}
    />
  ));

  return (
    <div className={styles.overlay}>
      <div className={styles.background}>
        <AuroraBackground />
      </div>

      <header className={styles.header}>
        <div className={styles.sessionInfo}>
          <span className={styles.sessionLabel}>{t('meditations.inProgress')}</span>
          <h2 className={styles.sessionTitle}>{session?.name?.toLowerCase() || t('meditations.session')}</h2>
        </div>
        <button className={styles.exitButton} onClick={onClose}>
          <X size={20} />
        </button>
      </header>

      <div className={styles.playerCore}>
        <div className={styles.guideContainer}>
          <div className={`${styles.breathingCircle} ${phase === 'inhale' ? styles.expanding : phase === 'exhale' ? styles.contracting : ''}`} />
        </div>
        
        <div className={styles.phaseInfo}>
          <span className={styles.phaseLabel}>{getPhaseText()}</span>
        </div>
      </div>

      <div className={styles.controlsWrapper}>
        <div className={styles.progressContainer}>
           <div className={styles.waveform}>
              {bars}
           </div>
           <div className={styles.timeInfo}>
              <span>{formatTime(totalSeconds)}</span>
              <span>{formatTime(sessionDuration)}</span>
           </div>
        </div>

        <div className={styles.mainControls}>
          <button className={styles.navButton} onClick={() => setTotalSeconds(Math.max(0, totalSeconds - 10))}>
            <RotateCcw size={24} />
          </button>
          
          <button 
            className={styles.playPauseButton} 
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" style={{ marginLeft: '4px' }} />}
          </button>

          <button className={styles.navButton} onClick={() => setTotalSeconds(Math.min(sessionDuration, totalSeconds + 10))}>
            <RotateCw size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
