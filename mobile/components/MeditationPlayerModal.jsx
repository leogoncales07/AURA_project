import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, AppState, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../constants/Theme';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import { progressCopy, practiceElapsed, practicePhase, audioPracticeDelta } from '../lib/progress-utils.mjs';

export default function MeditationPlayerModal({ session, userId, onClose }) {
  const { colors } = useTheme(); const { t, locale } = useI18n(); const copy = progressCopy(locale); const insets = useSafeAreaInsets();
  const duration = session.durationMin * 60;
  const id = useRef(null);
  const [elapsed, setElapsed] = useState(0); const [playing, setPlaying] = useState(false);
  const [complete, setComplete] = useState(false); const [saved, setSaved] = useState(false); const [saving, setSaving] = useState(false);
  const [audioLoading, setAudioLoading] = useState(Boolean(session.audioUrl)); const [audioError, setAudioError] = useState(false); const [audioRetry, setAudioRetry] = useState(0); const [saveError, setSaveError] = useState(false);
  const sound = useRef(null); const clock = useRef(0); const lastPosition = useRef(null);
  const mounted = useRef(true); const pending = useRef(false); const persisted = useRef(false); const ended = useRef(false);
  const phase = practicePhase(session.practice_id, elapsed);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const advance = useCallback(delta => {
    if (ended.current) return;
    clock.current = practiceElapsed(clock.current, delta, true, duration);
    setElapsed(clock.current);
    if (clock.current >= duration) { ended.current = true; setComplete(true); setPlaying(false); sound.current?.pauseAsync().catch(() => {}); }
  }, [duration]);
  useEffect(() => {
    if (!session.audioUrl) return;
    let active = true; let loadedSound;
    setAudioLoading(true); setAudioError(false);
    const statusUpdate = status => {
      if (!active || !mounted.current) return;
      if (!status.isLoaded) { if (status.error) { setAudioError(true); setPlaying(false); } return; }
      advance(audioPracticeDelta(lastPosition.current, status));
      lastPosition.current = status.positionMillis;
      if (!ended.current) setPlaying(status.isPlaying);
    };
    (async () => {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true, staysActiveInBackground: true, shouldDuckAndroid: true });
        const source = typeof session.audioUrl === 'string' ? { uri: session.audioUrl } : session.audioUrl;
        const result = await Audio.Sound.createAsync(source, { shouldPlay: false, isLooping: true, progressUpdateIntervalMillis: 250 }, statusUpdate);
        loadedSound = result.sound;
        if (!active) { await loadedSound.unloadAsync(); return; }
        sound.current = loadedSound; setAudioLoading(false);
      } catch { if (active) { setAudioLoading(false); setAudioError(true); setPlaying(false); } }
    })();
    return () => { active = false; sound.current = null; loadedSound?.unloadAsync().catch(() => {}); };
  }, [session.audioUrl, advance, audioRetry]);
  useEffect(() => {
    if (session.audioUrl || !playing || complete) return;
    let previous = performance.now();
    const timer = setInterval(() => { const now = performance.now(); advance((now - previous) / 1000); previous = now; }, 250);
    const listener = AppState.addEventListener('change', state => { if (state !== 'active') setPlaying(false); });
    return () => { clearInterval(timer); listener.remove(); };
  }, [session.audioUrl, playing, complete, advance]);
  const save = useCallback(async () => {
    if (pending.current || persisted.current) return;
    pending.current = true; setSaving(true); setSaveError(false);
    if (!id.current) {
      const allocated = await api.newProgressId();
      if (!mounted.current) { pending.current = false; return; }
      if (allocated.error) { pending.current = false; setSaving(false); setSaveError(true); return; }
      id.current = allocated.data.id;
    }
    const result = await api.completeMeditation({ id: id.current, user_id: userId, practice_id: session.practice_id, title: session.title,
      duration_seconds: duration, practiced_seconds: Math.round(clock.current) });
    pending.current = false; if (!mounted.current) return;
    if (result.error) setSaveError(true); else { persisted.current = true; setSaved(true); }
    setSaving(false);
  }, [userId, session.practice_id, session.title, duration]);
  useEffect(() => { if (complete) void save(); }, [complete, save]);
  const toggle = async () => {
    if (audioError) { lastPosition.current = null; setAudioRetry(value => value + 1); return; }
    if (session.audioUrl) {
      try { if (playing) await sound.current?.pauseAsync(); else await sound.current?.playAsync(); }
      catch { setAudioError(true); setPlaying(false); }
    } else setPlaying(value => !value);
  };
  const remaining = Math.max(0, Math.ceil(duration - elapsed));
  const time = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
  return <Modal visible animationType="slide" onRequestClose={saving ? () => {} : onClose}><View accessibilityViewIsModal style={[styles.page, { backgroundColor: colors.bg, paddingTop: insets.top + 15, paddingBottom: insets.bottom + 20 }]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.close} disabled={saving} onPress={onClose} style={styles.close}><Feather name="x" size={24} color={colors.textPrimary} /></TouchableOpacity>
    <View style={styles.core}><View style={[styles.art, { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}>{complete ? <Feather name="check" size={56} color={colors.primary} /> : <Feather name="wind" size={56} color={colors.primary} />}</View><Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>{complete ? copy.complete : session.title}</Text><Text style={[styles.meta, { color: colors.textSecondary }]}>{complete ? (saving ? copy.saving : saved ? copy.practiceSaved : '') : phase ? `${t(`meditations.${phase.name}`)} · ${phase.remaining}s` : session.meta}</Text>
      <Text style={[styles.timer, { color: colors.textPrimary }]}>{time}</Text>
      {audioLoading && <ActivityIndicator color={colors.primary} />}
      {audioError && <Text accessibilityRole="alert" style={[styles.message, { color: colors.accentPink }]}>{copy.audioFailed}</Text>}
      {saveError && <><Text accessibilityRole="alert" style={[styles.message, { color: colors.accentPink }]}>{copy.actionFailed}</Text><TouchableOpacity accessibilityRole="button" onPress={save} style={styles.retry}><Text style={{ color: colors.primary }}>{copy.retry}</Text></TouchableOpacity></>}
      <TouchableOpacity accessibilityRole="button" disabled={saving || audioLoading} style={[styles.button, { backgroundColor: colors.primary, opacity: saving || audioLoading ? .5 : 1 }]} onPress={complete ? onClose : toggle}><Text style={{ color: '#062f29', fontWeight: '600', fontSize: 16 }}>{complete ? copy.close : audioError ? copy.retry : playing ? copy.pause : copy.play}</Text></TouchableOpacity>
    </View></View></Modal>;
}
const styles = StyleSheet.create({ page: { flex: 1, paddingHorizontal: 25 }, close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' }, core: { flex: 1, alignItems: 'center', justifyContent: 'center' }, art: { width: 170, height: 170, borderRadius: 85, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 30 }, title: { fontSize: 25, fontWeight: '600', textAlign: 'center', marginBottom: 16 }, meta: { fontSize: 14, lineHeight: 23, textAlign: 'center', minHeight: 48 }, timer: { fontSize: 60, fontWeight: '300', marginVertical: 28 }, button: { minHeight: 52, borderRadius: 26, paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center', width: '100%' }, message: { fontSize: 13, lineHeight: 22, marginBottom: 15, textAlign: 'center' }, retry: { minHeight: 44, justifyContent: 'center', marginBottom: 10 } });
