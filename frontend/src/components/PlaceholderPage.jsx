import styles from '@/app/dashboard/page.module.css'; // Reusing dashboard container styles for consistency
import BottomNav from '@/components/BottomNav';
import Card from '@/components/Card';
import Badge from '@/components/Badge';

export default function PlaceholderPage({ title, description, icon, badgeColor = "mint", badgeText = "Em Breve" }) {
    return (
        <div className={styles.appContainer}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.greeting}>{title}</h1>
                </div>
            </header>

            <main className={styles.mainContent}>
                <section className={styles.summarySection}>
                    <Card className={styles.emotionCard} glass>
                        <div className={styles.emotionRow}>
                            <div className={styles.emotionItem}>
                                <span className={styles.emoji}>{icon}</span>
                                <span>{description}</span>
                            </div>
                            <Badge color={badgeColor}>{badgeText}</Badge>
                        </div>
                    </Card>
                </section>

                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-light)' }}>
                    <p>Esta funcionalidade está a ser desenvolvida e estará disponível brevemente.</p>
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
