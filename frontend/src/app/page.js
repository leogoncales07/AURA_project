'use client';
import { ArrowRight, ClipboardCheck, MessageCircleHeart, Wind } from 'lucide-react';

import Link from "next/link";
import AuraLogo from "@/components/AuraLogo";
import styles from "./page.module.css";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n";

import { useEffect, useState } from "react";

export default function LandingPage() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className={styles.main}>
      <header className={`${styles.topNav} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.logoWrapper}>
          <AuraLogo size={40} />
          <span className={styles.logoText}>AURA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <LanguageSwitcher />
          <ThemeToggle />
          <Link href="/login" passHref className={styles.loginLink}>
            {t('landing.login')}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`${styles.heroContent} fade-up-stagger`}>
          <div className={styles.badge}>{t('app.tagline')}</div>
          <h1 className={styles.title}>
            {t('landing.heroTitle')}
          </h1>
          <p className={styles.subtitle}>
            {t('landing.heroSubtitle')}
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/login" className={styles.ctaButton}>
              {t('landing.cta')} <ArrowRight size={18} style={{ marginLeft: '12px' }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features} id="features">
        <div className={`${styles.featuresHeader} fade-up-stagger`}>
          <h2 className={styles.sectionTitle}>{t('landing.featuresTitle')}</h2>
          <p className={styles.sectionSubtitle}>{t('landing.featuresSubtitle')}</p>
        </div>

        <div className={styles.grid}>
          <div className={`${styles.featureItem} fade-up-stagger`} style={{ animationDelay: '100ms' }}>
            <div className={styles.iconCircle}>
              <ClipboardCheck size={24} />
            </div>
            <h3>{t('landing.feature1Title')}</h3>
            <p>{t('landing.feature1Desc')}</p>
          </div>

          <div className={`${styles.featureItem} fade-up-stagger`} style={{ animationDelay: '200ms' }}>
            <div className={styles.iconCircle}>
              <MessageCircleHeart size={24} />
            </div>
            <h3>{t('landing.feature2Title')}</h3>
            <p>{t('landing.feature2Desc')}</p>
          </div>

          <div className={`${styles.featureItem} fade-up-stagger`} style={{ animationDelay: '300ms' }}>
            <div className={styles.iconCircle}>
              <Wind size={24} />
            </div>
            <h3>{t('landing.feature3Title')}</h3>
            <p>{t('landing.feature3Desc')}</p>
          </div>
        </div>
      </section>

      <footer style={{ 
        padding: '80px 40px', 
        textAlign: 'center', 
        color: 'var(--aura-muted)', 
        fontSize: 'var(--text-xs)', 
        letterSpacing: '0.02em',
        borderTop: '1px solid var(--aura-border)',
        width: '100%',
        maxWidth: '1200px'
      }}>
        <div className="label-text" style={{ marginBottom: '16px' }}>{t('landing.footer')}</div>
        © {new Date().getFullYear()} AURA Wellness.
      </footer>
    </main>
  );
}
