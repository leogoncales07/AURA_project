'use client';

import Link from "next/link";
import styles from "./page.module.css";
import Button from "@/components/Button";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n";

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <main className={styles.main}>
      <header className={styles.topNav}>
        <div className={styles.logo}>AURA</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguageSwitcher />
          <ThemeToggle />
          <Link href="/login" passHref className={styles.loginLink}>
            {t('landing.login')}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            {t('landing.heroTitle')}
          </h1>
          <p className={styles.subtitle}>
            {t('landing.heroSubtitle')}
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/login" passHref>
              <Button variant="primary" size="lg">{t('landing.cta')}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features} id="features">
        <div className={styles.featuresHeader}>
          <h2 className={styles.sectionTitle}>{t('landing.featuresTitle')}</h2>
          <p className={styles.sectionSubtitle}>{t('landing.featuresSubtitle')}</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.featureItem}>
            <div className={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
              </svg>
            </div>
            <h3>{t('landing.feature1Title')}</h3>
            <p>{t('landing.feature1Desc')}</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>{t('landing.feature2Title')}</h3>
            <p>{t('landing.feature2Desc')}</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8M12 8v8" />
              </svg>
            </div>
            <h3>{t('landing.feature3Title')}</h3>
            <p>{t('landing.feature3Desc')}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
