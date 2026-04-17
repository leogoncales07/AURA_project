import { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n';
import { useTheme, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import SettingsModal from '../../components/SettingsModal';

export default function AssessmentScreen() {
    const { t } = useI18n();
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const [questionnaires, setQuestionnaires] = useState([]);
    const [activeForm, setActiveForm] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [user, setUser] = useState(null);
    const [settingsVisible, setSettingsVisible] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('aura_user').then((stored) => {
            if (stored) {
                const u = JSON.parse(stored);
                setUserId(u.id);
                setUser(u);
                loadData(u.id);
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

    const riskColors = { low: colors.accentMint, moderate: colors.accentAmber, high: colors.accentPink, severe: colors.accentPink };

    // ── RESULT VIEW ──
    if (result) {
        return (
            <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}>
                <TouchableOpacity onPress={resetForm} style={styles.backBtn}>
                    <Text style={[styles.backBtnText, { color: colors.primary }]}>‹ {t('assessment.backToList')}</Text>
                </TouchableOpacity>
                <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>{t('assessment.results')}</Text>

                {result.error ? (
                    <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.accentPink }]}>
                        <Text style={[styles.resultErrorText, { color: colors.accentPink }]}>{result.error}</Text>
                    </View>
                ) : (
                    <>
                        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={[styles.scoreCircle, { borderColor: colors.primary, backgroundColor: colors.primaryDim }]}>
                                <Text style={[styles.scoreValue, { color: colors.primary }]}>{result.score_data?.total_score}</Text>
                                <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>{t('assessment.score')}</Text>
                            </View>
                            <View style={[styles.riskBadge, { backgroundColor: riskColors[result.score_data?.risk_level] + '22', borderColor: riskColors[result.score_data?.risk_level] }]}>
                                <Text style={[styles.riskText, { color: riskColors[result.score_data?.risk_level] }]}>
                                    {t(`reports.risk${result.score_data?.risk_level?.charAt(0).toUpperCase() + result.score_data?.risk_level?.slice(1)}`) || result.score_data?.risk_level?.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={{ fontWeight: '500', fontSize: 14, color: colors.textSecondary, marginTop: 12, textAlign: 'center', paddingHorizontal: 16 }}>
                                {t(`assessment.riskDetails${result.score_data?.risk_level?.charAt(0).toUpperCase() + result.score_data?.risk_level?.slice(1)}`)}
                            </Text>
                        </View>

                        {result.ai_summary && (
                            <View style={[styles.aiCard, { backgroundColor: colors.card, borderColor: colors.primaryDim }]}>
                                <Text style={[styles.aiTitle, { color: colors.primary }]}>✨ {t('assessment.aiAnalysis')}</Text>
                                <Text style={[styles.aiText, { color: colors.textSecondary }]}>{result.ai_summary}</Text>
                            </View>
                        )}

                        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={resetForm}>
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
            <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
                <View style={[styles.formHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={resetForm}>
                        <Text style={[styles.backBtnText, { color: colors.primary }]}>‹ {t('assessment.backToList')}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.formTitle, { color: colors.textPrimary }]}>{activeForm.name}</Text>
                    <Text style={[styles.formProgress, { color: colors.textSecondary }]}>
                        {t('assessment.questionOf', { current: currentQ + 1, total: activeForm.questions.length })}
                    </Text>
                    {/* Progress bar */}
                    <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.formContent}>
                    <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.questionText, { color: colors.textPrimary }]}>{activeForm.questions[currentQ]}</Text>
                    </View>
                    <View style={styles.optionsGrid}>
                        {activeForm.options.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.optionBtn,
                                    { backgroundColor: colors.card, borderColor: colors.border },
                                    answers[currentQ] === opt.value && { borderColor: colors.primary, backgroundColor: colors.primaryDim },
                                ]}
                                onPress={() => selectAnswer(opt.value)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.optionValue, { color: colors.textSecondary }, answers[currentQ] === opt.value && { color: colors.primary }]}>{opt.value}</Text>
                                <Text style={[styles.optionText, { color: colors.textSecondary }, answers[currentQ] === opt.value && { color: colors.textPrimary }]}>{opt.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Navigation */}
                <View style={[styles.navRow, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.md }]}>
                    <TouchableOpacity
                        style={[styles.navBtn, { backgroundColor: colors.surfaceAlt }, currentQ === 0 && styles.navBtnDisabled]}
                        onPress={() => setCurrentQ(Math.max(0, currentQ - 1))}
                        disabled={currentQ === 0}
                    >
                        <Text style={[styles.navBtnText, { color: colors.textSecondary }]}>{t('assessment.previous')}</Text>
                    </TouchableOpacity>

                    {currentQ < activeForm.questions.length - 1 ? (
                        <TouchableOpacity
                            style={[styles.navBtn, { backgroundColor: colors.primary }, answers[currentQ] === null && styles.navBtnDisabled]}
                            onPress={() => setCurrentQ(currentQ + 1)}
                            disabled={answers[currentQ] === null}
                        >
                            <Text style={styles.navBtnPrimaryText}>{t('assessment.next')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.navBtn, { backgroundColor: colors.primary }, (!allAnswered || submitting) && styles.navBtnDisabled]}
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
        <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}>
            <View style={styles.headerRow}>
                <Text style={[styles.pageTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('assessment.title')}</Text>
                <TouchableOpacity
                    style={[styles.avatarBtn, { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(16,185,129,0.35)' }]}
                    onPress={() => setSettingsVisible(true)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary || colors.primary]}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                    <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
            ) : (
                <>
                    <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('assessment.available')}</Text>
                    {questionnaires.map((q) => (
                        <TouchableOpacity key={q.id} style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => startForm(q.id)} activeOpacity={0.8}>
                            <View style={[styles.actionIcon, { backgroundColor: colors.primaryDim }]}>
                                <Feather name="clipboard" size={22} color={colors.primary} />
                            </View>
                            <View style={styles.actionText}>
                                <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>{q.name}</Text>
                                <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>{q.description}</Text>
                            </View>
                            <Text style={[styles.actionArrow, { color: colors.textTertiary }]}>›</Text>
                        </TouchableOpacity>
                    ))}

                    {history.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, { color: colors.textTertiary, marginTop: Spacing.xl }]}>{t('assessment.history')}</Text>
                            {history.slice(0, 5).map((h, i) => (
                                <View key={i} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <Text style={[styles.historyName, { color: colors.textPrimary }]}>{h.questionnaire}</Text>
                                    <Text style={[styles.historyScore, { color: colors.textSecondary }]}>{t('assessment.score')}: {h.total_score}</Text>
                                    <View style={[styles.riskBadgeSm, { backgroundColor: (riskColors[h.risk_level] || colors.primary) + '22', borderColor: riskColors[h.risk_level] || colors.primary }]}>
                                        <Text style={[styles.riskTextSm, { color: riskColors[h.risk_level] || colors.primary }]}>
                                            {h.risk_level?.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </>
            )}

            <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.md, paddingBottom: 32 },
    pageTitle: { ...Fonts.heavy, fontSize: 28, marginBottom: Spacing.lg },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    avatarBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    avatarText: { fontWeight: '700', color: '#fff', fontSize: 16 },
    sectionLabel: { ...Fonts.semibold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },

    backBtn: { marginBottom: Spacing.md },
    backBtnText: { ...Fonts.semibold, fontSize: 15 },

    actionCard: {
        borderRadius: Radius.lg,
        padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
        marginBottom: Spacing.sm, borderWidth: 1, gap: Spacing.md,
    },
    actionIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    actionIconText: { fontSize: 22 },
    actionText: { flex: 1 },
    actionTitle: { ...Fonts.semibold, fontSize: 15 },
    actionDesc: { ...Fonts.regular, fontSize: 12, marginTop: 2 },
    actionArrow: { ...Fonts.bold, fontSize: 22 },

    historyCard: {
        borderRadius: Radius.lg,
        padding: Spacing.md, marginBottom: Spacing.sm,
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1,
    },
    historyName: { ...Fonts.semibold, flex: 1 },
    historyScore: { ...Fonts.regular, fontSize: 12 },
    riskBadgeSm: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
    riskTextSm: { ...Fonts.bold, fontSize: 10, letterSpacing: 0.5 },

    // Form
    formHeader: { padding: Spacing.md, borderBottomWidth: 1 },
    formTitle: { ...Fonts.bold, fontSize: 20, marginTop: Spacing.sm, marginBottom: 4 },
    formProgress: { ...Fonts.regular, fontSize: 13 },
    progressTrack: { height: 4, borderRadius: 2, marginTop: Spacing.sm, overflow: 'hidden' },
    progressFill: { height: 4, borderRadius: 2 },
    formContent: { padding: Spacing.md },
    questionCard: {
        borderRadius: Radius.lg,
        padding: Spacing.lg, marginBottom: Spacing.md,
        borderWidth: 1,
    },
    questionText: { ...Fonts.semibold, fontSize: 17, lineHeight: 26 },
    optionsGrid: { gap: Spacing.sm },
    optionBtn: {
        borderRadius: Radius.md, padding: Spacing.md,
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1.5,
    },
    optionValue: { ...Fonts.bold, fontSize: 18, width: 28 },
    optionText: { ...Fonts.medium, fontSize: 14, flex: 1 },
    navRow: {
        flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md,
        borderTopWidth: 1,
    },
    navBtn: {
        flex: 1, padding: Spacing.md, borderRadius: Radius.full,
        alignItems: 'center',
    },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: { ...Fonts.semibold, fontSize: 15 },
    navBtnPrimaryText: { ...Fonts.semibold, color: '#fff', fontSize: 15 },

    // Result
    resultCard: {
        borderRadius: Radius.lg,
        padding: Spacing.xl, alignItems: 'center', marginVertical: Spacing.lg,
        borderWidth: 1, gap: Spacing.md,
    },
    scoreCircle: {
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 4, alignItems: 'center', justifyContent: 'center',
    },
    scoreValue: { ...Fonts.heavy, fontSize: 32 },
    scoreLabel: { ...Fonts.medium, fontSize: 11 },
    riskBadge: { borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1.5 },
    riskText: { ...Fonts.bold, fontSize: 14, letterSpacing: 1 },
    resultErrorText: { ...Fonts.regular, textAlign: 'center' },
    aiCard: {
        borderRadius: Radius.lg,
        padding: Spacing.lg, borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    aiTitle: { ...Fonts.semibold, fontSize: 14, marginBottom: Spacing.sm },
    aiText: { ...Fonts.regular, fontSize: 14, lineHeight: 22 },
    doneBtn: {
        borderRadius: Radius.full,
        padding: Spacing.md, alignItems: 'center',
    },
    doneBtnText: { ...Fonts.semibold, color: '#fff', fontSize: 16 },
});
