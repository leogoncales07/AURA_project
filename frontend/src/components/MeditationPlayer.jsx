'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, Check, X } from 'lucide-react';
import AccessibleDialog from './AccessibleDialog';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { progressCopy } from '@/lib/progress-copy.mjs';
import { practiceElapsed, practicePhase } from '@/lib/practice.mjs';
import { recordId } from '@/lib/record-id.mjs';
import styles from './MeditationPlayer.module.css';

const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
export default function MeditationPlayer({ session, userId, onClose }) {
  const { t, locale } = useI18n();
  const copy = progressCopy(locale);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [complete, setComplete] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [id] = useState(recordId);
  const duration = session.durationSeconds || 180;
  const audio = useRef(null);
  const clock = useRef(0);
  const pending = useRef(false);
  const persisted = useRef(false);
  const mounted = useRef(true);
  const phase = practicePhase(session.practice_id, elapsed);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    if (playing && !complete) element.play().catch(() => { if (mounted.current) { setAudioError(true); setPlaying(false); } });
    else element.pause();
    return () => element.pause();
  }, [playing, complete]);
  useEffect(() => {
    if (!playing || complete) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const element = audio.current;
      const running = !element || (!element.paused && !element.seeking && element.readyState >= 3);
      clock.current = practiceElapsed(clock.current, (now - previous) / 1000, running, duration);
      previous = now;
      setElapsed(clock.current);
      if (clock.current >= duration) { setPlaying(false); setComplete(true); }
    }, 250);
    return () => clearInterval(timer);
  }, [playing, complete, duration]);
  const save = useCallback(async () => {
    if (pending.current || persisted.current) return;
    pending.current = true; setSaving(true); setSaveError(false);
    const result = await api.completeMeditation({ id, user_id: userId, practice_id: session.practice_id, title: session.name,
      duration_seconds: duration, practiced_seconds: Math.round(clock.current) });
    pending.current = false;
    if (!mounted.current) return;
    if (result.error) setSaveError(true); else { persisted.current = true; setSaved(true); }
    setSaving(false);
  }, [id, userId, session.practice_id, session.name, duration]);
  useEffect(() => { if (complete) void save(); }, [complete, save]);
  const toggle = () => { if (audioError) audio.current?.load(); setAudioError(false); setPlaying(value => !value); };
  const step = Math.min((session.steps?.length || 1) - 1, Math.floor(elapsed / duration * (session.steps?.length || 1)));
  return <AccessibleDialog className={styles.dialog} labelledBy="practice-title" onClose={saving ? () => {} : onClose}>
    <header className={styles.header}><div><p>{copy.practice}</p><h2 id="practice-title">{session.name}</h2></div><button onClick={onClose} aria-label={copy.close} disabled={saving}><X size={20} /></button></header>
    <div className={styles.core}>
      {complete ? <><div className={styles.completeCircle}><Check size={46} /></div><h3>{copy.complete}</h3><p role="status">{saving ? copy.saving : saved ? copy.practiceSaved : ''}</p></> : <>
        <div className={styles.circle} data-phase={phase?.name || 'practice'} data-playing={playing} aria-hidden="true" />
        <h3>{phase ? `${t(`meditations.${phase.name}`)} · ${phase.remaining}s` : copy.practice}</h3>
        {!phase && <p className={styles.step}>{session.steps?.[step]}</p>}
      </>}
      {audioError && <p role="alert" className={styles.error}>{copy.audioFailed}</p>}
      {saveError && <div role="alert"><p className={styles.error}>{copy.actionFailed}</p><button className={styles.retry} onClick={save}>{copy.retry}</button></div>}
    </div>
    {session.audioUrl && <audio ref={audio} src={session.audioUrl} loop preload="auto" onError={() => { setAudioError(true); setPlaying(false); }} />}
    <footer className={styles.footer}><progress value={elapsed} max={duration} aria-label={copy.duration} /><div className={styles.times}><span>{formatTime(elapsed)}</span><span>{copy.remaining} · {formatTime(Math.max(0, duration - elapsed))}</span></div>
      {complete ? <button className={styles.done} onClick={onClose} disabled={saving}>{copy.close}</button> : <button className={styles.play} onClick={toggle} aria-label={playing ? copy.pause : copy.play}>{playing ? <Pause size={27} /> : <Play size={27} />}</button>}
    </footer>
  </AccessibleDialog>;
}
