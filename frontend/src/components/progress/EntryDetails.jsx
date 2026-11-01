'use client';
import { useEffect, useState } from 'react';
import { X, PenLine, Trash2 } from 'lucide-react';
import AccessibleDialog from '@/components/AccessibleDialog';
import { api } from '@/lib/api';
import { formatDay } from '@/lib/progress-copy.mjs';
import { entryTitle } from './JourneyTimeline';
import styles from '@/app/reports/page.module.css';

export default function EntryDetails({ entry, copy, locale, onClose, onChange }) {
  const row = entry.record;
  const [questionnaire, setQuestionnaire] = useState(null);
  const [questionError, setQuestionError] = useState(false);
  const [questionRetry, setQuestionRetry] = useState(0);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(row.text || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (entry.kind !== 'assessment') return;
    let active = true;
    setQuestionError(false); setQuestionnaire(null);
    api.getQuestionnaire(row.questionnaire === 'PSS' ? 'PSS-10' : row.questionnaire, locale).then(result => {
      if (!active) return;
      if (result.error) setQuestionError(true); else setQuestionnaire(result.data);
    });
    return () => { active = false; };
  }, [entry.kind, row.questionnaire, locale, questionRetry]);
  const mutate = async remove => {
    if (busy || (remove && !window.confirm(copy.confirmDelete))) return;
    setBusy(true); setError(false);
    const result = remove ? await api.deleteReflection(row.id) : await api.editReflection(row.id, text);
    if (result.error) { setError(true); setBusy(false); } else onChange();
  };
  const details = entry.kind === 'sleep' ? [[copy.duration, `${row.hours} h`], [copy.bedtime, row.bedTime], [copy.wakeTime, row.wakeTime], [copy.quality, row.quality == null ? null : `${row.quality}%`]]
    : entry.kind === 'meditation' ? [[copy.duration, `${Math.round(row.practiced_seconds / 60)} min`]]
    : entry.kind === 'mood' ? [[copy.mood, row.mood_score == null ? null : `${row.mood_score}/10`], [copy.sleep, row.sleep_hours == null ? null : `${row.sleep_hours} h`]] : [];
  return <AccessibleDialog className={styles.dialog} labelledBy="entry-title" onClose={busy ? () => {} : onClose}>
    <div className={styles.dialogHeader}><div><p className={styles.eyebrow}>{copy[entry.kind]} · {formatDay(entry.day, locale)}</p><h2 id="entry-title">{entryTitle(entry, copy)}</h2></div><button className={styles.iconButton} aria-label={copy.close} onClick={onClose} disabled={busy}><X size={20} /></button></div>
    <div className={styles.dialogBody}>
      {details.length > 0 && <dl className={styles.detailGrid}>{details.filter(([, value]) => value != null).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
      {!!row.notes && <section><h3>{copy.notes}</h3><p className={styles.prose}>{row.notes}</p></section>}
      {entry.kind === 'reflection' && <>
        {!!row.prompt && <section><h3>{copy.prompt}</h3><p className={styles.muted}>{row.prompt}</p></section>}
        {editing ? <label className={styles.editLabel}>{copy.reflection}<textarea value={text} onChange={event => setText(event.target.value)} rows={8} maxLength={6000} disabled={busy} /></label> : <p className={styles.prose}>{row.text}</p>}
      </>}
      {entry.kind === 'assessment' && <>
        <div className={styles.assessmentScore}><strong>{row.total_score}</strong><span>{copy.score} · {row.questionnaire}</span></div>
        <p className={styles.muted}>{copy.category}: <strong>{copy[`risk_${row.risk_level}`] || row.risk_level || '—'}</strong><br />{copy.screeningNote}</p>
        {!!row.ai_summary && <section><h3>{copy.analysis}</h3><p className={styles.caption}>{copy.original}{row.language ? ` · ${row.language.toUpperCase()}` : ''}</p><p className={styles.prose}>{row.ai_summary}</p></section>}
        <section><h3>{copy.answers}</h3>{questionError && <p role="alert">{copy.failed} <button className={styles.textButton} onClick={() => setQuestionRetry(value => value + 1)}>{copy.retry}</button></p>}
          {!questionnaire && !questionError && <p role="status">{copy.loading}</p>}
          {questionnaire && (Array.isArray(row.answers) ? <ol className={styles.answers}>{row.answers.map((answer, index) => <li key={index}><p>{questionnaire.questions[index] || `${copy.assessment} ${index + 1}`}</p><strong>{questionnaire.options.find(option => option.value === answer)?.text ?? answer}</strong></li>)}</ol> : <pre className={styles.prose}>{JSON.stringify(row.answers, null, 2)}</pre>)}
        </section>
      </>}
      {error && <p role="alert" className={styles.alert}>{copy.actionFailed}</p>}
    </div>
    {entry.kind === 'reflection' && <div className={styles.dialogFooter}>{editing ? <><button className={styles.secondary} onClick={() => { setEditing(false); setText(row.text); }} disabled={busy}>{copy.cancel}</button><button className={styles.primary} onClick={() => mutate(false)} disabled={busy || !text.trim()}>{busy ? copy.saving : copy.save}</button></> : <><button className={styles.danger} onClick={() => mutate(true)} disabled={busy}><Trash2 size={16} />{copy.remove}</button><button className={styles.secondary} onClick={() => setEditing(true)} disabled={busy}><PenLine size={16} />{copy.edit}</button></>}</div>}
  </AccessibleDialog>;
}
