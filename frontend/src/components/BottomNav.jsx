'use client';
import { BarChart2, ClipboardList, Home, MessageCircle, Wind } from 'lucide-react';

import Link from 'next/link';

import styles from './BottomNav.module.css';
import { useI18n } from '@/i18n';

export default function BottomNav() {
    const { t } = useI18n();

    return (
        <nav className={styles.navBar}>
            <ul className={styles.navList}>
                <li>
                    <Link href="/dashboard" className={styles.navItem}>
                        <Home className={styles.icon} strokeWidth={2} size={24} />
                        <span>{t('nav.home')}</span>
                    </Link>
                </li>
                <li>
                    <Link href="/inqueritos" className={styles.navItem}>
                        <ClipboardList className={styles.icon} strokeWidth={2} size={24} />
                        <span>{t('nav.tests')}</span>
                    </Link>
                </li>
                <li>
                    <Link href="/chat" className={`${styles.navItem} ${styles.navItemActive}`}>
                        <div className={styles.centralButton}>
                            <MessageCircle className={styles.iconWhite} strokeWidth={2} size={32} />
                        </div>
                    </Link>
                </li>
                <li>
                    <Link href="/meditations" className={styles.navItem}>
                        <Wind className={styles.icon} strokeWidth={2} size={24} />
                        <span>{t('nav.pause')}</span>
                    </Link>
                </li>
                <li>
                    <Link href="/reports" className={styles.navItem}>
                        <BarChart2 className={styles.icon} strokeWidth={2} size={24} />
                        <span>{t('nav.progress')}</span>
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
