import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    Animated, Modal, Pressable, Dimensions, TextInput,
    ActivityIndicator, Switch, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useI18n, SUPPORTED_LOCALES } from '../i18n';
import { useTheme, COLORS, Fonts, Spacing, Radius } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Nav sections mirroring the web ────────────────────────────────────────
const NAV_SECTIONS = [
    { id: 'profile',       label: 'Profile',               group: 'Personal' },
    { id: 'account',       label: 'Account & Security',    group: 'Account'  },
    { id: 'appearance',    label: 'Appearance',            group: 'System'   },
    { id: 'data',          label: 'Data & Privacy',        group: 'System'   },
    { id: 'danger',        label: 'Danger Zone',           group: 'Danger'   },
];
const GROUPS = ['Personal', 'Account', 'System', 'Danger'];

// ─── Segmented control (System / Light / Dark) ────────────────────────────
function SegmentedControl({ options, value, onChange, colors }) {
    return (
        <View style={[sc.wrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            {options.map((opt) => {
                const active = value === opt.value;
                return (
                    <TouchableOpacity
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        style={[
                            sc.btn,
                            active && { backgroundColor: colors.bg, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
                        ]}
                        activeOpacity={0.75}
                    >
                        <Text style={[sc.label, { color: active ? colors.textPrimary : colors.textTertiary, fontWeight: active ? '600' : '400' }]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
const sc = StyleSheet.create({
    wrap: { flexDirection: 'row', borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, padding: 3 },
    btn:  { flex: 1, paddingVertical: 7, borderRadius: Radius.sm - 1, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 13 },
});

// ─── Setting row (label + right content, hairline separator) ───────────────
function SettingRow({ label, description, right, colors, isLast }) {
    return (
        <View style={[sr.row, { borderBottomColor: colors.divider }, isLast && sr.last]}>
            <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                <Text style={[sr.label, { color: colors.textPrimary }]}>{label}</Text>
                {description ? <Text style={[sr.desc, { color: colors.textTertiary }]}>{description}</Text> : null}
            </View>
            {right && <View style={{ flexShrink: 0 }}>{right}</View>}
        </View>
    );
}
const sr = StyleSheet.create({
    row:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
    last:  { borderBottomWidth: 0 },
    label: { fontSize: 14, fontWeight: '500' },
    desc:  { fontSize: 12, marginTop: 2 },
});

// ─── Setting card (white rounded container) ────────────────────────────────
function SettingCard({ children, title, colors }) {
    return (
        <View style={{ marginBottom: Spacing.md }}>
            {title ? <Text style={[stc.title, { color: colors.textTertiary }]}>{title.toUpperCase()}</Text> : null}
            <View style={[stc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {children}
            </View>
        </View>
    );
}
const stc = StyleSheet.create({
    title: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, marginBottom: 6, marginLeft: 2 },
    card:  { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.md, overflow: 'hidden' },
});

// ─── Section header ────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, colors }) {
    return (
        <View style={{ marginBottom: Spacing.md }}>
            <Text style={[{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }]}>{title}</Text>
            {subtitle ? <Text style={{ fontSize: 13, color: colors.textSecondary }}>{subtitle}</Text> : null}
        </View>
    );
}

// ─── Text input styled like the web ────────────────────────────────────────
function AuraInput({ value, onChangeText, placeholder, multiline, maxLength, colors }) {
    return (
        <View>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textGhost}
                multiline={multiline}
                maxLength={maxLength}
                style={[inp.input, {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    height: multiline ? 80 : 40,
                }]}
            />
            {maxLength && <Text style={[inp.count, { color: colors.textGhost }]}>{(value || '').length}/{maxLength}</Text>}
        </View>
    );
}
const inp = StyleSheet.create({
    input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, textAlignVertical: 'top' },
    count: { fontSize: 11, textAlign: 'right', marginTop: 2 },
});

// ─── Destructive button (outline) ──────────────────────────────────────────
function DestructiveButton({ label, onPress, danger, colors }) {
    const borderColor = danger ? '#ef4444' : colors.border;
    const textColor = danger ? '#ef4444' : colors.textPrimary;
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[db.btn, { borderColor }]}
            activeOpacity={0.75}
        >
            <Text style={[db.text, { color: textColor }]}>{label}</Text>
        </TouchableOpacity>
    );
}
const db = StyleSheet.create({
    btn:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.md, borderWidth: 1 },
    text: { fontSize: 13, fontWeight: '500' },
});

// ─── Globe + locale pill — exactly like the web LanguageSwitcher ───────────
function LanguagePill({ locale, onPress, colors }) {
    const current = SUPPORTED_LOCALES.find(l => l.code === locale);
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[lp.pill, { backgroundColor: colors.bg, borderColor: colors.border }]}
            activeOpacity={0.8}
        >
            <Text style={lp.globe}>🌐</Text>
            <Text style={[lp.code, { color: colors.textPrimary }]}>{current?.flag || '🌐'} {current?.label || 'EN'}</Text>
        </TouchableOpacity>
    );
}
const lp = StyleSheet.create({
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
    globe: { fontSize: 15 },
    code: { fontSize: 13, fontWeight: '500' },
});

// ─── Moon/Sun icon button — exactly like the web ThemeToggle ─────────────
function ThemeIconButton({ theme, onPress, colors }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[tib.btn, { backgroundColor: colors.bg, borderColor: colors.border }]}
            activeOpacity={0.8}
        >
            <Text style={{ fontSize: 18 }}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
    );
}
const tib = StyleSheet.create({
    btn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});

// ─── Language picker modal ────────────────────────────────────────────────
function LangPicker({ visible, locale, onSelect, onClose, colors }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} onPress={onClose}>
                <View style={[lpm.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[lpm.title, { color: colors.textPrimary }]}>Language</Text>
                    {SUPPORTED_LOCALES.map((loc, i) => {
                        const active = locale === loc.code;
                        return (
                            <TouchableOpacity
                                key={loc.code}
                                onPress={() => { onSelect(loc.code); onClose(); }}
                                style={[lpm.row, { borderBottomColor: colors.divider }, active && { backgroundColor: 'rgba(16,185,129,0.07)' }, i === SUPPORTED_LOCALES.length - 1 && { borderBottomWidth: 0 }]}
                                activeOpacity={0.75}
                            >
                                <Text style={{ fontSize: 20 }}>{loc.flag}</Text>
                                <Text style={[lpm.label, { color: active ? '#10b981' : colors.textPrimary }]}>{loc.label}</Text>
                                {active && <Text style={{ color: '#10b981', marginLeft: 'auto', fontSize: 16 }}>✓</Text>}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Pressable>
        </Modal>
    );
}
const lpm = StyleSheet.create({
    box:   { width: SCREEN_WIDTH * 0.8, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingBottom: 4 },
    title: { fontSize: 16, fontWeight: '700', padding: Spacing.md, paddingBottom: 8 },
    row:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
    label: { fontSize: 15, fontWeight: '500', flex: 1 },
});

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function SettingsModal({ visible, onClose }) {
    const { t, locale, setLocale } = useI18n();
    const { theme, setTheme, colors } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // State
    const [activeSection, setActiveSection] = useState('profile');
    const [user, setUser] = useState(null);
    const [profileName, setProfileName] = useState('');
    const [profileBio, setProfileBio]   = useState('');
    const [loggingOut, setLoggingOut]   = useState(false);
    const [langOpen, setLangOpen]        = useState(false);

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const scrollRef = useRef(null);
    const sectionOffsets = useRef({});

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: visible ? 0 : SCREEN_HEIGHT,
            tension: 65, friction: 11, useNativeDriver: true,
        }).start();
    }, [visible]);

    useEffect(() => {
        if (visible) {
            AsyncStorage.getItem('aura_user').then(s => {
                if (s) {
                    const u = JSON.parse(s);
                    setUser(u);
                    setProfileName(u.name || '');
                    setProfileBio(u.bio || '');
                }
            });
        }
    }, [visible]);

    const scrollTo = (id) => {
        setActiveSection(id);
        const offset = sectionOffsets.current[id];
        if (offset !== undefined && scrollRef.current) {
            scrollRef.current.scrollTo({ y: offset, animated: true });
        }
    };

    const handleLogout = async () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out', style: 'destructive', onPress: async () => {
                    setLoggingOut(true);
                    await AsyncStorage.multiRemove(['aura_token', 'aura_user']);
                    onClose();
                    router.replace('/(auth)/login');
                }
            },
        ]);
    };

    const isDark = theme === 'dark';

    // ─── Sidebar ──────────────────────────────────────────────
    const renderSidebar = () => (
        <View style={[sd.sidebar, { borderRightColor: colors.divider }]}>
            {GROUPS.map(group => {
                const items = NAV_SECTIONS.filter(s => s.group === group);
                if (!items.length) return null;
                return (
                    <View key={group} style={sd.group}>
                        <Text style={[sd.groupLabel, { color: colors.textTertiary }]}>{group.toUpperCase()}</Text>
                        {items.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => scrollTo(item.id)}
                                style={[
                                    sd.item,
                                    activeSection === item.id && { backgroundColor: colors.inputBg, borderLeftColor: '#10b981', borderLeftWidth: 2 },
                                ]}
                                activeOpacity={0.7}
                            >
                                <Text style={[sd.itemText, { color: activeSection === item.id ? colors.textPrimary : colors.textSecondary }]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {group === 'Danger' && (
                            <TouchableOpacity onPress={handleLogout} style={sd.item} activeOpacity={0.7}>
                                <Text style={[sd.itemText, { color: colors.textSecondary }]}>↪ Log Out</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                );
            })}
        </View>
    );

    // ─── Content area (scrollable) ────────────────────────────
    const mark = (id) => (layout) => {
        sectionOffsets.current[id] = layout.nativeEvent.layout.y;
    };

    const renderContent = () => (
        <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[cc.content, { paddingBottom: insets.bottom + 40 }]}
            scrollEventThrottle={16}
        >
            {/* ── PROFILE ─────────────────────────────────────── */}
            <View onLayout={mark('profile')}>
                <SectionHeader title="Profile" subtitle="Manage your public identity and personal details." colors={colors} />
                <SettingCard colors={colors}>
                    {/* Avatar row */}
                    <View style={cc.avatarRow}>
                        <LinearGradient colors={['#10b981', '#06b6d4']} style={cc.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            <Text style={cc.avatarText}>{profileName?.[0]?.toUpperCase() || 'U'}</Text>
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                            <Text style={[cc.label, { color: colors.textPrimary }]}>Avatar Image</Text>
                            <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>JPG, PNG or GIF. Max 2MB.</Text>
                        </View>
                    </View>
                    <SettingRow label="Display Name" colors={colors} right={
                        <AuraInput value={profileName} onChangeText={setProfileName} placeholder="Your name" colors={colors} />
                    } />
                    <SettingRow label="Bio" colors={colors} isLast right={
                        <AuraInput value={profileBio} onChangeText={setProfileBio} placeholder="Tell us about yourself" multiline maxLength={120} colors={colors} />
                    } />
                </SettingCard>
            </View>

            {/* ── ACCOUNT & SECURITY ──────────────────────────── */}
            <View onLayout={mark('account')}>
                <SectionHeader title="Account & Security" subtitle="Secure your access and connected services." colors={colors} />
                <SettingCard colors={colors}>
                    <SettingRow label="Email Address" description={user?.email || ''} colors={colors} right={
                        <DestructiveButton label="Edit" colors={colors} onPress={() => {}} />
                    } />
                    <SettingRow label="Password" description="Last changed: recently" colors={colors} isLast right={
                        <DestructiveButton label="Change" colors={colors} onPress={() => {}} />
                    } />
                </SettingCard>
            </View>

            {/* ── APPEARANCE ──────────────────────────────────── */}
            <View onLayout={mark('appearance')}>
                <SectionHeader title="Appearance" subtitle="Customize the UI to your aesthetic preference." colors={colors} />

                {/* Theme row — SegmentedControl exactly like web */}
                <SettingCard colors={colors}>
                    <SettingRow label="Theme" colors={colors} right={
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {/* Moon/Sun icon button — matches the web header ThemeToggle */}
                            <ThemeIconButton theme={theme} onPress={() => setTheme(isDark ? 'light' : 'dark')} colors={colors} />
                        </View>
                    } />
                    {/* Full segmented control below, styled exactly as the web Appearance section */}
                    <View style={{ paddingVertical: 12 }}>
                        <SegmentedControl
                            options={[
                                { value: 'light', label: '☀️  Light' },
                                { value: 'dark',  label: '🌙  Dark'  },
                            ]}
                            value={theme}
                            onChange={setTheme}
                            colors={colors}
                        />
                    </View>
                </SettingCard>

                {/* Language row — Globe + locale pill like web header */}
                <SettingCard colors={colors}>
                    <SettingRow label="Language" colors={colors} isLast right={
                        <LanguagePill locale={locale} onPress={() => setLangOpen(true)} colors={colors} />
                    } />
                </SettingCard>
            </View>

            {/* ── DATA & PRIVACY ──────────────────────────────── */}
            <View onLayout={mark('data')}>
                <SectionHeader title="Data & Privacy" subtitle="Control your data and how it's used." colors={colors} />
                <SettingCard colors={colors}>
                    <SettingRow label="Data Export" description="Download all your wellness history." colors={colors} right={
                        <DestructiveButton label="Download" colors={colors} onPress={() => Alert.alert('Export', 'Feature coming soon.')} />
                    } />
                    <SettingRow label="Data Retention" description="How long we keep your data." colors={colors} isLast right={
                        <View style={[{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>Forever</Text>
                        </View>
                    } />
                </SettingCard>
            </View>

            {/* ── DANGER ZONE ─────────────────────────────────── */}
            <View onLayout={mark('danger')}>
                <View style={[cc.dangerZone, { borderColor: '#ef444440' }]}>
                    <Text style={[cc.dangerTitle, { color: colors.textPrimary }]}>Danger Zone</Text>
                    <SettingRow label="Deactivate Account" description="Temporarily disable your profile." colors={colors} right={
                        <DestructiveButton label="Deactivate" colors={colors} onPress={() => Alert.alert('Deactivate', 'Feature coming soon.')} />
                    } />
                    <SettingRow label="Delete Account" description="Permanently remove all data. Cannot be undone." colors={colors} isLast right={
                        <DestructiveButton label="Delete Account" danger colors={colors} onPress={() => Alert.alert('Delete Account', 'This action is permanent and cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive' }])} />
                    } />
                </View>
            </View>
        </ScrollView>
    );

    return (
        <>
            <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
                <Pressable style={s.backdrop} onPress={onClose} />

                <Animated.View style={[
                    s.sheet,
                    {
                        backgroundColor: colors.bg,
                        transform: [{ translateY: slideAnim }],
                        shadowColor: '#000',
                    },
                ]}>
                    {/* Handle */}
                    <View style={[s.handle, { backgroundColor: colors.border }]} />

                    {/* Header bar */}
                    <View style={[s.headerBar, { borderBottomColor: colors.divider }]}>
                        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Settings & Preferences</Text>
                        <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Two-column layout: sidebar + content */}
                    <View style={s.body}>
                        {renderSidebar()}
                        {renderContent()}
                    </View>
                </Animated.View>
            </Modal>

            {/* Language picker */}
            <LangPicker
                visible={langOpen}
                locale={locale}
                onSelect={setLocale}
                onClose={() => setLangOpen(false)}
                colors={colors}
            />
        </>
    );
}

// ─── Sidebar styles ────────────────────────────────────────────────────────
const sd = StyleSheet.create({
    sidebar:    { width: 140, paddingTop: Spacing.sm, paddingBottom: Spacing.md, borderRightWidth: StyleSheet.hairlineWidth },
    group:      { marginBottom: Spacing.lg },
    groupLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, paddingHorizontal: Spacing.sm, marginBottom: 4 },
    item:       { paddingHorizontal: Spacing.sm, paddingVertical: 8, borderRadius: Radius.sm },
    itemText:   { fontSize: 13, fontWeight: '500' },
});

// ─── Content area styles ───────────────────────────────────────────────────
const cc = StyleSheet.create({
    content:    { padding: Spacing.md, paddingTop: Spacing.sm },
    avatarRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
    avatar:     { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 22, color: '#fff', fontWeight: '800' },
    label:      { fontSize: 14, fontWeight: '600' },
    dangerZone: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
    dangerTitle:{ fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
});

// ─── Sheet styles ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: SCREEN_HEIGHT * 0.88,
        borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
        shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
        elevation: 28,
    },
    handle:    { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 2 },
    headerBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    closeBtn:  { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    body:      { flex: 1, flexDirection: 'row' },
});
