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
import AccessibleDialog from '@/components/AccessibleDialog';
import { useAuth } from '@/context/AuthContext';
import { progressCopy } from '@/lib/progress-copy.mjs';

const PRACTICE_AUDIO = {
    box_breathing: '/audio/balance-gentle-rain-loop.wav',
    '478_breathing': '/audio/sleep-brown-wind-loop.wav',
    body_scan: '/audio/focus-waterfall-loop.wav',
    '54321_grounding': '/audio/balance-gentle-rain-loop.wav',
    military_method: '/audio/sleep-brown-wind-loop.wav',
    stimulus_control: '/audio/sleep-brown-wind-loop.wav',
};

const DEFAULT_LIBRARY_CONTENT = {
    meditations: {
        box_breathing: {
            name: 'Box Breathing (4-4-4-4)',
            description: 'A paced breathing exercise that uses four equal counts.',
            steps: [
                'Exhale all the air from your lungs through your mouth.',
                'Slowly breathe in through your nose, counting to 4.',
                'Hold your breath, counting to 4.',
                'Slowly exhale through your mouth, counting to 4.',
                'Hold your breath again, counting to 4.',
                'Repeat for up to 4 cycles, without forcing any breath hold.'
            ],
            source: 'AURA educational adaptation',
            references: [{ title: 'Royal National Orthopaedic Hospital — Breathing Techniques', url: 'https://www.rnoh.nhs.uk/patients-and-visitors/patient-information-guides/breathing-techniques' }]
        },
        '478_breathing': {
            name: '4-7-8 Breathing Technique',
            description: 'A counted breathing exercise that focuses attention on the breath.',
            steps: [
                'Exhale completely through your mouth, making a soft "whoosh" sound.',
                'Close your mouth and breathe in through your nose, counting to 4.',
                'Hold your breath, counting to 7.',
                'Exhale completely through your mouth, counting to 8.',
                'Repeat the cycle three more times, for a total of four full breaths.'
            ],
            source: 'AURA educational adaptation',
            references: [{ title: 'NHS Every Mind Matters — Meditation and sleep', url: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/how-to-fall-asleep-faster-and-sleep-better/how-can-meditation-help-with-sleep/' }]
        },
        body_scan: {
            name: 'Progressive Body Scan',
            description: 'A mindfulness practice for noticing physical sensations without needing to change them.',
            steps: [
                'Sit or lie down comfortably. Close your eyes.',
                'Start at your toes and notice any tension or sensation.',
                'Move your attention to your feet, ankles, legs, and knees.',
                'Move up to your thighs, hips, and lower back.',
                'Now notice your chest, shoulders, arms, and hands.',
                'Finally, notice your neck, jaw, and forehead, then return attention to the whole body.'
            ],
            source: 'AURA educational adaptation',
            references: [{ title: 'US Department of Veterans Affairs — Body Scan', url: 'https://www.va.gov/wholehealthlibrary/passport/chapter-4.asp' }]
        },
        '54321_grounding': {
            name: '5-4-3-2-1 Grounding Method',
            description: 'A sensory attention exercise for reconnecting with the present surroundings.',
            steps: [
                'Identify 5 things you can see around you.',
                'Identify 4 things you can touch.',
                'Identify 3 sounds you hear.',
                'Identify 2 smells you notice.',
                'Identify 1 taste or something you can taste.'
            ],
            source: 'AURA educational adaptation',
            references: [{ title: 'Hampshire Hospitals NHS — 5-4-3-2-1 grounding', url: 'https://www.hampshirehospitals.nhs.uk/our-services/az-departments-and-specialties/maternity-hampshire-hospitals/baby-loss-bereavement-support/help-and-support/self-help' }]
        }
    },
    sleep_methods: {
        military_method: {
            name: 'Relaxation for Sleep',
            description: 'A gentle sequence for unwinding before sleep, without promising a specific result.',
            steps: [
                'Choose a comfortable position and let your breathing remain natural.',
                'Notice your face, jaw, and shoulders and soften any effort you can release comfortably.',
                'Move your attention through your arms, hands, legs, and feet without forcing them to relax.',
                'Picture a familiar, peaceful place or return your attention to the sound of your breathing.',
                'If thoughts appear, notice them and gently bring attention back to the exercise.'
            ],
            source: 'AURA educational adaptation',
            references: [{ title: 'NHS — Insomnia and sleep habits', url: 'https://www.nhs.uk/conditions/insomnia/' }]
        },
        stimulus_control: {
            name: 'Sleep Routine and Bed Association',
            description: 'General sleep-habit suggestions for associating bedtime with sleep.',
            steps: [
                'Use your bed only for sleep and intimacy. Do not work or watch TV in bed.',
                'Go to bed only when you are actually sleepy.',
                'If you remain awake for a while, get up and move to another quiet place instead of watching the clock.',
                'Do a quiet activity, such as reading, until you feel sleepy again.',
                'Maintain a consistent wake time every day.'
            ],
            source: 'AURA educational adaptation',
            references: [{ title: 'East London NHS Foundation Trust — CBT for insomnia', url: 'https://www.elft.nhs.uk/sites/default/files/2022-08/cbt-for-insomnia.pdf' }]
        }
    }
};

const identifiedContent = data => Object.fromEntries(Object.entries(data).map(([category, items]) => [category,
    Object.fromEntries(Object.entries(items).map(([id, item]) => [id, { ...item, practice_id: id, audioUrl: PRACTICE_AUDIO[id] || null }]))]));
export default function MeditationsPage() {
    const { t, locale } = useI18n();
    const { user } = useAuth();
    const copy = progressCopy(locale);
    const [content, setContent] = useState({ meditations: {}, sleep_methods: {} });
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeSession, setActiveSession] = useState(null);
    const [durationMinutes, setDurationMinutes] = useState(3);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const { data, error } = await api.getLibraryContent();
                if (data && Object.keys(data).length > 0) {
                    setContent(identifiedContent(data));
                } else {
                    if (error) console.warn('Library API returned error:', error);
                    setContent(identifiedContent(DEFAULT_LIBRARY_CONTENT));
                }
            } catch (err) {
                console.error('Failed to fetch library content:', err);
                setContent(identifiedContent(DEFAULT_LIBRARY_CONTENT));
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    const openModal = (item) => {
        setSelectedItem(item);
    };

    const startSession = (item) => {
        setActiveSession({ ...item, durationSeconds: durationMinutes * 60 });
        setSelectedItem(null);
    };

    const closeModal = () => {
        setSelectedItem(null);
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
                        <Card as="button" key={idx} className={styles.libraryCard} onClick={() => openModal(item)}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconCircle}>
                                    <Wind size={20} />
                                </div>
                                <div className={styles.cardInfo}>
                                    <h3>{item.name}</h3>
                                    <p>{item.description}</p>
                                </div>
                                <ChevronRight size={16} className={styles.arrowIcon} />
                            </div>
                        </Card>
                    ))}
                </div>

                <h2 className={dashboardStyles.sectionTitle} style={{ marginTop: '48px' }}>{t('meditations.sleep')}</h2>
                <div className={styles.libraryGrid}>
                    {Object.values(content?.sleep_methods || {}).map((item, idx) => (
                        <Card as="button" key={idx} className={styles.libraryCard} onClick={() => openModal(item)}>
                            <div className={styles.cardHeader}>
                                <div className={styles.iconCircle} style={{ color: "var(--aura-aurora-2)" }}>
                                    <Moon size={20} />
                                </div>
                                <div className={styles.cardInfo}>
                                    <h3>{item.name}</h3>
                                    <p>{item.description}</p>
                                </div>
                                <ChevronRight size={16} className={styles.arrowIcon} />
                            </div>
                        </Card>
                    ))}
                </div>
            </StaggeredEntrance>

            {/* Modal Detail */}
            {selectedItem && (
                <AccessibleDialog className={styles.modalContent} labelledBy="practice-detail-title" onClose={closeModal}>
                        <button className={styles.closeButton} onClick={closeModal} aria-label={copy.close}>
                            <X size={20} />
                        </button>
                        
                        <div className={styles.modalHeader}>
                            <div className={styles.modalBadge}>{t('meditations.validated')}</div>
                            <h2 id="practice-detail-title">{selectedItem?.name || ''}</h2>
                            {(selectedItem?.references || []).length > 0 && <div className={styles.sourceLabel}>
                                <Info size={14} aria-hidden="true" />
                                <span>{t('meditations.references')}</span>
                                {(selectedItem.references || []).map(reference => (
                                    <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer">{reference.title}</a>
                                ))}
                            </div>}
                        </div>

                        <div className={styles.modalBody}>
                            <p className={styles.modalDesc}>{selectedItem?.description || ''}</p>
                            <p className={styles.safetyNote}>{t('meditations.safety')}</p>
                            
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
                            <label className={styles.durationLabel}>{copy.duration}
                                <select value={durationMinutes} onChange={event => setDurationMinutes(Number(event.target.value))}>
                                    {[1, 3, 5, 10].map(minutes => <option key={minutes} value={minutes}>{minutes} min</option>)}
                                </select>
                            </label>
                            <Button variant="primary" style={{ width: '100%' }} onClick={() => startSession(selectedItem)}>
                                {t('meditations.begin')}
                            </Button>
                        </div>
                </AccessibleDialog>
            )}

            {activeSession && (
                <MeditationPlayer 
                    userId={user?.id}
                    session={activeSession} 
                    onClose={() => {
                        setActiveSession(null);
                    }} 
                />
            )}
        </AppShell>
    );
}
