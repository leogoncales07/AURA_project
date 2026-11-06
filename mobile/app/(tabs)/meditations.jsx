import { api } from '../../lib/api';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '../../i18n';
import { useTheme, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MeditationPlayerModal from '../../components/MeditationPlayerModal';
import SettingsModal from '../../components/SettingsModal';
import { progressCopy } from '../../lib/progress-utils.mjs';

const SESSION_COLORS = { accentBlue: '#4FC3F7', accentPink: '#FF6B9D', accentMint: '#30D158' };

const SESSIONS = [
    { emoji: '🌬️', title: 'sleepPrep', meta: 'sleepPrepMeta', color: SESSION_COLORS.accentBlue, audioUrl: null },
    { emoji: '🎯', title: 'deepFocus', meta: 'deepFocusMeta', color: SESSION_COLORS.accentPink, audioUrl: null },
];

export default function MeditationsScreen() {
    const { t, locale } = useI18n();
    const copy = progressCopy(locale);
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';
    const [sessions, setSessions] = useState(SESSIONS);
    const [activeSession, setActiveSession] = useState(null);
    const [user, setUser] = useState(null);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [durationMinutes, setDurationMinutes] = useState(3);

    useEffect(() => {
        api.getLibraryContent().then(result => {
            const library = result.data?.content || result.data;
            if (!library) return;
            const rows = Object.entries({ ...library.meditations, ...library.sleep_methods });
            if (rows.length) setSessions(rows.map(([id, entry]) => ({ title: id, titleText: entry.name, metaText: entry.description, color: SESSION_COLORS.accentMint, emoji: '♫', durationMin: 5, audioUrl: null })));
        });
        AsyncStorage.getItem('aura_user').then((stored) => {
            if (stored) setUser(JSON.parse(stored));
        });
    }, []);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.bg }]}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        >
            <View style={styles.headerRow}>
                <Text style={[styles.pageTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('meditations.title')}</Text>
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
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{copy.duration}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {[1, 3, 5, 10].map(minutes => <TouchableOpacity key={minutes} accessibilityRole="button" accessibilityState={{ selected: minutes === durationMinutes }} onPress={() => setDurationMinutes(minutes)} style={{ padding: 13, flex: 1, alignItems: 'center', borderRadius: 12, backgroundColor: minutes === durationMinutes ? colors.primaryDim : colors.inputBg }}><Text style={{ color: minutes === durationMinutes ? colors.primary : colors.textSecondary }}>{minutes} min</Text></TouchableOpacity>)}
            </View>
            <Text style={[styles.safetyNote, { color: colors.textSecondary, backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                {t('meditations.safety')}
            </Text>

            {/* Featured card */}
            <View style={[styles.featuredCard, { backgroundColor: SESSION_COLORS.accentMint + '15', borderColor: SESSION_COLORS.accentMint + '30' }]}>
                <View style={styles.featuredContent}>
                    <Text style={[styles.featuredLabel, { color: SESSION_COLORS.accentMint }]}>{t('meditations.recommended')}</Text>
                    <Text style={[styles.featuredTitle, { color: colors.textPrimary }]}>{t('meditations.featuredTitle')}</Text>
                    <Text style={[styles.featuredDesc, { color: colors.textSecondary }]}>{t('meditations.featuredDesc')}</Text>
                    <TouchableOpacity
                        style={[styles.startBtn, { backgroundColor: SESSION_COLORS.accentMint }]}
                        activeOpacity={0.8}
                        onPress={() => setActiveSession({
                            title: t('meditations.featuredTitle'),
                            practice_id: 'box_breathing',
                            meta: t('meditations.featuredDesc'),
                            durationMin: durationMinutes,
                            color: SESSION_COLORS.accentMint,
                            emoji: '🌬️',
                            audioUrl: null
                        })}
                    >
                        <Text style={styles.startBtnText}>▶ {t('meditations.start')}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.featuredEmoji}>🌬️</Text>
            </View>

            {/* Sessions */}
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('meditations.explore')}</Text>

            {sessions.map((s) => (
                <TouchableOpacity
                    key={s.title}
                    style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.8}
                    onPress={() => setActiveSession({
                        title: (s.titleText || t(`meditations.${s.title}`)),
                        practice_id: s.title === 'sleepPrep' ? 'military_method' : s.title === 'deepFocus' ? 'body_scan' : s.title,
                        meta: (s.metaText || t(`meditations.${s.meta}`)),
                        durationMin: durationMinutes,
                        color: s.color,
                        emoji: s.emoji,
                        audioUrl: s.audioUrl
                    })}
                >
                    <View style={[styles.sessionIcon, { backgroundColor: s.color + '20' }]}>
                        <Text style={styles.sessionEmoji}>{s.emoji}</Text>
                    </View>
                    <View style={styles.sessionText}>
                        <Text style={[styles.sessionTitle, { color: colors.textPrimary }]}>{(s.titleText || t(`meditations.${s.title}`))}</Text>
                        <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>{(s.metaText || t(`meditations.${s.meta}`))}</Text>
                    </View>
                    <View style={[styles.playBtn, { backgroundColor: colors.primaryDim }]}>
                        <Text style={[styles.playBtnText, { color: colors.primary }]}>▶</Text>
                    </View>
                </TouchableOpacity>
            ))}

            {/* Breathing exercise */}
            <Text style={[styles.sectionLabel, { marginTop: Spacing.lg, color: colors.textTertiary }]}>{copy.practice}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => setActiveSession({ practice_id: '478_breathing', title: '4–7–8', meta: copy.practice, durationMin: durationMinutes, color: colors.primary })} style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={{ color: colors.primary, fontSize: 18 }}>4–7–8</Text><Text style={{ color: colors.textSecondary }}>{copy.practice}</Text></TouchableOpacity>

            {activeSession && <MeditationPlayerModal
                visible={!!activeSession}
                session={activeSession}
                userId={user?.id}
                onClose={() => setActiveSession(null)}
            />}
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

    featuredCard: {
        borderRadius: Radius.xl, padding: Spacing.lg,
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1,
        marginBottom: Spacing.lg, overflow: 'hidden',
    },
    featuredContent: { flex: 1 },
    featuredLabel: { ...Fonts.semibold, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
    featuredTitle: { ...Fonts.bold, fontSize: 20, marginBottom: 6 },
    featuredDesc: { ...Fonts.regular, fontSize: 13, lineHeight: 20, marginBottom: Spacing.md },
    featuredEmoji: { fontSize: 64, marginLeft: Spacing.sm },
    safetyNote: { ...Fonts.regular, fontSize: 12, lineHeight: 18, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.lg },
    startBtn: {
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignSelf: 'flex-start',
    },
    startBtnText: { ...Fonts.semibold, color: '#fff', fontSize: 13 },

    sessionCard: {
        borderRadius: Radius.lg,
        padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
        marginBottom: Spacing.sm, borderWidth: 1, gap: Spacing.md,
    },
    sessionIcon: { width: 50, height: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    sessionEmoji: { fontSize: 26 },
    sessionText: { flex: 1 },
    sessionTitle: { ...Fonts.semibold, fontSize: 15 },
    sessionMeta: { ...Fonts.regular, fontSize: 12, marginTop: 2 },
    playBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    playBtnText: { fontSize: 14 },

    breatheCard: {
        borderRadius: Radius.lg,
        padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, gap: Spacing.md,
    },
    breatheCircle: {
        width: 56, height: 56, borderRadius: 28,
        borderWidth: 2,
        alignItems: 'center', justifyContent: 'center',
    },
    breatheEmoji: { fontSize: 24 },
    breatheText: { flex: 1 },
    breatheTitle: { ...Fonts.semibold, fontSize: 15 },
    breatheDesc: { ...Fonts.regular, fontSize: 12, marginTop: 4 },
});
