import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useI18n } from '../../i18n';
import { useTheme, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BreathingTool from '../../components/BreathingTool';
import MeditationPlayerModal from '../../components/MeditationPlayerModal';
import { useState } from 'react';

const SESSION_COLORS = { accentBlue: '#4FC3F7', accentPink: '#FF6B9D', accentMint: '#30D158' };

const SESSIONS = [
    { emoji: '🌬️', title: 'sleepPrep', meta: 'sleepPrepMeta', color: SESSION_COLORS.accentBlue },
    { emoji: '🎯', title: 'deepFocus', meta: 'deepFocusMeta', color: SESSION_COLORS.accentPink },
];

export default function MeditationsScreen() {
    const { t } = useI18n();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [activeSession, setActiveSession] = useState(null);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.bg }]}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        >
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>{t('meditations.title')}</Text>

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
                            meta: t('meditations.featuredDesc'),
                            durationMin: 5,
                            color: SESSION_COLORS.accentMint,
                            emoji: '🌬️'
                        })}
                    >
                        <Text style={styles.startBtnText}>▶ {t('meditations.start')}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.featuredEmoji}>🌬️</Text>
            </View>

            {/* Sessions */}
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('meditations.explore')}</Text>

            {SESSIONS.map((s) => (
                <TouchableOpacity 
                    key={s.title} 
                    style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
                    activeOpacity={0.8}
                    onPress={() => setActiveSession({
                        title: t(`meditations.${s.title}`),
                        meta: t(`meditations.${s.meta}`),
                        durationMin: s.title === 'sleepPrep' ? 12 : 15,
                        color: s.color,
                        emoji: s.emoji
                    })}
                >
                    <View style={[styles.sessionIcon, { backgroundColor: s.color + '20' }]}>
                        <Text style={styles.sessionEmoji}>{s.emoji}</Text>
                    </View>
                    <View style={styles.sessionText}>
                        <Text style={[styles.sessionTitle, { color: colors.textPrimary }]}>{t(`meditations.${s.title}`)}</Text>
                        <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>{t(`meditations.${s.meta}`)}</Text>
                    </View>
                    <View style={[styles.playBtn, { backgroundColor: colors.primaryDim }]}>
                        <Text style={[styles.playBtnText, { color: colors.primary }]}>▶</Text>
                    </View>
                </TouchableOpacity>
            ))}

            {/* Breathing exercise */}
            <Text style={[styles.sectionLabel, { marginTop: Spacing.lg, color: colors.textTertiary }]}>Respição Guiada</Text>
            <BreathingTool />
            
            <MeditationPlayerModal 
                visible={!!activeSession}
                session={activeSession}
                onClose={() => setActiveSession(null)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.md, paddingBottom: 32 },
    pageTitle: { ...Fonts.heavy, fontSize: 28, marginBottom: Spacing.lg },
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
