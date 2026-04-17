'use client';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, ClipboardList, FileText, Loader2, Sparkles } from 'lucide-react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/dashboard/page.module.css';
import formStyles from './form.module.css';
import AppShell from '@/components/AppShell';
import Card from '@/components/Card';
import Button from '@/components/Button';

import { useI18n } from '@/i18n';
import { api } from '@/lib/api';

export default function AssessmentPage() {
    const { t } = useI18n();
    const router = useRouter();

    // States
    const [questionnaires, setQuestionnaires] = useState([]);
    const [activeForm, setActiveForm] = useState(null); 
    const [answers, setAnswers] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null); 
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const stored = (localStorage.getItem('aura_user') || sessionStorage.getItem('aura_user'));
        const user = stored ? JSON.parse(stored) : null;
        if (user) {
            setUserId(user.id);
            loadData(user.id);
        } else {
            loadData();
        }
    }, []);

    const loadData = async (uid) => {
        setLoading(true);
        try {
            const qRes = await api.listQuestionnaires();
            console.log('Questionnaires response:', qRes);
            if (qRes.data) {
                const qList = qRes.data.questionnaires || [];
                console.log('Setting questionnaires:', qList);
                setQuestionnaires(qList);
            } else if (qRes.error) {
                console.error('Error loading questionnaires:', qRes.error);
            }
            if (uid) {
                const hRes = await api.getHistory(uid);
                if (hRes.data) setHistory(hRes.data.assessments || []);
            }
        } catch (err) {
            console.error('Exception in loadData:', err);
        } finally {
            setLoading(false);
        }
    };

    const startForm = async (qId) => {
        const { data } = await api.getQuestionnaire(qId);
        if (data) {
            setActiveForm(data);
            setAnswers(new Array(data.questions.length).fill(null));
            setCurrentQ(0);
            setResult(null);
        }
    };

    const selectAnswer = (value) => {
        const newAnswers = [...answers];
        newAnswers[currentQ] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        if (!userId || answers.includes(null)) return;
        setSubmitting(true);

        const { data, error } = await api.submitAssessment(userId, activeForm.id, answers);

        if (data) {
            setResult(data);
        } else {
            setResult({ error: error || 'Submission failed' });
        }
        setSubmitting(false);
    };

    const resetForm = () => {
        setActiveForm(null);
        setAnswers([]);
        setResult(null);
        setCurrentQ(0);
        if (userId) loadData(userId);
    };

    // ── RESULT VIEW ──
    if (result) {
        return (
            <AppShell title={t('assessment.results')}>
                <div className="fade-up-stagger" style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <button onClick={resetForm} className={formStyles.backBtn} style={{ marginBottom: '32px' }}>
                        <ArrowLeft size={16} /> {t('assessment.backToList')}
                    </button>

                    {result.error ? (
                        <Card style={{ borderColor: 'var(--aura-aurora-4)' }}>
                            <AlertCircle size={32} style={{ color: 'var(--aura-aurora-4)', marginBottom: '16px' }} />
                            <p>{result.error}</p>
                        </Card>
                    ) : (
                        <>
                            <Card className={formStyles.resultCard}>
                                <div className={formStyles.scoreCircle}>
                                    <span className={formStyles.scoreValue}>{result.score_data?.total_score}</span>
                                    <span className={formStyles.scoreLabel}>{t('assessment.score')}</span>
                                </div>
                                <div className={styles.pill} style={{ background: 'rgba(123, 110, 246, 0.12)', color: 'var(--aura-aurora-1)' }}>
                                    {t(`assessment.riskLabel${result.score_data?.risk_level?.charAt(0).toUpperCase() + result.score_data?.risk_level?.slice(1)}`) || result.score_data?.risk_level?.toUpperCase()}
                                </div>
                                <p style={{ color: 'var(--aura-muted)', fontSize: 'var(--text-sm)', textAlign: 'center', marginTop: '16px', lineHeight: '1.5' }}>
                                    {t(`assessment.riskDetails${result.score_data?.risk_level?.charAt(0).toUpperCase() + result.score_data?.risk_level?.slice(1)}`)}
                                </p>
                            </Card>

                            {result.ai_summary && (
                                <Card style={{ marginTop: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--aura-aurora-1)' }}>
                                        <Sparkles size={18} />
                                        <span className="label-text" style={{ color: 'inherit' }}>{t('assessment.aiAnalysis')}</span>
                                    </div>
                                    <p style={{ color: 'var(--aura-muted)', lineHeight: '1.6', fontSize: 'var(--text-base)' }}>{result.ai_summary}</p>
                                </Card>
                            )}

                            <Button
                                variant="primary"
                                style={{ width: '100%', marginTop: '40px' }}
                                onClick={resetForm}
                            >
                                {t('assessment.done')}
                            </Button>
                        </>
                    )}
                </div>
            </AppShell>
        );
    }

    // ── FORM VIEW ──
    if (activeForm) {
        const progress = ((currentQ + 1) / activeForm.questions.length) * 100;
        const allAnswered = !answers.includes(null);

        return (
            <AppShell title={activeForm.name}>
                <div className="fade-up-stagger" style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <button onClick={resetForm} className={formStyles.backBtn} style={{ marginBottom: '32px' }}>
                        <ArrowLeft size={16} /> {t('assessment.backToList')}
                    </button>

                    <div className={formStyles.progressBar}>
                        <div className={formStyles.progressFill} style={{ width: `${progress}%`, background: 'var(--aura-gradient-primary)' }} />
                    </div>

                    <p className="label-text" style={{ marginBottom: '16px' }}>
                        {t('assessment.questionOf', { current: currentQ + 1, total: activeForm.questions.length })}
                    </p>

                    <Card className={formStyles.questionCard}>
                        <h2 style={{ fontFamily: 'var(--aura-font-serif)', fontWeight: 400, fontSize: 'var(--text-xl)', marginBottom: '32px' }}>
                            {activeForm.questions[currentQ]}
                        </h2>

                        <div className={formStyles.optionsGrid}>
                            {activeForm.options.map((opt) => (
                                <button
                                    key={opt.value}
                                    className={`${formStyles.optionBtn} ${answers[currentQ] === opt.value ? formStyles.optionSelected : ''}`}
                                    onClick={() => selectAnswer(opt.value)}
                                >
                                    <span className={formStyles.optionValue}>{opt.value}</span>
                                    <span className={formStyles.optionText}>{opt.text}</span>
                                </button>
                            ))}
                        </div>
                    </Card>

                    <div className={formStyles.navRow}>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                            disabled={currentQ === 0}
                            style={{ flex: 1 }}
                        >
                            {t('assessment.previous')}
                        </Button>

                        <Button
                            variant="primary"
                            onClick={currentQ < activeForm.questions.length - 1 ? () => setCurrentQ(currentQ + 1) : handleSubmit}
                            disabled={(currentQ < activeForm.questions.length - 1 && answers[currentQ] === null) || (currentQ === activeForm.questions.length - 1 && (!allAnswered || submitting))}
                            style={{ flex: 2 }}
                        >
                            {submitting ? (
                                <><Loader2 size={16} className={formStyles.spin} /> {t('assessment.analyzing')}</>
                            ) : (
                                currentQ < activeForm.questions.length - 1 ? t('assessment.next') : t('assessment.submit')
                            )}
                        </Button>
                    </div>

                    <div className={formStyles.dotsRow}>
                        {activeForm.questions.map((_, i) => (
                            <button
                                key={i}
                                className={`${formStyles.dot} ${i === currentQ ? formStyles.dotActive : ''} ${answers[i] !== null ? formStyles.dotAnswered : ''}`}
                                onClick={() => setCurrentQ(i)}
                            />
                        ))}
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell title={t('assessment.title')}>
            <div className="fade-up-stagger">
                <section className={styles.summarySection} style={{ marginBottom: '48px' }}>
                    <Card style={{ background: 'var(--aura-gradient-calm)', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div className={styles.iconCircle} style={{ background: 'var(--bg-pill)', color: 'white' }}>
                                <ClipboardList size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontFamily: 'var(--aura-font-serif)', fontSize: 'var(--text-xl)', color: 'white' }}>{t('assessment.howDeep')}</h2>
                                <p style={{ color: 'var(--bg-pill)', fontSize: 'var(--text-sm)' }}>{t('assessment.reflectSubtitle')}</p>
                            </div>
                        </div>
                    </Card>
                </section>

                <h2 className={styles.sectionTitle}>{t('assessment.available')}</h2>
                <div className={styles.dashboardGrid}>
                    {questionnaires.map((q) => (
                        <Card key={q.id} className={styles.actionCard} onClick={() => startForm(q.id)}>
                            <div className={styles.actionIcon}>
                                <ClipboardList size={20} />
                            </div>
                            <div className={styles.actionContent}>
                                <h3>{q.name}</h3>
                                <p>{q.description}</p>
                            </div>
                            <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--aura-ghost)' }} />
                        </Card>
                    ))}
                </div>

                {history.length > 0 && (
                    <>
                        <h2 className={styles.sectionTitle}>{t('assessment.history')}</h2>
                        <div className={styles.dashboardGrid}>
                            {history.slice(0, 4).map((h, i) => (
                                <Card key={i} className={styles.actionCard}>
                                    <div className={styles.actionIcon} style={{ color: 'var(--aura-aurora-3)' }}>
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div className={styles.actionContent}>
                                        <h3>{h.questionnaire}</h3>
                                        <p>{t('assessment.scoreLabel', { score: h.total_score, risk: h.risk_level })}</p>
                                    </div>
                                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                        <span className="label-text" style={{ fontSize: '10px' }}>{new Date(h.created_at).toLocaleDateString()}</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
}
