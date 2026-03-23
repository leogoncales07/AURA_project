'use client';
import { Activity, ChevronRight, Info, Moon, PlayCircle, Wind, X } from 'lucide-react';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import dashboardStyles from '@/app/dashboard/page.module.css';
import AppShell from '@/components/AppShell';
import Card from '@/components/Card';
import Button from '@/components/Button';

import { useI18n } from '@/i18n';
import MeditationPlayer from '@/components/MeditationPlayer';
import StaggeredEntrance from '@/components/StaggeredEntrance';

export default function MeditationsPage() {
    const { t } = useI18n();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeSession, setActiveSession] = useState(null);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const res = await fetch(`${apiUrl}/library/content`);
                const data = await res.json();
                setContent(data);
            } catch (err) {
                console.error("Failed to fetch library content:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    const openModal = (item) => {
        setSelectedItem(item);
        document.body.style.overflow = 'hidden';
    };

    const startSession = (item) => {
        setActiveSession(item);
        setSelectedItem(null);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setSelectedItem(null);
        document.body.style.overflow = 'auto';
    };

    if (loading) {
        return (
            <AppShell title="overseeing your aura..." showSidebar={true}>
                <div className={dashboardStyles.loadingGrid}>
                    <div className={`${dashboardStyles.loadingItem} shimmer`} style={{ gridColumn: 'span 12', height: '240px' }} />
                    <div className={`${dashboardStyles.loadingItem} shimmer`} style={{ gridColumn: 'span 4', height: '140px' }} />
                    <div className={`${dashboardStyles.loadingItem} shimmer`} style={{ gridColumn: 'span 4', height: '140px' }} />
                    <div className={`${dashboardStyles.loadingItem} shimmer`} style={{ gridColumn: 'span 4', height: '140px' }} />
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell title={t('meditations.title')}>
            <StaggeredEntrance>
                {/* Featured Section */}
                <section style={{ marginBottom: '48px' }}>
                    <Card style={{ 
                        background: 'var(--aura-gradient-calm)', 
                        border: 'none', 
                        position: 'relative', 
                        overflow: 'hidden',
                        padding: '48px'
                    }}>
                        <div style={{ position: 'relative', zIndex: 1, maxWidth: '440px' }}>
                            <span className="label-text" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px', display: 'block' }}>
                                {t('meditations.recommended')}
                            </span>
                            <h2 style={{ 
                                fontFamily: 'var(--font-fraunces)', 
                                fontSize: 'var(--text-2xl)', 
                                color: 'white',
                                marginBottom: '12px',
                                fontWeight: 400
                            }}>
                                {content?.meditations?.box_breathing?.name.toLowerCase() || t('meditations.featuredTitle')}
                            </h2>
                            <p style={{ fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.8)', marginBottom: '32px', lineHeight: '1.6' }}>
                                {content?.meditations?.box_breathing?.description.toLowerCase() || t('meditations.featuredDesc')}
                            </p>
                            <Button 
                                onClick={() => openModal(content?.meditations?.box_breathing)}
                                variant="primary"
                                style={{ background: 'white', color: 'var(--aura-aurora-3)', boxShadow: 'none' }}
                            >
                                <PlayCircle size={18} style={{ marginRight: '8px' }} /> {t('meditations.start')}
                            </Button>
                        </div>
                        <Wind size={200} style={{ position: 'absolute', right: '-40px', bottom: '-40px', opacity: 0.15, color: 'white' }} />
                    </Card>
                </section>

                {/* Library Sections */}
                <h2 className={dashboardStyles.sectionTitle}>{t('meditations.sessions')}</h2>
                <div className={styles.libraryGrid}>
                    {content && Object.values(content.meditations).map((item, idx) => (
                        <Card key={idx} className={styles.libraryCard} onClick={() => openModal(item)}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconCircle}>
                                    <Wind size={20} />
                                </div>
                                <div className={styles.cardInfo}>
                                    <h3>{item.name.toLowerCase()}</h3>
                                    <p>{item.source.toLowerCase()}</p>
                                </div>
                                <ChevronRight size={16} className={styles.arrowIcon} />
                            </div>
                        </Card>
                    ))}
                </div>

                <h2 className={dashboardStyles.sectionTitle} style={{ marginTop: '48px' }}>{t('meditations.sleep')}</h2>
                <div className={styles.libraryGrid}>
                    {content && Object.values(content.sleep_methods).map((item, idx) => (
                        <Card key={idx} className={styles.libraryCard} onClick={() => openModal(item)}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconCircle} style={{ color: "var(--aura-aurora-2)" }}>
                                    <Moon size={20} />
                                </div>
                                <div className={styles.cardInfo}>
                                    <h3>{item.name.toLowerCase()}</h3>
                                    <p>{item.source.toLowerCase()}</p>
                                </div>
                                <ChevronRight size={16} className={styles.arrowIcon} />
                            </div>
                        </Card>
                    ))}
                </div>
            </StaggeredEntrance>

            {/* Modal Detail */}
            {selectedItem && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={`${styles.modalContent} fade-up-stagger`} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeButton} onClick={closeModal}>
                            <X size={20} />
                        </button>
                        
                        <div className={styles.modalHeader}>
                            <div className={styles.modalBadge}>{t('meditations.validated')}</div>
                            <h2>{selectedItem.name.toLowerCase()}</h2>
                            <p className={styles.sourceLabel}>
                                <Info size={14} /> {t('meditations.source', { source: selectedItem.source.toLowerCase() })}
                            </p>
                        </div>

                        <div className={styles.modalBody}>
                            <p className={styles.modalDesc}>{selectedItem.description.toLowerCase()}</p>
                            
                            <div className={styles.stepsContainer}>
                                <h3>{t('meditations.followGuide')}</h3>
                                <ul className={styles.stepsList}>
                                    {selectedItem.steps.map((step, i) => (
                                        <li key={i}>
                                            <span className={styles.stepNumber}>{i + 1}</span>
                                            <p>{step.toLowerCase()}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <Button variant="primary" style={{ width: '100%' }} onClick={() => startSession(selectedItem)}>
                                {t('meditations.begin')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {activeSession && (
                <MeditationPlayer 
                    session={activeSession} 
                    onClose={() => {
                        setActiveSession(null);
                        document.body.style.overflow = 'auto';
                    }} 
                />
            )}
        </AppShell>
    );
}
