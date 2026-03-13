import { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n';
import { COLORS, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AssessmentScreen() {
    const { t } = useI18n();
    const insets = useSafeAreaInsets();
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
        AsyncStorage.getItem('aura_user').then((stored) => {
            if (stored) {
                const user = JSON.parse(stored);
                setUserId(user.id);
                loadData(user.id);
            }
        });
    }, []);

    const loadData = async (uid) => {
        setLoading(true);
        const [qRes, hRes] = await Promise.all([api.listQuestionnaires(), api.getHistory(uid)]);
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
        setTimeout(() => {
            if (currentQ < activeForm.questions.length - 1) setCurrentQ(currentQ + 1);
        }, 300);
    };

    const handleSubmit = async () => {
        if (!userId || answers.includes(null)) return;
        setSubmitting(true);
        const { data, error } = await api.submitAssessment(userId, activeForm.id, answers);
        setResult(data || { error: error || 'Submission failed' });
        setSubmitting(false);
    };

    const resetForm = () => {
        setActiveForm(null);
        setAnswers([]);
        setResult(null);
        setCurrentQ(0);
        if (userId) loadData(userId);
    };

    const riskColors = { low: COLORS.accentMint, moderate: COLORS.accentAmber, high: COLORS.accentPink, severe: COLORS.accentPink };

    // ── RESULT VIEW ──
    if (result) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}>
                <TouchableOpacity onPress={resetForm} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>‹ {t('assessment.backToList')}</Text>
                </TouchableOpacity>
                <Text style={styles.pageTitle}>{t('assessment.results')}</Text>

                {result.error ? (
                    <View style={[styles.resultCard, { borderColor: COLORS.accentPink }]}>
                        <Text style={styles.resultErrorText}>{result.error}</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.resultCard}>
                            <View style={styles.scoreCircle}>
                                <Text style={styles.scoreValue}>{result.score_data?.total_score}</Text>
                                <Text style={styles.scoreLabel}>{t('assessment.score')}</Text>
                            </View>
                            <View style={[styles.riskBadge, { backgroundColor: riskColors[result.score_data?.risk_level] + '22', borderColor: riskColors[result.score_data?.risk_level] }]}>
                                <Text style={[styles.riskText, { color: riskColors[result.score_data?.risk_level] }]}>
                                    {result.score_data?.risk_level?.toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        {result.ai_summary && (
                            <View style={styles.aiCard}>
                                <Text style={styles.aiTitle}>✨ {t('assessment.aiAnalysis')}</Text>
                                <Text style={styles.aiText}>{result.ai_summary}</Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.doneBtn} onPress={resetForm}>
                            <Text style={styles.doneBtnText}>{t('assessment.done')}</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        );
    }

    // ── FORM VIEW ──
    if (activeForm) {
        const progress = (currentQ + 1) / activeForm.questions.length;
        const allAnswered = !answers.includes(null);

        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.formHeader}>
                    <TouchableOpacity onPress={resetForm}>
                        <Text style={styles.backBtnText}>‹ {t('assessment.backToList')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.formTitle}>{activeForm.name}</Text>
                    <Text style={styles.formProgress}>
                        {t('assessment.questionOf', { current: currentQ + 1, total: activeForm.questions.length })}
                    </Text>
                    {/* Progress bar */}
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.formContent}>
                    <View style={styles.questionCard}>
                        <Text style={styles.questionText}>{activeForm.questions[currentQ]}</Text>
                    </View>
                    <View style={styles.optionsGrid}>
                        {activeForm.options.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[styles.optionBtn, answers[currentQ] === opt.value && styles.optionBtnSelected]}
                                onPress={() => selectAnswer(opt.value)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.optionValue, answers[currentQ] === opt.value && styles.optionValueSelected]}>{opt.value}</Text>
                                <Text style={[styles.optionText, answers[currentQ] === opt.value && styles.optionTextSelected]}>{opt.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Navigation */}
                <View style={[styles.navRow, { paddingBottom: insets.bottom + Spacing.md }]}>
                    <TouchableOpacity
                        style={[styles.navBtn, currentQ === 0 && styles.navBtnDisabled]}
                        onPress={() => setCurrentQ(Math.max(0, currentQ - 1))}
                        disabled={currentQ === 0}
                    >
                        <Text style={styles.navBtnText}>{t('assessment.previous')}</Text>
                    </TouchableOpacity>

                    {currentQ < activeForm.questions.length - 1 ? (
                        <TouchableOpacity
                            style={[styles.navBtn, styles.navBtnPrimary, answers[currentQ] === null && styles.navBtnDisabled]}
                            onPress={() => setCurrentQ(currentQ + 1)}
                            disabled={answers[currentQ] === null}
                        >
                            <Text style={styles.navBtnPrimaryText}>{t('assessment.next')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.navBtn, styles.navBtnPrimary, (!allAnswered || submitting) && styles.navBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={!allAnswered || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.navBtnPrimaryText}>{t('assessment.submit')}</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    // ── LIST VIEW ──
    return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}>
            <Text style={styles.pageTitle}>{t('assessment.title')}</Text>

            {loading ? (
                <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
            ) : (
                <>
                    <Text style={styles.sectionLabel}>{t('assessment.available')}</Text>
                    {questionnaires.map((q) => (
                        <TouchableOpacity key={q.id} style={styles.actionCard} onPress={() => startForm(q.id)} activeOpacity={0.8}>
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.primaryDim }]}>
                                <Text style={styles.actionIconText}>📋</Text>
                            </View>
                            <View style={styles.actionText}>
                                <Text style={styles.actionTitle}>{q.name}</Text>
                                <Text style={styles.actionDesc}>{q.description}</Text>
                            </View>
                            <Text style={styles.actionArrow}>›</Text>
                        </TouchableOpacity>
                    ))}

                    {history.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>{t('assessment.history')}</Text>
                            {history.slice(0, 5).map((h, i) => (
                                <View key={i} style={styles.historyCard}>
                                    <Text style={styles.historyName}>{h.questionnaire}</Text>
                                    <Text style={styles.historyScore}>{t('assessment.score')}: {h.total_score}</Text>
                                    <View style={[styles.riskBadgeSm, { backgroundColor: (riskColors[h.risk_level] || COLORS.primary) + '22', borderColor: riskColors[h.risk_level] || COLORS.primary }]}>
                                        <Text style={[styles.riskTextSm, { color: riskColors[h.risk_level] || COLORS.primary }]}>
                                            {h.risk_level?.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: Spacing.md, paddingBottom: 32 },
    pageTitle: { ...Fonts.heavy, fontSize: 28, color: COLORS.textPrimary, marginBottom: Spacing.lg },
    sectionLabel: { ...Fonts.semibold, fontSize: 13, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },

    backBtn: { marginBottom: Spacing.md },
    backBtnText: { ...Fonts.semibold, color: COLORS.primary, fontSize: 15 },

    actionCard: {
        backgroundColor: COLORS.surface, borderRadius: Radius.lg,
        padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
        marginBottom: Spacing.sm, borderWidth: 1, borderColor: COLORS.border, gap: Spacing.md,
    },
    actionIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    actionIconText: { fontSize: 22 },
    actionText: { flex: 1 },
    actionTitle: { ...Fonts.semibold, fontSize: 15, color: COLORS.textPrimary },
    actionDesc: { ...Fonts.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    actionArrow: { ...Fonts.bold, fontSize: 22, color: COLORS.textTertiary },

    historyCard: {
        backgroundColor: COLORS.surface, borderRadius: Radius.lg,
        padding: Spacing.md, marginBottom: Spacing.sm,
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1, borderColor: COLORS.border,
    },
    historyName: { ...Fonts.semibold, color: COLORS.textPrimary, flex: 1 },
    historyScore: { ...Fonts.regular, color: COLORS.textSecondary, fontSize: 12 },
    riskBadgeSm: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
    riskTextSm: { ...Fonts.bold, fontSize: 10, letterSpacing: 0.5 },

    // Form
    formHeader: { backgroundColor: COLORS.surface, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    formTitle: { ...Fonts.bold, fontSize: 20, color: COLORS.textPrimary, marginTop: Spacing.sm, marginBottom: 4 },
    formProgress: { ...Fonts.regular, color: COLORS.textSecondary, fontSize: 13 },
    progressTrack: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginTop: Spacing.sm, overflow: 'hidden' },
    progressFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
    formContent: { padding: Spacing.md },
    questionCard: {
        backgroundColor: COLORS.surface, borderRadius: Radius.lg,
        padding: Spacing.lg, marginBottom: Spacing.md,
        borderWidth: 1, borderColor: COLORS.border,
    },
    questionText: { ...Fonts.semibold, fontSize: 17, color: COLORS.textPrimary, lineHeight: 26 },
    optionsGrid: { gap: Spacing.sm },
    optionBtn: {
        backgroundColor: COLORS.surface, borderRadius: Radius.md, padding: Spacing.md,
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1.5, borderColor: COLORS.border,
    },
    optionBtnSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
    optionValue: { ...Fonts.bold, fontSize: 18, color: COLORS.textSecondary, width: 28 },
    optionValueSelected: { color: COLORS.primary },
    optionText: { ...Fonts.medium, fontSize: 14, color: COLORS.textSecondary, flex: 1 },
    optionTextSelected: { color: COLORS.textPrimary },
    navRow: {
        flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md,
        backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
    },
    navBtn: {
        flex: 1, padding: Spacing.md, borderRadius: Radius.full,
        backgroundColor: COLORS.surfaceAlt, alignItems: 'center',
    },
    navBtnPrimary: { backgroundColor: COLORS.primary },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: { ...Fonts.semibold, color: COLORS.textSecondary, fontSize: 15 },
    navBtnPrimaryText: { ...Fonts.semibold, color: '#fff', fontSize: 15 },

    // Result
    resultCard: {
        backgroundColor: COLORS.surface, borderRadius: Radius.lg,
        padding: Spacing.xl, alignItems: 'center', marginVertical: Spacing.lg,
        borderWidth: 1, borderColor: COLORS.border, gap: Spacing.md,
    },
    scoreCircle: {
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 4, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
        backgroundColor: COLORS.primaryDim,
    },
    scoreValue: { ...Fonts.heavy, fontSize: 32, color: COLORS.primary },
    scoreLabel: { ...Fonts.medium, fontSize: 11, color: COLORS.textSecondary },
    riskBadge: { borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1.5 },
    riskText: { ...Fonts.bold, fontSize: 14, letterSpacing: 1 },
    resultErrorText: { ...Fonts.regular, color: COLORS.accentPink, textAlign: 'center' },
    aiCard: {
        backgroundColor: COLORS.surface, borderRadius: Radius.lg,
        padding: Spacing.lg, borderWidth: 1, borderColor: COLORS.primaryDim,
        marginBottom: Spacing.lg,
    },
    aiTitle: { ...Fonts.semibold, color: COLORS.primary, fontSize: 14, marginBottom: Spacing.sm },
    aiText: { ...Fonts.regular, color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
    doneBtn: {
        backgroundColor: COLORS.primary, borderRadius: Radius.full,
        padding: Spacing.md, alignItems: 'center',
    },
    doneBtnText: { ...Fonts.semibold, color: '#fff', fontSize: 16 },
});
