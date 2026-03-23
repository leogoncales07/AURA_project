'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './AuraScoreReveal.module.css';

/**
 * AuraScoreReveal - A premium score reveal with synchronized arc, counter, and pulse.
 */
export default function AuraScoreReveal({ score = 0, size = 140 }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [offset, setOffset] = useState(283); // Full circumference approx
  const [isPulsing, setIsPulsing] = useState(false);
  const hasAnimated = useRef(false);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  // Easing function: cubic-bezier(0.16, 1, 0.3, 1) approx (easeOutQuart)
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

  useEffect(() => {
    if (hasAnimated.current) return;
    
    let startTime;
    const duration = 900;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedT = easeOutQuart(progress);
      
      // Update number
      setDisplayScore(Math.round(easedT * score));
      
      // Update arc
      const currentOffset = circumference * (1 - (easedT * score) / 100);
      setOffset(currentOffset);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete, fire pulse
        setTimeout(() => setIsPulsing(true), 50);
        hasAnimated.current = true;
      }
    };

    requestAnimationFrame(animate);
  }, [score, circumference]);

  return (
    <div className={styles.container} style={{ width: size, height: size }}>
      <div className={`${styles.scoreWrapper} ${isPulsing ? styles.pulsing : ''}`}>
        <svg className={styles.svg} viewBox="0 0 100 100">
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--aura-aurora-1)" />
              <stop offset="100%" stopColor="var(--aura-aurora-3)" />
            </linearGradient>
          </defs>
          
          <circle 
            className={styles.backgroundCircle} 
            cx="50" cy="50" r={radius} 
          />
          
          <circle 
            className={styles.foregroundArc} 
            cx="50" cy="50" r={radius} 
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        
        <div className={styles.number}>
          {displayScore}
        </div>
      </div>
    </div>
  );
}
