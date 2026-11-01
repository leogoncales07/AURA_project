import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../lib/api';
import { dateLocale, reportHtml } from '../../lib/progress-utils.mjs';
import { useTheme } from '../../constants/Theme';
import { Action, Card, Heading, Muted } from './ui';
export default function Reports({ userId, reports, copy, locale, today, timeZone, userName, onChange }) {
  const { colors } = useTheme();
  const [period, setPeriod] = useState(today.slice(0, 7));
  const [preview, setPreview] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [earlier, setEarlier] = useState([]);
  const version = useRef(0); const pending = useRef(false); const saveId = useRef(null);
  useEffect(() => () => { version.current++; }, []);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(`aura_saved_reports_${userId}`).then(raw => {
      try { const rows = JSON.parse(raw || '[]'); if (active && Array.isArray(rows)) setEarlier(rows.filter(row => typeof row?.filename === 'string').slice(0, 10)); } catch { /* Preserve valid server history when local metadata is old. */ }
    });
    return () => { active = false; };
  }, [userId]);
  const generate = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setPreview(null); saveId.current = null;
    const request = ++version.current;
    const result = await api.previewReport(period, timeZone);
    pending.current = false; if (request !== version.current) return;
    if (result.error) setError(copy.failed); else setPreview({ snapshot: result.data.snapshot, created_at: new Date().toISOString() });
    setBusy(false);
  };
  const save = async () => {
    if (pending.current || !preview) return;
    pending.current = true; setBusy(true); setError('');
    const request = ++version.current;
    if (!saveId.current) {
      const allocated = await api.newProgressId();
      if (request !== version.current) { pending.current = false; return; }
      if (allocated.error) { pending.current = false; setBusy(false); setError(copy.actionFailed); return; }
      saveId.current = allocated.data.id;
    }
    const result = await api.saveReport(saveId.current, preview.snapshot.period, preview.snapshot.timeZone);
    pending.current = false; if (request !== version.current) return;
    if (result.error) setError(copy.actionFailed); else { setPreview(result.data.report); onChange(); }
    setBusy(false);
  };
  const remove = id => Alert.alert(copy.remove, copy.confirmDelete, [{ text: copy.cancel, style: 'cancel' }, { text: copy.remove, style: 'destructive', onPress: async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); const request = ++version.current;
    const result = await api.deleteReport(id);
    pending.current = false; if (request !== version.current) return;
    if (result.error) setError(copy.actionFailed); else { if (preview?.id === id) setPreview(null); onChange(); }
    setBusy(false);
  } }]);
  const exportPdf = async () => {
    if (pending.current || !preview) return;
    pending.current = true; setBusy(true); setError(''); const request = ++version.current;
    try {
      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');
      const html = reportHtml({ ...preview, userName, locale });
      const { uri } = await Print.printToFileAsync({ html });
      if (request !== version.current) return;
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: `AURA ${preview.snapshot.period}` });
      else await Print.printAsync({ html });
    } catch { if (request === version.current) setError(copy.actionFailed); }
    finally { pending.current = false; if (request === version.current) setBusy(false); }
  };
  const year = Number(period.slice(0, 4));
  const changePeriod = value => { version.current++; setPeriod(value); setPreview(null); setError(''); };
  const monthLabel = value => new Date(value + '-15T12:00:00Z').toLocaleDateString(dateLocale(locale), { year: 'numeric', month: 'long', timeZone: 'UTC' });
  const snapshot = preview?.snapshot;
  return <View><Card><Heading>{copy.reports}</Heading><Muted>{copy.reportHint}</Muted><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 18 }}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`${year - 1}`} disabled={busy || year <= 2000} onPress={() => changePeriod(`${year - 1}-${period.slice(5)}`)} style={{ padding: 12 }}><Feather name="chevron-left" size={22} color={colors.primary} /></TouchableOpacity><Text style={{ color: colors.textPrimary, fontSize: 20 }}>{year}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={`${year + 1}`} disabled={busy || year >= Number(today.slice(0, 4))} onPress={() => changePeriod(`${year + 1}-${String(Math.min(Number(period.slice(5)), Number(today.slice(5, 7)))).padStart(2, '0')}`)} style={{ padding: 12 }}><Feather name="chevron-right" size={22} color={colors.primary} /></TouchableOpacity></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>{Array.from({ length: 12 }, (_, index) => { const value = `${year}-${String(index + 1).padStart(2, '0')}`; return <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: value === period }} disabled={busy || value > today.slice(0, 7)} onPress={() => changePeriod(value)} style={{ width: '22%', paddingVertical: 12, borderRadius: 9, alignItems: 'center', backgroundColor: value === period ? colors.primaryDim : colors.inputBg, opacity: value > today.slice(0, 7) ? .35 : 1 }}><Text style={{ color: value === period ? colors.primary : colors.textSecondary, fontSize: 12 }}>{new Date(value + '-15T12:00:00Z').toLocaleDateString(dateLocale(locale), { month: 'short', timeZone: 'UTC' })}</Text></TouchableOpacity>; })}</View><Action disabled={busy} onPress={generate}>{busy ? copy.loading : copy.preview}</Action></Card>
    {!!error && <Muted style={{ color: colors.accentPink, marginBottom: 18 }}>{error}</Muted>}
    {snapshot && <Card><Heading>{monthLabel(snapshot.period)}</Heading><Muted>{copy.generated}: {new Date(preview.created_at).toLocaleDateString(dateLocale(locale))}{preview.id ? ` · ${copy.saved}` : ''}</Muted><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 22 }}>{[[copy.avgMood, snapshot.avgMood == null ? '—' : `${snapshot.avgMood}%`], [copy.avgSleep, snapshot.avgSleep == null ? '—' : `${snapshot.avgSleep} h`], [copy.activeDays, snapshot.daysActive], [copy.activities, snapshot.totalActivities], [copy.practices, snapshot.meditationSessions], [copy.minutes, snapshot.meditationMinutes]].map(([label, value]) => <View key={label} style={{ width: '47%', backgroundColor: colors.inputBg, padding: 15, borderRadius: 12 }}><Text style={{ color: colors.primary, fontSize: 27, marginBottom: 7 }}>{value}</Text><Muted>{label}</Muted></View>)}</View><Heading>{copy.trend}</Heading><Muted>{snapshot.moodTrend == null ? copy.needMore : `${snapshot.moodTrend > 0 ? '+' : ''}${snapshot.moodTrend} · ${copy.trendHint}`}</Muted>
      {snapshot.assessments.map(row => <View key={row.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: .5, borderColor: colors.border }}><Muted>{row.questionnaire}</Muted><Text style={{ color: colors.textPrimary }}>{row.total_score} ? {copy[`risk_${row.risk_level}`] || row.risk_level || "?"}</Text></View>)}<Muted style={{ marginVertical: 20 }}>{copy.reportDisclaimer}</Muted><View style={{ gap: 12 }}>{!preview.id && <Action disabled={busy || !snapshot.totalActivities} onPress={save}>{busy ? copy.saving : copy.saveReport}</Action>}<Action secondary disabled={busy} onPress={exportPdf}>{copy.print}</Action></View>
    </Card>}
    <Card><Heading>{copy.savedReports}</Heading>{!reports.length && <Muted>{copy.noData}</Muted>}{reports.map(report => <View key={report.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: .5, borderColor: colors.border }}><TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => { version.current++; setPreview(report); setPeriod(report.period); setError(''); }} style={{ flex: 1, paddingVertical: 18 }}><Text style={{ color: colors.textPrimary, fontWeight: '600', marginBottom: 7 }}>{monthLabel(report.period)}</Text><Muted>{new Date(report.created_at).toLocaleDateString(dateLocale(locale))} · {copy.open}</Muted></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`${copy.remove} ${monthLabel(report.period)}`} disabled={busy} onPress={() => remove(report.id)} style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}><Feather name="trash-2" size={18} color={colors.textSecondary} /></TouchableOpacity></View>)}</Card>
    {earlier.length > 0 && <Card><Heading>{copy.earlierExports}</Heading><Muted>{copy.earlierHint}</Muted>{earlier.map((row, index) => <View key={index} style={{ marginTop: 16 }}><Muted>{row.filename}</Muted>{typeof row.uri === 'string' && row.uri.startsWith('file://') && <Action secondary disabled={busy} onPress={async () => { try { const Sharing = await import('expo-sharing'); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(row.uri, { mimeType: 'application/pdf' }); else setError(copy.actionFailed); } catch { setError(copy.actionFailed); } }}>{copy.open}</Action>}</View>)}</Card>}
  </View>;
}
