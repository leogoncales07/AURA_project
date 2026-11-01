import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../constants/Theme';
import { entryTitle, entryPreview, formatDay } from '../../lib/progress-utils.mjs';
import { Card, Heading, Muted, EntryRow, Action, kindIcons } from './ui';
export default function Timeline({ entries, copy, locale, initialType, onOpen }) {
  const { colors } = useTheme();
  const [type, setType] = useState(initialType);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [limit, setLimit] = useState(20);
  useEffect(() => { setType(initialType); }, [initialType]);
  useEffect(() => { setLimit(20); }, [type, search, from, to]);
  const validDate = value => { if (!value) return true; const date = new Date(value + 'T12:00:00Z'); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; };
  const valid = validDate(from) && validDate(to) && (!from || !to || from <= to);
  const filtered = entries.filter(entry => (type === 'all' || entry.kind === type) && (!from || !valid || entry.day >= from) && (!to || !valid || entry.day <= to) && `${entryTitle(entry, copy)} ${entryPreview(entry, copy)}`.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale)));
  const grouped = filtered.slice(0, limit).reduce((groups, entry) => { (groups[entry.day] ||= []).push(entry); return groups; }, {});
  const inputStyle = { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.textPrimary, borderRadius: 12, minHeight: 44, paddingHorizontal: 14, paddingVertical: 10 };
  return <View><Heading>{copy.journey}</Heading><Muted>{copy.emptyHint}</Muted><TextInput accessibilityLabel={copy.search} placeholder={copy.search} placeholderTextColor={colors.textTertiary} value={search} onChangeText={setSearch} style={[inputStyle, { marginVertical: 16 }]} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>{['all', ...Object.keys(kindIcons)].map(kind => <TouchableOpacity key={kind} accessibilityRole="button" accessibilityState={{ selected: type === kind }} onPress={() => setType(kind)} style={{ padding: 12, borderRadius: 10, backgroundColor: type === kind ? colors.primaryDim : colors.inputBg, marginRight: 8 }}><Text style={{ color: type === kind ? colors.primary : colors.textSecondary, fontSize: 12 }}>{copy[kind]}</Text></TouchableOpacity>)}</ScrollView>
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>{[[copy.from, from, setFrom], [copy.to, to, setTo]].map(([label, value, set]) => <View key={label} style={{ flex: 1, gap: 7 }}><Muted>{label}</Muted><TextInput accessibilityLabel={`${label} YYYY-MM-DD`} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} maxLength={10} autoCapitalize="none" value={value} onChangeText={set} style={inputStyle} /></View>)}</View>
    {!valid && <Muted>YYYY-MM-DD</Muted>}
    {!!(search || type !== 'all' || from || to) && <View style={{ marginBottom: 16 }}><Action secondary onPress={() => { setSearch(''); setType('all'); setFrom(''); setTo(''); }}>{copy.clear}</Action></View>}
    {!filtered.length && <Card><Muted>{entries.length ? copy.noMatches : copy.empty}</Muted></Card>}
    {Object.entries(grouped).map(([day, rows]) => <View key={day}><Muted style={{ marginBottom: 9 }}>{formatDay(day, locale)}</Muted><Card>{rows.map(entry => <EntryRow key={entry.id} entry={entry} copy={copy} locale={locale} onOpen={onOpen} />)}</Card></View>)}
    {limit < filtered.length && <Action secondary onPress={() => setLimit(value => value + 20)}>{copy.loadMore}</Action>}
  </View>;
}
