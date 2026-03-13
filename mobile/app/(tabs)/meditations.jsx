import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useI18n } from '../../i18n';
import { COLORS, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SESSIONS = [
    { emoji: '🌬️', title: 'sleepPrep', meta: 'sleepPrepMeta', color: COLORS.accentBlue },
    { emoji: '🎯', title: 'deepFocus', meta: 'deepFocusMeta', color: COLORS.accentPink },
];

export default function MeditationsScreen() {
    const { t } = useI18n();
    const insets = useSafeAreaInsets();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        >
            <Text style={styles.pageTitle}>{t('meditations.title')}</Text>

            {/* Featured card */}
            <View style={styles.featuredCard}>
                <View style={styles.featuredContent}>
                    <Text style={styles.featuredLabel}>{t('meditations.recommended')}</Text>
                    <Text style={styles.featuredTitle}>{t('meditations.featuredTitle')}</Text>
                    <Text style={styles.featuredDesc}>{t('meditations.featuredDesc')}</Text>
                    <TouchableOpacity style={styles.startBtn} activeOpacity={0.8}>
                        <Text style={styles.startBtnText}>▶ {t('meditations.start')}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.featuredEmoji}>🌬️</Text>
            </View>

            {/* Sessions */}
            <Text style={styles.sectionLabel}>{t('meditations.explore')}</Text>

            {SESSIONS.map((s) => (
                <TouchableOpacity key={s.title} style={styles.sessionCard} activeOpacity={0.8}>
                    <View style={[styles.sessionIcon, { backgroundColor: s.color + '20' }]}>
                        <Text style={styles.sessionEmoji}>{s.emoji}</Text>
                    </View>
                    <View style={styles.sessionText}>
                        <Text style={styles.sessionTitle}>{t(`meditations.${s.title}`)}</Text>
                        <Text style={styles.sessionMeta}>{t(`meditations.${s.meta}`)}</Text>
                    </View>
                    <View style={[styles.playBtn, { backgroundColor: COLORS.primaryDim }]}>
                        <Text style={styles.playBtnText}>▶</Text>
                    </View>
                </TouchableOpacity>
            ))}

            {/* Breathing exercise */}
            <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>Respiração Guiada</Text>
            <View style={styles.breatheCard}>
                <View style={styles.breatheCircle}>
                    <Text style={styles.breatheEmoji}>◉</Text>
                </View>
                <View style={styles.breatheText}>
                    <Text style={styles.breatheTitle}>4-7-8 Técnica</Text>
                    <Text style={styles.breatheDesc}>Inspira 4s · Segura 7s · Expira 8s</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: Spacing.md, paddingBottom: 32 },
    pageTitle: { ...Fonts.heavy, fontSize: 28, color: COLORS.textPrimary, marginBottom: Spacing.lg },
    sectionLabel: { ...Fonts.semibold, fontSize: 13, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },

    featuredCard: {
        backgroundColor: COLORS.accentMint + '15',
        borderRadius: Radius.xl, padding: Spacing.lg,
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.accentMint + '30',
        marginBottom: Spacing.lg, overflow: 'hidden',
    },
    featuredContent: { flex: 1 },
    featuredLabel: { ...Fonts.semibold, fontSize: 10, color: COLORS.accentMint, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
    featuredTitle: { ...Fonts.bold, fontSize: 20, color: COLORS.textPrimary, marginBottom: 6 },
    featuredDesc: { ...Fonts.regular, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
    featuredEmoji: { fontSize: 64, marginLeft: Spacing.sm },
    startBtn: {
        backgroundColor: COLORS.accentMint, borderRadius: Radius.full,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignSelf: 'flex-start',
    },
    startBtnText: { ...Fonts.semibold, color: '#fff', fontSize: 13 },

    sessionCard: {
        backgroundColor: COLORS.surface, borderRadius: Radius.lg,
        padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
        marginBottom: Spacing.sm, borderWidth: 1, borderColor: COLORS.border, gap: Spacing.md,
    },
    sessionIcon: { width: 50, height: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    sessionEmoji: { fontSize: 26 },
    sessionText: { flex: 1 },
    sessionTitle: { ...Fonts.semibold, fontSize: 15, color: COLORS.textPrimary },
    sessionMeta: { ...Fonts.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    playBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    playBtnText: { color: COLORS.primary, fontSize: 14 },

    breatheCard: {
        backgroundColor: COLORS.surface, borderRadius: Radius.lg,
        padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.border, gap: Spacing.md,
    },
    breatheCircle: {
        width: 56, height: 56, borderRadius: 28,
        borderWidth: 2, borderColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: COLORS.primaryDim,
    },
    breatheEmoji: { fontSize: 24, color: COLORS.primary },
    breatheText: { flex: 1 },
    breatheTitle: { ...Fonts.semibold, color: COLORS.textPrimary, fontSize: 15 },
    breatheDesc: { ...Fonts.regular, color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
});
