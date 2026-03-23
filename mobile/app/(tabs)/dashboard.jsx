import { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n';
import { COLORS, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
    const { t, locale } = useI18n();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ streak: 0, sessions: 0 });
    const [latestLog, setLatestLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const stored = await AsyncStorage.getItem('aura_user');
        if (!stored) { router.replace('/(auth)/login'); return; }
        const parsedUser = JSON.parse(stored);
        fetchData(parsedUser.id);
    };

    const fetchData = async (userId) => {
        const [userRes, logsRes, historyRes] = await Promise.all([
            api.getUser(userId),
            api.getLogs(userId),
            api.getHistory(userId),
        ]);
        if (userRes.data) setUser(userRes.data.user);
        let streak = 0, sessions = 0;
        if (logsRes.data?.logs?.length > 0) {
            setLatestLog(logsRes.data.logs[0]);
            streak = logsRes.data.logs.length;
        }
        if (historyRes.data?.assessments) sessions = historyRes.data.assessments.length;
        setStats({ streak, sessions });
        setLoading(false);
        setRefreshing(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        const stored = await AsyncStorage.getItem('aura_user');
        if (stored) fetchData(JSON.parse(stored).id);
    };

    const moodScore = latestLog?.mood_score;
    const moodLabel = !moodScore ? '—' : moodScore > 7 ? t('dashboard.moodHigh') : moodScore > 4 ? t('dashboard.moodMid') : t('dashboard.moodLow');

    const dateLocaleMap = { pt: 'pt-PT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };
    const dateStr = new Date().toLocaleDateString(dateLocaleMap[locale] || 'pt-PT', {
        weekday: 'long', day: 'numeric', month: 'short',
    });

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>{t('dashboard.syncing')}</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.dateText}>{dateStr}</Text>
                    <Text style={styles.greeting}>{t('dashboard.greeting', { name: user?.name?.split(' ')[0] || 'User' })}</Text>
                </View>
                <TouchableOpacity
                    style={styles.avatarBtn}
                    onPress={() => {
                        Alert.alert(
                            t('dashboard.profileTitle') || 'Profile',
                            `${user?.name || t('login.demoButton')}\n${user?.email || 'demo@aura.com'}`,
                            [
                                { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                                {
                                    text: t('dashboard.logout') || 'Sign Out',
                                    style: 'destructive',
                                    onPress: async () => {
                                        await AsyncStorage.multiRemove(['aura_token', 'aura_user']);
                                        router.replace('/(auth)/login');
                                    }
                                }
                            ]
                        );
                    }}
                >
                    <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                </TouchableOpacity>
            </View>

            {/* Mood card */}
            <View style={styles.moodCard}>
                <View style={styles.moodLeft}>
                    <Text style={styles.moodLabel}>{t('dashboard.statusLabel')}</Text>
                    <Text style={styles.moodTitle}>{moodLabel}</Text>
                    {latestLog?.sleep_hours ? (
                        <View style={styles.pill}>
                            <Text style={styles.pillText}>🌙 {t('dashboard.sleep', { hours: latestLog.sleep_hours })}</Text>
                        </View>
                    ) : null}
                </View>
                {/* Ring */}
                <View style={styles.moodRing}>
                    <Text style={styles.moodScore}>{moodScore ? moodScore * 10 : '--'}</Text>
                    <Text style={styles.moodScoreUnit}>%</Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.streak}</Text>
                    <Text style={styles.statLabel}>{t('dashboard.days')}</Text>
                    <Text style={styles.statSub}>{t('dashboard.streak')}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.sessions}</Text>
                    <Text style={styles.statLabel}>{t('dashboard.sessions')}</Text>
                    <Text style={styles.statSub}>{t('dashboard.total')}</Text>
                </View>
            </View>

            {/* Actions */}
            <Text style={styles.sectionTitle}>{t('dashboard.recommendations')}</Text>

            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/assessment')} activeOpacity={0.8}>
                <View style={[styles.actionIcon, { backgroundColor: COLORS.primaryDim }]}>
                    <Text style={styles.actionIconText}>📋</Text>
                </View>
                <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>{t('dashboard.weeklyAssessment')}</Text>
                    <Text style={styles.actionDesc}>{t('dashboard.weeklyAssessmentDesc')}</Text>
                </View>
                <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/meditations')} activeOpacity={0.8}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
                    <Text style={styles.actionIconText}>🌬️</Text>
                </View>
                <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>{t('dashboard.breathingPause')}</Text>
                    <Text style={styles.actionDesc}>{t('dashboard.breathingPauseDesc')}</Text>
                </View>
                <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/chat')} activeOpacity={0.8}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(79,195,247,0.15)' }]}>
                    <Text style={styles.actionIconText}>💬</Text>
                </View>
                <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>{t('chat.botName')}</Text>
                    <Text style={styles.actionDesc}>{t('chat.botStatus')}</Text>
                </View>
                <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { alignItems: 'center', justifyContent: 'center' },
    content: { padding: Spacing.md, paddingBottom: 32 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    dateText: { ...Fonts.medium, fontSize: 12, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
    greeting: { ...Fonts.bold, fontSize: 26, color: COLORS.textPrimary, marginTop: 2 },
    avatarBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: COLORS.primaryDim,
        borderWidth: 1.5, borderColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { ...Fonts.bold, color: COLORS.primary, fontSize: 18 },

    loadingText: { ...Fonts.regular, color: COLORS.textSecondary, marginTop: Spacing.sm },

    moodCard: {
        backgroundColor: COLORS.surface,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    moodLeft: { flex: 1 },
    moodLabel: { ...Fonts.medium, fontSize: 11, color: COLORS.textTertiary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
    moodTitle: { ...Fonts.bold, fontSize: 22, color: COLORS.textPrimary, marginBottom: 10 },
    pill: { backgroundColor: COLORS.primaryDim, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
    pillText: { ...Fonts.medium, fontSize: 12, color: COLORS.primary },

    moodRing: {
        width: 72, height: 72, borderRadius: 36,
        borderWidth: 4, borderColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: COLORS.primaryDim,
    },
    moodScore: { ...Fonts.heavy, fontSize: 20, color: COLORS.primary },
    moodScoreUnit: { ...Fonts.medium, fontSize: 10, color: COLORS.textSecondary },

    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: {
        flex: 1, backgroundColor: COLORS.surface,
        borderRadius: Radius.lg, padding: Spacing.md,
        alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
    },
    statValue: { ...Fonts.heavy, fontSize: 28, color: COLORS.textPrimary },
    statLabel: { ...Fonts.medium, fontSize: 11, color: COLORS.textSecondary },
    statSub: { ...Fonts.regular, fontSize: 10, color: COLORS.textTertiary },

    sectionTitle: { ...Fonts.bold, fontSize: 16, color: COLORS.textPrimary, marginBottom: Spacing.sm },

    actionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: Spacing.md,
    },
    actionIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    actionIconText: { fontSize: 22 },
    actionText: { flex: 1 },
    actionTitle: { ...Fonts.semibold, fontSize: 15, color: COLORS.textPrimary },
    actionDesc: { ...Fonts.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    actionArrow: { ...Fonts.bold, fontSize: 22, color: COLORS.textTertiary },
});
