import { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n';
import { COLORS, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DAYS_PT = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export default function ReportsScreen() {
    const { t } = useI18n();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        chartData: [0, 0, 0, 0, 0, 0, 0],
        avgMood: 0,
        streak: 0,
        todayIndex: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const stored = await AsyncStorage.getItem('aura_user');
        if (!stored) { router.replace('/(auth)/login'); return; }
        fetchReports(JSON.parse(stored).id);
    };

    const fetchReports = async (userId) => {
        const logsRes = await api.getLogs(userId, 14);
        let avgMood = 0, streak = 0;
        let chartData = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();
        const dayOfWeek = today.getDay();
        const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - todayIndex);
        monday.setHours(0, 0, 0, 0);

        if (logsRes.data?.logs) {
            const logs = logsRes.data.logs;
            streak = logs.length;
            let totalMood = 0, moodCount = 0;
            logs.forEach((log) => {
                const logDate = new Date(log.log_date || log.created_at);
                if (logDate >= monday) {
                    const lDay = logDate.getDay();
                    const lIndex = lDay === 0 ? 6 : lDay - 1;
                    if (log.mood_score && lIndex <= todayIndex) {
                        chartData[lIndex] = log.mood_score * 10;
                    }
                }
                if (log.mood_score) { totalMood += log.mood_score; moodCount++; }
            });
            if (moodCount > 0) avgMood = Math.round((totalMood / moodCount) * 10);
        }
        setStats({ avgMood, streak, chartData, todayIndex });
        setLoading(false);
        setRefreshing(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        loadData();
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const CHART_HEIGHT = 100;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
            <Text style={styles.pageTitle}>{t('reports.title')}</Text>

            {/* Weekly Chart */}
            <Text style={styles.sectionLabel}>{t('reports.weeklySummary')}</Text>
            <View style={styles.chartCard}>
                {/* Bars */}
                <View style={styles.chartBars}>
                    {stats.chartData.map((val, i) => (
                        <View key={i} style={styles.barWrapper}>
                            <View style={[
                                styles.barFill,
                                {
                                    height: Math.max(val * CHART_HEIGHT / 100, 4),
                                    backgroundColor: i === stats.todayIndex
                                        ? COLORS.primary
                                        : val > 0 ? COLORS.accentBlue : COLORS.border,
                                    opacity: i > stats.todayIndex ? 0.3 : 1,
                                }
                            ]} />
                        </View>
                    ))}
                </View>
                {/* Labels */}
                <View style={styles.chartLabels}>
                    {DAYS_PT.map((day, i) => (
                        <Text key={i} style={[
                            styles.chartDayLabel,
                            i === stats.todayIndex && styles.chartDayLabelActive,
                        ]}>
                            {day}
                        </Text>
                    ))}
                </View>
                {stats.streak === 0 && (
                    <Text style={styles.noDataText}>Complete daily sessions to populate your chart.</Text>
                )}
            </View>

            {/* Stats */}
            <Text style={styles.sectionLabel}>{t('reports.statistics')}</Text>
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statEmoji}>📈</Text>
                    <Text style={styles.statValue}>{stats.avgMood > 0 ? `${stats.avgMood}%` : '—'}</Text>
                    <Text style={styles.statLabel}>{t('reports.avgMood')}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statEmoji}>🗓️</Text>
                    <Text style={styles.statValue}>{stats.streak}</Text>
                    <Text style={styles.statLabel}>{t('reports.consecutiveDays')}</Text>
                </View>
            </View>

            {/* Wellness tip */}
            <View style={styles.tipCard}>
                <Text style={styles.tipLabel}>💡 Dica do dia</Text>
                <Text style={styles.tipText}>
                    Registe o seu humor diariamente para obter melhores insights sobre o seu bem-estar.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { alignItems: 'center', justifyContent: 'center' },
    content: { padding: Spacing.md, paddingBottom: 32 },
    pageTitle: { ...Fonts.heavy, fontSize: 28, color: COLORS.textPrimary, marginBottom: Spacing.lg },
    sectionLabel: { ...Fonts.semibold, fontSize: 13, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },

    chartCard: {
        backgroundColor: COLORS.surface, borderRadius: Radius.xl,
        padding: Spacing.lg, marginBottom: Spacing.lg,
        borderWidth: 1, borderColor: COLORS.border,
    },
    chartBars: {
        flexDirection: 'row', alignItems: 'flex-end',
        height: 110, gap: 6, marginBottom: 8,
    },
    barWrapper: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
    barFill: { width: '100%', borderRadius: 4, minHeight: 4 },
    chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    chartDayLabel: { ...Fonts.semibold, fontSize: 11, color: COLORS.textTertiary, textAlign: 'center', flex: 1 },
    chartDayLabelActive: { color: COLORS.primary, fontWeight: '800' },
    noDataText: { ...Fonts.regular, fontSize: 12, color: COLORS.textTertiary, textAlign: 'center', marginTop: Spacing.sm },

    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: {
        flex: 1, backgroundColor: COLORS.surface,
        borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.border,
    },
    statEmoji: { fontSize: 28, marginBottom: 6 },
    statValue: { ...Fonts.heavy, fontSize: 26, color: COLORS.textPrimary },
    statLabel: { ...Fonts.medium, fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },

    tipCard: {
        backgroundColor: COLORS.primaryDim,
        borderRadius: Radius.lg, padding: Spacing.md,
        borderWidth: 1, borderColor: COLORS.primary + '40',
    },
    tipLabel: { ...Fonts.semibold, color: COLORS.primary, fontSize: 13, marginBottom: 6 },
    tipText: { ...Fonts.regular, color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
});
