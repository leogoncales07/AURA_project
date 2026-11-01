import { useEffect, useState } from 'react';
import { View, Text, Modal, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/Theme';
import { api } from '../../lib/api';
import { entryTitle, formatDay } from '../../lib/progress-utils.mjs';
import { Card, Heading, Muted, Action } from './ui';
export default function EntryModal({ entry, copy, locale, onClose, onChange }) {
  const { colors } = useTheme(); const insets = useSafeAreaInsets();
  const row = entry.record;
  const [questionnaire, setQuestionnaire] = useState(null);
  const [questionError, setQuestionError] = useState(false); const [retry, setRetry] = useState(0);
  const [editing, setEditing] = useState(false); const [text, setText] = useState(row.text || '');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  useEffect(() => {
    if (entry.kind !== 'assessment') return;
    let active = true; setQuestionError(false);
    api.getQuestionnaire(row.questionnaire === 'PSS' ? 'PSS-10' : row.questionnaire, locale).then(result => {
      if (active) { if (result.error) setQuestionError(true); else setQuestionnaire(result.data); }
    });
    return () => { active = false; };
  }, [entry.kind, row.questionnaire, locale, retry]);
  const mutate = async remove => {
    setBusy(true); setError(false);
    const result = remove ? await api.deleteReflection(row.id) : await api.editReflection(row.id, text);
    if (result.error) { setError(true); setBusy(false); } else onChange();
  };
  const askDelete = () => Alert.alert(copy.remove, copy.confirmDelete, [{ text: copy.cancel, style: 'cancel' }, { text: copy.remove, style: 'destructive', onPress: () => mutate(true) }]);
  const textStyle = { color: colors.textPrimary, fontSize: 15, lineHeight: 26 };
  const detailRows = entry.kind === 'sleep' ? [[copy.duration, `${row.hours} h`], [copy.bedtime, row.bedTime], [copy.wakeTime, row.wakeTime], [copy.quality, row.quality == null ? null : `${row.quality}%`]] : entry.kind === 'mood' ? [[copy.mood, row.mood_score == null ? null : `${row.mood_score}/10`], [copy.sleep, row.sleep_hours == null ? null : `${row.sleep_hours} h`]] : entry.kind === 'meditation' ? [[copy.duration, `${Math.round(row.practiced_seconds / 60)} min`]] : [];
  return <Modal visible animationType="slide" onRequestClose={busy ? () => {} : onClose}><KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View accessibilityViewIsModal style={{ flex: 1, paddingTop: insets.top }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}><View style={{ flex: 1 }}><Muted>{copy[entry.kind]} · {formatDay(entry.day, locale)}</Muted><Heading>{entryTitle(entry, copy)}</Heading></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.close} disabled={busy} onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Feather name="x" size={23} color={colors.textPrimary} /></TouchableOpacity></View>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }} keyboardShouldPersistTaps="handled">
      {detailRows.filter(([, value]) => value != null).map(([label, value]) => <Card key={label}><Muted>{label}</Muted><Text style={[textStyle, { fontSize: 23, marginTop: 8 }]}>{value}</Text></Card>)}
      {!!row.notes && <Card><Heading>{copy.notes}</Heading><Text selectable style={textStyle}>{row.notes}</Text></Card>}
      {entry.kind === 'reflection' && <Card>{!!row.prompt && <><Heading>{copy.prompt}</Heading><Muted>{row.prompt}</Muted></>}{editing ? <TextInput accessibilityLabel={copy.reflection} multiline textAlignVertical="top" maxLength={6000} value={text} onChangeText={setText} editable={!busy} style={[textStyle, { minHeight: 180, marginTop: 16, padding: 12, backgroundColor: colors.inputBg, borderRadius: 12 }]} /> : <Text selectable style={[textStyle, { marginTop: 16 }]}>{row.text}</Text>}</Card>}
      {entry.kind === 'assessment' && <><Card><Muted>{copy.score}</Muted><Text style={{ color: colors.primary, fontSize: 48, marginVertical: 10 }}>{row.total_score}</Text><Muted>{copy.category}: {copy[`risk_${row.risk_level}`] || row.risk_level || '—'}</Muted><Muted style={{ marginTop: 12 }}>{copy.screeningNote}</Muted></Card>{!!row.ai_summary && <Card><Heading>{copy.analysis}</Heading><Muted>{copy.original}{row.language ? ` · ${row.language.toUpperCase()}` : ''}</Muted><Text selectable style={[textStyle, { marginTop: 14 }]}>{row.ai_summary}</Text></Card>}<Card><Heading>{copy.answers}</Heading>{questionError ? <><Muted>{copy.failed}</Muted><Action secondary onPress={() => setRetry(value => value + 1)}>{copy.retry}</Action></> : !questionnaire ? <Muted>{copy.loading}</Muted> : Array.isArray(row.answers) ? row.answers.map((answer, index) => <View key={index} style={{ marginBottom: 20 }}><Text style={textStyle}>{index + 1}. {questionnaire.questions[index]}</Text><Text style={{ color: colors.primary, fontWeight: '600', marginTop: 8 }}>{questionnaire.options.find(option => option.value === answer)?.text ?? answer}</Text></View>) : <Text style={textStyle}>{JSON.stringify(row.answers)}</Text>}</Card></>}
      {error && <Muted style={{ color: colors.accentPink, marginBottom: 16 }}>{copy.actionFailed}</Muted>}
      {entry.kind === 'reflection' && <View style={{ gap: 12 }}>{editing ? <><Action disabled={busy || !text.trim()} onPress={() => mutate(false)}>{busy ? copy.saving : copy.save}</Action><Action secondary disabled={busy} onPress={() => { setEditing(false); setText(row.text); }}>{copy.cancel}</Action></> : <><Action secondary onPress={() => setEditing(true)} disabled={busy}>{copy.edit}</Action><Action secondary danger onPress={askDelete} disabled={busy}>{copy.remove}</Action></>}</View>}
    </ScrollView></View></KeyboardAvoidingView></Modal>;
}
