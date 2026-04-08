import { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, RefreshControl, Dimensions, Appearance
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LineChart } from 'react-native-gifted-charts';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n';
import { useTheme, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SettingsModal from '../../components/SettingsModal';
import Skeleton from '../../components/Skeleton';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen() {
    const { t, locale } = useI18n();
    const { theme, colors } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ streak: 0, sessions: 0 });
    const [latestLog, setLatestLog] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);
    
    // We use a small cache loading state initially
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);

    const isDark = theme === 'dark';

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const stored = await AsyncStorage.getItem('aura_user');
        if (!stored) { router.replace('/(auth)/login'); return; }
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        
        // Cache read for instant display
        try {
            const cachedStats = await AsyncStorage.getItem(`aura_cache_stats_${parsedUser.id}`);
            const cachedLogs = await AsyncStorage.getItem(`aura_cache_logs_${parsedUser.id}`);
            if (cachedStats) setStats(JSON.parse(cachedStats));
            if (cachedLogs) {
                const logs = JSON.parse(cachedLogs);
                setRecentLogs(logs);
                if (logs.length > 0) setLatestLog(logs[0]);
                setLoading(false); // Stop loading skeleton once cache hits
            }
        } catch (e) {
            console.error(e);
        }

        fetchData(parsedUser.id);
    };

    const fetchData = async (userId) => {
        try {
            const [userRes, logsRes, historyRes] = await Promise.all([
                api.getUser(userId),
                api.getLogs(userId),
                api.getHistory(userId),
            ]);
            
            if (userRes?.data) setUser(prev => ({ ...prev, ...(userRes.data.data || userRes.data.user || userRes.data) }));
            
            let streak = 0, sessions = 0;
            if (logsRes?.data?.logs?.length > 0) {
                setLatestLog(logsRes.data.logs[0]);
                setRecentLogs(logsRes.data.logs);
                streak = logsRes.data.logs.length;
                AsyncStorage.setItem(`aura_cache_logs_${userId}`, JSON.stringify(logsRes.data.logs));
            }
            if (historyRes?.data?.assessments) {
                sessions = historyRes.data.assessments.length;
            }
            
            setStats({ streak, sessions });
            AsyncStorage.setItem(`aura_cache_stats_${userId}`, JSON.stringify({ streak, sessions }));
            
        } catch(e) {
            console.error('Fetch error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
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

    // Chart Data mapping (last 7 logs, in chronological order)
    const chartData = [...recentLogs].slice(0, 7).reverse().map(log => {
        const d = new Date(log.created_at);
        const dayLabel = d.toLocaleDateString(dateLocaleMap[locale] || 'pt-PT', { weekday: 'short' });
        return {
            value: log.mood_score * 10,
            label: dayLabel,
            dataPointText: String(log.mood_score * 10),
        };
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* Ambient blobs — dark mode only */}
            {isDark && (
                <>
                    <LinearGradient
                        colors={['rgba(16,185,129,0.18)', 'transparent']}
                        style={[styles.auraBlob, { top: -height * 0.05, right: -width * 0.2 }]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                    <LinearGradient
                        colors={['rgba(6,182,212,0.14)', 'transparent']}
                        style={[styles.auraBlob, { bottom: height * 0.2, left: -width * 0.3 }]}
                        start={{ x: 0.5, y: 0.5 }} end={{ x: 0.5, y: 0 }}
                    />
                </>
            )}

            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Header Stage */}
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
                    <View>
                        <Text style={[styles.dateText, { color: colors.textTertiary }]}>{dateStr}</Text>
                        <Text style={[styles.greeting, { color: colors.textPrimary }]}>
                            {t('dashboard.greeting', { name: user?.name?.split(' ')[0] || 'User' })}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.avatarBtn, { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(16,185,129,0.35)' }]}
                        onPress={() => setSettingsVisible(true)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={StyleSheet.absoluteFillObject}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        />
                        <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Mood card */}
                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    <BlurView
                        intensity={isDark ? 30 : 0}
                        tint={isDark ? 'dark' : 'light'}
                        style={[styles.moodCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                        {loading ? (
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ flex: 1, gap: 12 }}>
                                    <Skeleton width={100} height={14} />
                                    <Skeleton width={160} height={32} />
                                    <Skeleton width={80} height={26} borderRadius={20} />
                                </View>
                                <Skeleton width={80} height={80} borderRadius={40} />
                            </View>
                        ) : (
                            <>
                                <View style={styles.moodLeft}>
                                    <Text style={[styles.moodLabel, { color: colors.textTertiary }]}>{t('dashboard.statusLabel')}</Text>
                                    <Text style={[styles.moodTitle, { color: colors.textPrimary }]}>{moodLabel}</Text>
                                    {latestLog?.sleep_hours ? (
                                        <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16,185,129,0.1)', borderColor: colors.border }]}>
                                            <Text style={[styles.pillText, { color: colors.textPrimary }]}>🌙 {t('dashboard.sleep', { hours: latestLog.sleep_hours })}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <View style={[styles.moodRing, { borderColor: colors.primary }]}>
                                    <LinearGradient
                                        colors={['rgba(16,185,129,0.3)', 'rgba(6,182,212,0.1)']}
                                        style={StyleSheet.absoluteFillObject}
                                    />
                                    <Text style={[styles.moodScore, { color: colors.primary }]}>{moodScore ? moodScore * 10 : '--'}</Text>
                                    <Text style={[styles.moodScoreUnit, { color: colors.textSecondary }]}>%</Text>
                                </View>
                            </>
                        )}
                    </BlurView>
                </Animated.View>

                {/* Stats row */}
                <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.statsRow}>
                    <BlurView intensity={isDark ? 25 : 0} tint={isDark ? 'dark' : 'light'}
                        style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {loading ? (
                            <View style={{ alignItems: 'center', gap: 6 }}>
                                <Skeleton width={60} height={36} />
                                <Skeleton width={80} height={14} />
                            </View>
                        ) : (
                            <>
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.streak}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dashboard.days')}</Text>
                                <Text style={[styles.statSub, { color: colors.textTertiary }]}>{t('dashboard.streak')}</Text>
                            </>
                        )}
                    </BlurView>
                    <BlurView intensity={isDark ? 25 : 0} tint={isDark ? 'dark' : 'light'}
                        style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {loading ? (
                            <View style={{ alignItems: 'center', gap: 6 }}>
                                <Skeleton width={60} height={36} />
                                <Skeleton width={80} height={14} />
                            </View>
                        ) : (
                            <>
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.sessions}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('dashboard.sessions')}</Text>
                                <Text style={[styles.statSub, { color: colors.textTertiary }]}>{t('dashboard.total')}</Text>
                            </>
                        )}
                    </BlurView>
                </Animated.View>

                {/* Interactive Chart */}
                <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                     {!loading && chartData.length > 1 && (
                        <View style={[styles.chartContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 16 }]}>Progresso</Text>
                            <LineChart
                                data={chartData}
                                width={width - Spacing.md * 2 - 50}
                                height={140}
                                thickness={3}
                                color={colors.primary}
                                hideRules
                                yAxisThickness={0}
                                xAxisThickness={0}
                                hideYAxisText
                                maxValue={100}
                                noOfSections={4}
                                customDataPoint={() => <View style={[styles.dataPoint, { borderColor: colors.primary }]} />}
                                textShiftY={-12}
                                textColor={colors.textSecondary}
                                textFontSize={10}
                                areaChart
                                startFillColor={colors.primary}
                                endFillColor={colors.primary}
                                startOpacity={0.3}
                                endOpacity={0.0}
                                initialSpacing={10}
                                spacing={(width - Spacing.md * 2 - 60) / Math.max(1, chartData.length - 1)}
                                xAxisLabelTextStyle={{ color: colors.textTertiary, fontSize: 10, marginTop: 4 }}
                            />
                        </View>
                    )}
                </Animated.View>

                {/* Actions */}
                <Animated.View entering={FadeInDown.delay(500).duration(600)}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('dashboard.recommendations')}</Text>
                    
                    <TouchableOpacity onPress={() => router.push('/(tabs)/assessment')} activeOpacity={0.7}>
                        <BlurView intensity={isDark ? 25 : 0} tint={isDark ? 'dark' : 'light'}
                            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border }]}>
                            {loading ? <Skeleton width={48} height={48} borderRadius={12} /> : (
                                <View style={[styles.actionIcon, { backgroundColor: colors.primaryDim }]}>
                                    <Text style={styles.actionIconText}>📋</Text>
                                </View>
                            )}
                            <View style={styles.actionText}>
                                {loading ? (
                                    <View style={{ gap: 6 }}>
                                        <Skeleton width={140} height={16} />
                                        <Skeleton width={200} height={14} />
                                    </View>
                                ) : (
                                    <>
                                        <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>{t('dashboard.weeklyAssessment')}</Text>
                                        <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>{t('dashboard.weeklyAssessmentDesc')}</Text>
                                    </>
                                )}
                            </View>
                            {!loading && <Text style={[styles.actionArrow, { color: colors.textTertiary }]}>›</Text>}
                        </BlurView>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/(tabs)/meditations')} activeOpacity={0.7}>
                        <BlurView intensity={isDark ? 25 : 0} tint={isDark ? 'dark' : 'light'}
                            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border }]}>
                             {loading ? <Skeleton width={48} height={48} borderRadius={12} /> : (
                                <View style={[styles.actionIcon, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
                                    <Text style={styles.actionIconText}>🌬️</Text>
                                </View>
                            )}
                            <View style={styles.actionText}>
                                {loading ? (
                                    <View style={{ gap: 6 }}>
                                        <Skeleton width={140} height={16} />
                                        <Skeleton width={200} height={14} />
                                    </View>
                                ) : (
                                    <>
                                        <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>{t('dashboard.breathingPause')}</Text>
                                        <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>{t('dashboard.breathingPauseDesc')}</Text>
                                    </>
                                )}
                            </View>
                             {!loading && <Text style={[styles.actionArrow, { color: colors.textTertiary }]}>›</Text>}
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>

            </ScrollView>

            <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center' },
    content: { padding: Spacing.md, paddingBottom: 32 },
    auraBlob: {
        position: 'absolute',
        width: width * 1.5, height: width * 1.5,
        borderRadius: 9999,
        opacity: 0.10,
        transform: [{ scale: 1.2 }],
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
    dateText: { ...Fonts.medium, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5 },
    greeting: { ...Fonts.serif, fontWeight: '500', fontSize: 32, marginTop: 4, letterSpacing: -0.5 },
    avatarBtn: {
        width: 46, height: 46, borderRadius: 23,
        overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
    },
    avatarText: { ...Fonts.bold, color: '#fff', fontSize: 18, zIndex: 10 },
    
    moodCard: {
        borderRadius: Radius.xl, padding: Spacing.xl,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: Spacing.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
    },
    moodLeft: { flex: 1 },
    moodLabel: { ...Fonts.medium, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
    moodTitle: { ...Fonts.serif, fontWeight: '500', fontSize: 26, marginBottom: 12 },
    pill: { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', borderWidth: 1 },
    pillText: { ...Fonts.medium, fontSize: 13 },
    moodRing: {
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    moodScore: { ...Fonts.heavy, fontSize: 24 },
    moodScoreUnit: { ...Fonts.medium, fontSize: 12 },

    statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    statCard: {
        flex: 1, borderRadius: Radius.lg, padding: Spacing.lg,
        alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
    },
    statValue: { ...Fonts.heavy, fontSize: 32 },
    statLabel: { ...Fonts.medium, fontSize: 12, marginTop: 4 },
    statSub: { ...Fonts.regular, fontSize: 11, marginTop: 2 },
    
    chartContainer: {
        borderRadius: Radius.xl, padding: Spacing.lg,
        marginBottom: Spacing.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
        alignItems: 'center',
    },
    dataPoint: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#fff', borderWidth: 2,
    },

    sectionTitle: { ...Fonts.bold, fontSize: 18, marginBottom: Spacing.md, alignSelf: 'flex-start' },
    actionCard: {
        borderRadius: Radius.lg, padding: Spacing.md,
        flexDirection: 'row', alignItems: 'center',
        marginBottom: Spacing.sm, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.md, overflow: 'hidden',
    },
    actionIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    actionIconText: { fontSize: 24 },
    actionText: { flex: 1 },
    actionTitle: { ...Fonts.semibold, fontSize: 16 },
    actionDesc: { ...Fonts.regular, fontSize: 13, marginTop: 4 },
    actionArrow: { ...Fonts.bold, fontSize: 24 },
});
