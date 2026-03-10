'use client';

import Link from "next/link";
import AuraLogo from "@/components/AuraLogo";
import styles from "./page.module.css";
import Button from "@/components/Button";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n";
import { ClipboardCheck, MessageCircleHeart, Wind, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <main className={styles.main}>
      <header className={styles.topNav}>
        <div className={styles.logoWrapper}>
          <AuraLogo size={48} />
          <span className={styles.logoText}>AURA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
          <div className={styles.badge}>{t('app.tagline')}</div>
          <h1 className={styles.title}>
            {t('landing.heroTitle')}
          </h1>
          <p className={styles.subtitle}>
            {t('landing.heroSubtitle')}
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/login" className={styles.ctaButton}>
              {t('landing.cta')} <ArrowRight size={20} style={{ marginLeft: '8px' }} />
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
              <ClipboardCheck size={28} />
            </div>
            <h3>{t('landing.feature1Title')}</h3>
            <p>{t('landing.feature1Desc')}</p>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.iconCircle}>
              <MessageCircleHeart size={28} />
            </div>
            <h3>{t('landing.feature2Title')}</h3>
            <p>{t('landing.feature2Desc')}</p>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.iconCircle}>
              <Wind size={28} />
            </div>
            <h3>{t('landing.feature3Title')}</h3>
            <p>{t('landing.feature3Desc')}</p>
          </div>
        </div>
      </section>

      <footer style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
        © {new Date().getFullYear()} AURA Health. Created with care for your mind.
      </footer>
    </main>
  );
}
