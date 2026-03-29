'use client';
import { Activity, ChevronRight, Info, Moon, PlayCircle, Wind, X } from 'lucide-react';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import dashboardStyles from '@/app/dashboard/page.module.css';
import AppShell from '@/components/AppShell';
import Card from '@/components/Card';
import Button from '@/components/Button';

import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import MeditationPlayer from '@/components/MeditationPlayer';
import StaggeredEntrance from '@/components/StaggeredEntrance';

const DEFAULT_LIBRARY_CONTENT = {
    meditations: {
        box_breathing: {
            name: 'Box Breathing (4-4-4-4)',
            description: 'A simple exercise to calm your nervous system.',
            steps: [
                'Exhale all the air from your lungs through your mouth.',
                'Slowly breathe in through your nose, counting to 4.',
                'Hold your breath, counting to 4.',
                'Slowly exhale through your mouth, counting to 4.',
                'Hold your breath again, counting to 4.',
                'Repeat for 4 cycles or until you feel calmer.'
            ],
            source: 'Mayo Clinic'
        },
        '478_breathing': {
            name: '4-7-8 Breathing Technique',
            description: 'Deep breathing that reduces anxiety and slows your body down.',
            steps: [
                'Exhale completely through your mouth, making a soft "whoosh" sound.',
                'Close your mouth and breathe in through your nose, counting to 4.',
                'Hold your breath, counting to 7.',
                'Exhale completely through your mouth, counting to 8.',
                'Repeat the cycle three more times, for a total of four full breaths.'
            ],
            source: 'Harvard Health'
        },
        body_scan: {
            name: 'Progressive Body Scan',
            description: 'Mindfulness practice to notice physical sensations and relax.',
            steps: [
                'Sit or lie down comfortably. Close your eyes.',
                'Start at your toes and notice any tension or sensation.',
                'Move your attention to your feet, ankles, legs, and knees.',
                'Move up to your thighs, hips, and lower back.',
                'Now notice your chest, shoulders, arms, and hands.',
                'Finally, feel your neck, jaw, and forehead. Let the tension dissolve.'
            ],
            source: 'Mayo Clinic'
        },
        '54321_grounding': {
            name: '5-4-3-2-1 Grounding Method',
            description: 'Helps calm anxiety by focusing on the present moment.',
            steps: [
                'Identify 5 things you can see around you.',
                'Identify 4 things you can touch.',
                'Identify 3 sounds you hear.',
                'Identify 2 smells you notice.',
                'Identify 1 taste or something you can taste.'
            ],
            source: 'Mayo Clinic Health System'
        }
    },
    sleep_methods: {
        military_method: {
            name: 'Military Sleep Method',
            description: 'Technique to fall asleep quickly with body and mental relaxation.',
            steps: [
                'Relax your entire face, including forehead, eyelids, jaw, and tongue.',
                'Drop your shoulders as much as possible. Relax your upper and lower arms.',
                'Exhale and relax your chest.',
                'Relax your legs, thighs, calves, ankles, and feet.',
                'Clear your mind for 10 seconds by imagining a calm scene, like a still lake.',
                'If thoughts arise, tell yourself "do not think, do not think, do not think" for 10 seconds.'
            ],
            source: 'Sleep Foundation'
        },
        stimulus_control: {
            name: 'Stimulus Control Therapy',
            description: 'Strategies to strengthen the association between bed and sleep.',
            steps: [
                'Use your bed only for sleep and intimacy. Do not work or watch TV in bed.',
                'Go to bed only when you are actually sleepy.',
                'If you don\'t fall asleep in 20 minutes, get up and move to another room.',
                'Do a quiet activity, such as reading, until you feel sleepy again.',
                'Maintain a consistent wake time every day.'
            ],
            source: 'Mayo Clinic'
        }
    }
};

export default function MeditationsPage() {
    const { t } = useI18n();
    const [content, setContent] = useState({ meditations: {}, sleep_methods: {} });
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeSession, setActiveSession] = useState(null);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const { data, error } = await api.getLibraryContent();
                if (data && Object.keys(data).length > 0) {
                    setContent(data);
                } else {
                    if (error) console.warn('Library API returned error:', error);
                    setContent(DEFAULT_LIBRARY_CONTENT);
                }
            } catch (err) {
                console.error('Failed to fetch library content:', err);
                setContent(DEFAULT_LIBRARY_CONTENT);
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
                            <span className="label-text" style={{ color: 'rgba(255, 255, 255, 0.85)', marginBottom: '16px', display: 'block' }}>
                                {t('meditations.recommended')}
                            </span>
                            <h2 style={{ 
                                fontFamily: 'var(--aura-font-serif)', 
                                fontSize: 'var(--text-2xl)', 
                                color: 'white',
                                marginBottom: '12px',
                                fontWeight: 400
                            }}>
                                {content?.meditations?.box_breathing?.name || t('meditations.featuredTitle')}
                            </h2>
                            <p style={{ fontSize: 'var(--text-base)', color: 'rgba(255, 255, 255, 0.82)', marginBottom: '32px', lineHeight: '1.6' }}>
                                {content?.meditations?.box_breathing?.description || t('meditations.featuredDesc')}
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
                    {Object.values(content?.meditations || {}).map((item, idx) => (
                        <Card key={idx} className={styles.libraryCard} onClick={() => openModal(item)}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconCircle}>
                                    <Wind size={20} />
                                </div>
                                <div className={styles.cardInfo}>
                                    <h3>{item.name}</h3>
                                    <p>{item.source}</p>
                                </div>
                                <ChevronRight size={16} className={styles.arrowIcon} />
                            </div>
                        </Card>
                    ))}
                </div>

                <h2 className={dashboardStyles.sectionTitle} style={{ marginTop: '48px' }}>{t('meditations.sleep')}</h2>
                <div className={styles.libraryGrid}>
                    {Object.values(content?.sleep_methods || {}).map((item, idx) => (
                        <Card key={idx} className={styles.libraryCard} onClick={() => openModal(item)}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconCircle} style={{ color: "var(--aura-aurora-2)" }}>
                                    <Moon size={20} />
                                </div>
                                <div className={styles.cardInfo}>
                                    <h3>{item.name}</h3>
                                    <p>{item.source}</p>
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
                            <h2>{selectedItem?.name || ''}</h2>
                            <p className={styles.sourceLabel}>
                                <Info size={14} /> {t('meditations.source', { source: selectedItem?.source || '' })}
                            </p>
                        </div>

                        <div className={styles.modalBody}>
                            <p className={styles.modalDesc}>{selectedItem?.description || ''}</p>
                            
                            <div className={styles.stepsContainer}>
                                <h3>{t('meditations.followGuide')}</h3>
                                <ul className={styles.stepsList}>
                                    {(selectedItem?.steps || []).map((step, i) => (
                                        <li key={i}>
                                            <span className={styles.stepNumber}>{i + 1}</span>
                                            <p>{step}</p>
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
