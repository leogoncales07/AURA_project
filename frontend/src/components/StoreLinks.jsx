'use client';

import { ExternalLink, Smartphone } from 'lucide-react';
import { useI18n } from '@/i18n';
import styles from '@/app/page.module.css';

function verifiedStoreUrl(value, hostname) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === hostname ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function StoreLinks() {
  const { t } = useI18n();
  const stores = [
    {
      name: 'Google Play',
      href: verifiedStoreUrl(process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL, 'play.google.com'),
    },
    {
      name: 'App Store',
      href: verifiedStoreUrl(process.env.NEXT_PUBLIC_APP_STORE_URL, 'apps.apple.com'),
    },
  ].filter(store => store.href);

  return (
    <section className={styles.mobileApps} aria-labelledby="mobile-apps-title">
      <div className={styles.storeIcon} aria-hidden="true"><Smartphone size={28} /></div>
      <h2 id="mobile-apps-title" className={styles.sectionTitle}>{t('landing.mobileTitle')}</h2>
      <p className={styles.sectionSubtitle}>
        {stores.length ? t('landing.mobileSubtitle') : t('landing.mobileComingSoon')}
      </p>
      {stores.length > 0 && (
        <div className={styles.storeLinks}>
          {stores.map(store => (
            <a
              key={store.name}
              className={styles.storeLink}
              href={store.href}
              target="_blank"
              rel="noreferrer"
            >
              {store.name}<ExternalLink size={16} aria-hidden="true" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
