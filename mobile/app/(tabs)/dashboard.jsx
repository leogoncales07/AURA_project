import { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, RefreshControl, Alert, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n';
import { COLORS, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

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
        if (userRes?.data) setUser(userRes.data.user);
        let streak = 0, sessions = 0;
        if (logsRes?.data?.logs?.length > 0) {
            setLatestLog(logsRes.data.logs[0]);
            streak = logsRes.data.logs.length;
        }
        if (historyRes?.data?.assessments) sessions = historyRes.data.assessments.length;
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
        <View style={styles.container}>
            {/* Ambient Animated Gradients in the absolute background */}
            <LinearGradient
                colors={[COLORS.primary, 'transparent']}
                style={[styles.auraBlob, { top: -height * 0.05, right: -width * 0.2 }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <LinearGradient
                colors={['#06b6d4', 'transparent']}
                style={[styles.auraBlob, { bottom: height * 0.2, left: -width * 0.3 }]}
                start={{ x: 0.5, y: 0.5 }} end={{ x: 0.5, y: 0 }}
            />

            <ScrollView
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
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.secondary]}
                            style={StyleSheet.absoluteFillObject}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        />
                        <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Mood card - Glass */}
                <BlurView intensity={30} tint="dark" style={styles.moodCard}>
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
                        <LinearGradient
                            colors={['rgba(16,185,129,0.3)', 'rgba(6,182,212,0.1)']}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <Text style={styles.moodScore}>{moodScore ? moodScore * 10 : '--'}</Text>
                        <Text style={styles.moodScoreUnit}>%</Text>
                    </View>
                </BlurView>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <BlurView intensity={25} tint="dark" style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.streak}</Text>
                        <Text style={styles.statLabel}>{t('dashboard.days')}</Text>
                        <Text style={styles.statSub}>{t('dashboard.streak')}</Text>
                    </BlurView>
                    <BlurView intensity={25} tint="dark" style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.sessions}</Text>
                        <Text style={styles.statLabel}>{t('dashboard.sessions')}</Text>
                        <Text style={styles.statSub}>{t('dashboard.total')}</Text>
                    </BlurView>
                </View>

                {/* Actions */}
                <Text style={styles.sectionTitle}>{t('dashboard.recommendations')}</Text>

                <TouchableOpacity onPress={() => router.push('/(tabs)/assessment')} activeOpacity={0.8}>
                    <BlurView intensity={25} tint="dark" style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: COLORS.primaryDim }]}>
                            <Text style={styles.actionIconText}>📋</Text>
                        </View>
                        <View style={styles.actionText}>
                            <Text style={styles.actionTitle}>{t('dashboard.weeklyAssessment')}</Text>
                            <Text style={styles.actionDesc}>{t('dashboard.weeklyAssessmentDesc')}</Text>
                        </View>
                        <Text style={styles.actionArrow}>›</Text>
                    </BlurView>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/(tabs)/meditations')} activeOpacity={0.8}>
                    <BlurView intensity={25} tint="dark" style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
                            <Text style={styles.actionIconText}>🌬️</Text>
                        </View>
                        <View style={styles.actionText}>
                            <Text style={styles.actionTitle}>{t('dashboard.breathingPause')}</Text>
                            <Text style={styles.actionDesc}>{t('dashboard.breathingPauseDesc')}</Text>
                        </View>
                        <Text style={styles.actionArrow}>›</Text>
                    </BlurView>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/(tabs)/chat')} activeOpacity={0.8}>
                    <BlurView intensity={25} tint="dark" style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: 'rgba(79,195,247,0.15)' }]}>
                            <Text style={styles.actionIconText}>💬</Text>
                        </View>
                        <View style={styles.actionText}>
                            <Text style={styles.actionTitle}>{t('chat.botName')}</Text>
                            <Text style={styles.actionDesc}>{t('chat.botStatus')}</Text>
                        </View>
                        <Text style={styles.actionArrow}>›</Text>
                    </BlurView>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { alignItems: 'center', justifyContent: 'center' },
    content: { padding: Spacing.md, paddingBottom: 32 },

    auraBlob: {
        position: 'absolute',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: 9999,
        opacity: 0.12,
        transform: [{ scale: 1.2 }],
    },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
    dateText: { ...Fonts.medium, fontSize: 13, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 1.5 },
    greeting: { ...Fonts.serif, fontWeight: '500', fontSize: 32, color: COLORS.textPrimary, marginTop: 4, letterSpacing: -0.5 },
    
    avatarBtn: {
        width: 46, height: 46, borderRadius: 23,
        overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
    },
    avatarText: { ...Fonts.bold, color: '#fff', fontSize: 18, zIndex: 10 },

    loadingText: { ...Fonts.regular, color: COLORS.textSecondary, marginTop: Spacing.sm },

    moodCard: {
        borderRadius: Radius.xl,
        padding: Spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        backgroundColor: COLORS.card,
    },
    moodLeft: { flex: 1 },
    moodLabel: { ...Fonts.medium, fontSize: 11, color: COLORS.textTertiary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
    moodTitle: { ...Fonts.serif, fontWeight: '500', fontSize: 26, color: COLORS.textPrimary, marginBottom: 12 },
    pill: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border },
    pillText: { ...Fonts.medium, fontSize: 13, color: COLORS.textPrimary },

    moodRing: {
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 2, borderColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
    },
    moodScore: { ...Fonts.heavy, fontSize: 24, color: COLORS.primary },
    moodScoreUnit: { ...Fonts.medium, fontSize: 12, color: COLORS.textSecondary },

    statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    statCard: {
        flex: 1, backgroundColor: COLORS.card,
        borderRadius: Radius.lg, padding: Spacing.lg,
        alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
        overflow: 'hidden'
    },
    statValue: { ...Fonts.heavy, fontSize: 32, color: COLORS.textPrimary },
    statLabel: { ...Fonts.medium, fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
    statSub: { ...Fonts.regular, fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },

    sectionTitle: { ...Fonts.bold, fontSize: 18, color: COLORS.textPrimary, marginBottom: Spacing.md },

    actionCard: {
        backgroundColor: COLORS.card,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        gap: Spacing.md,
        overflow: 'hidden',
    },
    actionIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    actionIconText: { fontSize: 24 },
    actionText: { flex: 1 },
    actionTitle: { ...Fonts.semibold, fontSize: 16, color: COLORS.textPrimary },
    actionDesc: { ...Fonts.regular, fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
    actionArrow: { ...Fonts.bold, fontSize: 24, color: COLORS.textTertiary },
});
