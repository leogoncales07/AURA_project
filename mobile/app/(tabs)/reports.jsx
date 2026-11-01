import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { progressCopy } from '../../lib/progress-utils.mjs';
import { useI18n } from '../../i18n';
import { useTheme } from '../../constants/Theme';
import Overview from '../../components/progress/Overview';
import Timeline from '../../components/progress/Timeline';
import Reports from '../../components/progress/Reports';
import EntryModal from '../../components/progress/EntryModal';
import { Action, Muted } from '../../components/progress/ui';

const views = ['overview', 'journey', 'reports'];
const icons = { overview: 'activity', journey: 'book-open', reports: 'file-text' };
export default function ProgressScreen() {
  const { colors } = useTheme(); const { locale } = useI18n(); const copy = progressCopy(locale);
  const insets = useSafeAreaInsets(); const router = useRouter(); const params = useLocalSearchParams();
  const [view, setView] = useState('overview'); const [type, setType] = useState('all');
  const [user, setUser] = useState(null); const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(false); const [selected, setSelected] = useState(null);
  const version = useRef(0);
  const now = new Date(); const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const load = useCallback(async () => {
    const request = ++version.current; setLoading(true); setError(false);
    const raw = await AsyncStorage.getItem('aura_user'); let current;
    try { current = raw ? JSON.parse(raw) : null; } catch { current = null; }
    if (request !== version.current) return;
    if (!current?.id) { router.replace('/(auth)/login'); return; }
    setUser(current);
    const result = await api.getProgress(timeZone);
    if (request !== version.current) return;
    if (result.error) setError(true); else setData({ ...result.data, ownerId: current.id });
    setLoading(false);
  }, [router, timeZone]);
  useFocusEffect(useCallback(() => { void load(); return () => { version.current++; }; }, [load]));
  useEffect(() => { if (views.includes(params.view)) setView(params.view); if (params.type) setType(params.type); }, [params.view, params.type]);
  const owns = Boolean(user?.id && user.id === data?.ownerId);
  useEffect(() => {
    if (params.entry && data?.ownerId === user?.id && user?.id) { const entry = data.entries.find(row => row.id === params.entry); if (entry) setSelected({ ...entry, ownerId: user.id }); }
  }, [params.entry, data, user?.id]);
  const open = entry => setSelected({ ...entry, ownerId: user.id });
  const close = () => { setSelected(null); if (params.entry) router.setParams({ entry: undefined }); };
  return <View style={{ flex: 1, backgroundColor: colors.bg }}><ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 18, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={loading && owns} onRefresh={load} tintColor={colors.primary} />} keyboardShouldPersistTaps="handled">
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}><Text accessibilityRole="header" style={{ color: colors.textPrimary, fontSize: 30, fontWeight: '600' }}>{copy.progress}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.refresh} disabled={loading} onPress={load} style={{ padding: 12 }}><Feather name="refresh-cw" size={20} color={colors.primary} /></TouchableOpacity></View><Muted>{copy.subtitle}</Muted>
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', padding: 5, gap: 4, borderRadius: 14, backgroundColor: colors.inputBg, marginVertical: 24 }}>{views.map(name => <TouchableOpacity key={name} accessibilityRole="tab" accessibilityState={{ selected: view === name }} onPress={() => { setView(name); setType('all'); router.setParams({ view: name, type: undefined, entry: undefined }); }} style={{ flex: 1, minHeight: 48, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, backgroundColor: view === name ? colors.card : 'transparent' }}><Feather name={icons[name]} size={16} color={view === name ? colors.primary : colors.textSecondary} /><Text style={{ fontSize: 11, color: view === name ? colors.textPrimary : colors.textSecondary }}>{copy[name]}</Text></TouchableOpacity>)}</View>
    {error && <View accessibilityRole="alert" style={{ marginBottom: 20, gap: 12 }}><Muted>{copy.failed}</Muted><Action secondary onPress={load}>{copy.retry}</Action></View>}
    {loading && !owns && <ActivityIndicator size="large" color={colors.primary} />}
    {owns && (view === 'overview' ? <Overview entries={data.entries} copy={copy} locale={locale} today={today} onOpen={open} onJourney={kind => { setType(kind); setView('journey'); }} /> : view === 'journey' ? <Timeline entries={data.entries} copy={copy} locale={locale} initialType={type} onOpen={open} /> : <Reports key={user.id} userId={user.id} reports={data.reports} copy={copy} locale={locale} today={today} timeZone={timeZone} userName={user.name || user.email || 'AURA'} onChange={load} />)}
  </ScrollView>{selected?.ownerId === user?.id && user?.id && <EntryModal key={selected.id} entry={selected} copy={copy} locale={locale} onClose={close} onChange={() => { close(); void load(); }} />}</View>;
}
