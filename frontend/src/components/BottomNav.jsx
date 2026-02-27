import Link from 'next/link';
import { Home, ClipboardList, MessageCircle, Wind, BarChart2 } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
    return (
        <nav className={styles.navBar}>
            <ul className={styles.navList}>
                <li>
                    <Link href="/dashboard" className={styles.navItem}>
                        <Home className={styles.icon} strokeWidth={2} size={24} />
                        <span>Início</span>
                    </Link>
                </li>
                <li>
                    <Link href="/assessment" className={styles.navItem}>
                        <ClipboardList className={styles.icon} strokeWidth={2} size={24} />
                        <span>Testes</span>
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
                        <span>Pausar</span>
                    </Link>
                </li>
                <li>
                    <Link href="/reports" className={styles.navItem}>
                        <BarChart2 className={styles.icon} strokeWidth={2} size={24} />
                        <span>Progresso</span>
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
