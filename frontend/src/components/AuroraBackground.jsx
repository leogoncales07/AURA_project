'use client';

import React from 'react';
import styles from './AuroraBackground.module.css';

/**
 * AuroraBackground - A premium mesh gradient background.
 * Uses hardware-accelerated CSS transforms and radial gradients.
 */
export default function AuroraBackground() {
  return (
    <div className={styles.container} aria-hidden="true">
      <div className={styles.orbContainer}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
        <div className={`${styles.orb} ${styles.orb4}`} />
      </div>
      <div className={styles.grain} />
    </div>
  );
}
