'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/dashboard/page.module.css';
import formStyles from './form.module.css';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ClipboardList, FileText, CheckCircle2, ChevronRight, AlertCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';

export default function AssessmentPage() {
    const { t, locale } = useI18n();
    const router = useRouter();

    // States
    const [questionnaires, setQuestionnaires] = useState([]);
    const [activeForm, setActiveForm] = useState(null); // null = list view, object = form view
    const [answers, setAnswers] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null); // holds AI summary after submission
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('aura_user');
        if (stored) {
            const user = JSON.parse(stored);
            setUserId(user.id);
            loadData(user.id);
        }
    }, []);

    const loadData = async (uid) => {
        setLoading(true);
        const [qRes, hRes] = await Promise.all([
            api.listQuestionnaires(),
            api.getHistory(uid),
        ]);
        if (qRes.data) setQuestionnaires(qRes.data.questionnaires || []);
        if (hRes.data) setHistory(hRes.data.assessments || []);
        setLoading(false);
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

        // Auto-advance after a brief delay
        setTimeout(() => {
            if (currentQ < activeForm.questions.length - 1) {
                setCurrentQ(currentQ + 1);
            }
        }, 300);
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
            <div className={styles.appContainer}>
                <header className={styles.header}>
                    <div className={styles.headerTop}>
                        <button onClick={resetForm} className={formStyles.backBtn}>
                            <ArrowLeft size={20} /> {t('assessment.backToList')}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <LanguageSwitcher />
                            <ThemeToggle />
                        </div>
                    </div>
                    <h1 className={styles.greeting}>{t('assessment.results')}</h1>
                </header>

                <main className={styles.mainContent}>
                    {result.error ? (
                        <div className={formStyles.resultCard} style={{ borderColor: 'var(--color-accent-pink)' }}>
                            <AlertCircle size={32} style={{ color: 'var(--color-accent-pink)' }} />
                            <p>{result.error}</p>
                        </div>
                    ) : (
                        <>
                            <div className={formStyles.resultCard}>
                                <div className={formStyles.scoreCircle}>
                                    <span className={formStyles.scoreValue}>{result.score_data?.total_score}</span>
                                    <span className={formStyles.scoreLabel}>{t('assessment.score')}</span>
                                </div>
                                <div className={formStyles.riskBadge} data-risk={result.score_data?.risk_level}>
                                    {result.score_data?.risk_level?.toUpperCase()}
                                </div>
                            </div>

                            {result.ai_summary && (
                                <div className={formStyles.aiSummaryCard}>
                                    <div className={formStyles.aiSummaryHeader}>
                                        <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                                        <span>{t('assessment.aiAnalysis')}</span>
                                    </div>
                                    <p className={formStyles.aiSummaryText}>{result.ai_summary}</p>
                                </div>
                            )}

                            <button className={formStyles.doneBtn} onClick={resetForm}>
                                {t('assessment.done')}
                            </button>
                        </>
                    )}
                </main>

                <BottomNav />
            </div>
        );
    }

    // ── FORM VIEW ──
    if (activeForm) {
        const progress = ((currentQ + 1) / activeForm.questions.length) * 100;
        const allAnswered = !answers.includes(null);

        return (
            <div className={styles.appContainer}>
                <header className={styles.header}>
                    <div className={styles.headerTop}>
                        <button onClick={resetForm} className={formStyles.backBtn}>
                            <ArrowLeft size={20} /> {t('assessment.backToList')}
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <LanguageSwitcher />
                            <ThemeToggle />
                        </div>
                    </div>
                    <h1 className={styles.greeting}>{activeForm.name}</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                        {t('assessment.questionOf', { current: currentQ + 1, total: activeForm.questions.length })}
                    </p>
                </header>

                <main className={styles.mainContent}>
                    {/* Progress bar */}
                    <div className={formStyles.progressBar}>
                        <div className={formStyles.progressFill} style={{ width: `${progress}%` }} />
                    </div>

                    {/* Question */}
                    <div className={formStyles.questionCard}>
                        <p className={formStyles.questionText}>{activeForm.questions[currentQ]}</p>

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
                    </div>

                    {/* Navigation */}
                    <div className={formStyles.navRow}>
                        <button
                            className={formStyles.navBtn}
                            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                            disabled={currentQ === 0}
                        >
                            {t('assessment.previous')}
                        </button>

                        {currentQ < activeForm.questions.length - 1 ? (
                            <button
                                className={`${formStyles.navBtn} ${formStyles.navBtnPrimary}`}
                                onClick={() => setCurrentQ(currentQ + 1)}
                                disabled={answers[currentQ] === null}
                            >
                                {t('assessment.next')}
                            </button>
                        ) : (
                            <button
                                className={`${formStyles.navBtn} ${formStyles.navBtnPrimary}`}
                                onClick={handleSubmit}
                                disabled={!allAnswered || submitting}
                            >
                                {submitting ? (
                                    <><Loader2 size={16} className={formStyles.spin} /> {t('assessment.analyzing')}</>
                                ) : (
                                    t('assessment.submit')
                                )}
                            </button>
                        )}
                    </div>

                    {/* Question dots */}
                    <div className={formStyles.dotsRow}>
                        {activeForm.questions.map((_, i) => (
                            <button
                                key={i}
                                className={`${formStyles.dot} ${i === currentQ ? formStyles.dotActive : ''} ${answers[i] !== null ? formStyles.dotAnswered : ''}`}
                                onClick={() => setCurrentQ(i)}
                            />
                        ))}
                    </div>
                </main>

                <BottomNav />
            </div>
        );
    }

    // ── LIST VIEW ──
    return (
        <div className={styles.appContainer}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClipboardList size={20} style={{ color: 'var(--color-primary)' }} />
                        <div className={styles.date}>{t('assessment.headerLabel')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </div>
                <h1 className={styles.greeting}>{t('assessment.title')}</h1>
            </header>

            <main className={styles.mainContent}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Loader2 size={32} className={formStyles.spin} style={{ color: 'var(--color-primary)' }} />
                    </div>
                ) : (
                    <>
                        <section className={styles.actionsSection}>
                            <h2 className={styles.sectionTitle}>{t('assessment.available')}</h2>
                            <div className={styles.actionGrid}>
                                {questionnaires.map((q) => (
                                    <div key={q.id} className={styles.actionCard} onClick={() => startForm(q.id)}>
                                        <div className={styles.actionIconWrapper} style={{ color: 'var(--color-primary)' }}>
                                            <ClipboardList size={22} strokeWidth={2} />
                                        </div>
                                        <div className={styles.actionText}>
                                            <h3>{q.name}</h3>
                                            <p>{q.description}</p>
                                        </div>
                                        <div className={styles.actionArrow}>
                                            <ChevronRight size={20} strokeWidth={2} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {history.length > 0 && (
                            <section className={styles.actionsSection} style={{ marginTop: '32px' }}>
                                <h2 className={styles.sectionTitle}>{t('assessment.history')}</h2>
                                <div className={styles.actionGrid}>
                                    {history.slice(0, 5).map((h, i) => (
                                        <div key={i} className={styles.actionCard}>
                                            <div className={styles.actionIconWrapper} style={{ color: "var(--color-accent-mint)", background: 'none' }}>
                                                <CheckCircle2 size={24} strokeWidth={2} />
                                            </div>
                                            <div className={styles.actionText}>
                                                <h3>{h.questionnaire}</h3>
                                                <p>{t('assessment.score')}: {h.total_score} — {h.risk_level?.toUpperCase()}</p>
                                            </div>
                                            <div className={styles.actionArrow}>
                                                <FileText size={20} strokeWidth={2} style={{ color: 'var(--color-text-tertiary)' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
