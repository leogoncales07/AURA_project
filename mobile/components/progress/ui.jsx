import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../constants/Theme';
import { entryTitle, entryPreview, formatDay } from '../../lib/progress-utils.mjs';
export const kindIcons = { mood: 'activity', sleep: 'moon', reflection: 'edit-3', assessment: 'clipboard', meditation: 'wind' };
export function Action({ children, onPress, disabled, secondary, danger, label }) {
  const { colors } = useTheme();
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[s.button, { backgroundColor: secondary ? colors.inputBg : colors.primary, opacity: disabled ? .5 : 1 }]}><Text style={{ color: danger ? colors.accentPink : secondary ? colors.textPrimary : '#062f29', fontWeight: '600', fontSize: 13, textAlign: 'center' }}>{children}</Text></TouchableOpacity>;
}
export function Card({ children, style }) { const { colors } = useTheme(); return <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>; }
export function Heading({ children }) { const { colors } = useTheme(); return <Text accessibilityRole="header" style={[s.heading, { color: colors.textPrimary }]}>{children}</Text>; }
export function Muted({ children, style }) { const { colors } = useTheme(); return <Text style={[s.muted, { color: colors.textSecondary }, style]}>{children}</Text>; }
export function EntryRow({ entry, copy, locale, onOpen }) {
  const { colors } = useTheme();
  return <TouchableOpacity accessibilityRole="button" onPress={() => onOpen(entry)} style={[s.row, { borderBottomColor: colors.border }]}><View style={[s.icon, { backgroundColor: colors.primaryDim }]}><Feather name={kindIcons[entry.kind]} size={18} color={colors.primary} /></View><View style={{ flex: 1, gap: 5 }}><Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{entryTitle(entry, copy)}</Text><Text numberOfLines={2} style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 19 }}>{entryPreview(entry, copy)}</Text><Text style={{ color: colors.textTertiary, fontSize: 11 }}>{formatDay(entry.day, locale)}</Text></View><Feather name="chevron-right" size={16} color={colors.textTertiary} /></TouchableOpacity>;
}
export const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 20, marginBottom: 18 },
  heading: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  muted: { fontSize: 13, lineHeight: 21 },
  button: { minHeight: 44, paddingHorizontal: 17, paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
