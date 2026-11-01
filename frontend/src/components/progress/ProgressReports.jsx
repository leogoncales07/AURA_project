'use client';
import { useEffect, useRef, useState } from 'react';
import { FileText, Printer, Save, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { dateLocale } from '@/lib/progress-copy.mjs';
import { printReport } from '@/lib/progress-report.mjs';
import { recordId } from '@/lib/record-id.mjs';
import styles from '@/app/reports/page.module.css';

export default function ProgressReports({ userId, reports, copy, locale, today, timeZone, userName, onChange }) {
  const [period, setPeriod] = useState(today.slice(0, 7));
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [earlier, setEarlier] = useState([]);
  const version = useRef(0);
  const saveId = useRef(null);
  const pending = useRef(false);
  useEffect(() => () => { version.current++; }, []);
  useEffect(() => {
    try { const rows = JSON.parse(localStorage.getItem(`aura_web_reports_${userId}`) || '[]'); if (Array.isArray(rows)) setEarlier(rows.filter(row => typeof row?.filename === 'string').slice(0, 10)); } catch { /* An old local history does not affect saved snapshots. */ }
  }, [userId]);
  const loadPreview = async () => {
    if (pending.current) return;
    pending.current = true;
    const request = ++version.current;
    setBusy(true); setError(''); setPreview(null); saveId.current = null;
    const result = await api.previewReport(period, timeZone);
    if (request !== version.current) { pending.current = false; return; }
    if (result.error) setError(copy.failed); else setPreview({ snapshot: result.data.snapshot, created_at: new Date().toISOString() });
    setBusy(false); pending.current = false;
  };
  const save = async () => {
    if (pending.current || !preview) return;
    pending.current = true;
    const request = ++version.current;
    saveId.current ||= recordId();
    setBusy(true); setError('');
    const result = await api.saveReport(saveId.current, preview.snapshot.period, preview.snapshot.timeZone);
    if (request !== version.current) { pending.current = false; return; }
    if (result.error) setError(copy.actionFailed); else { setPreview(result.data.report); onChange(); }
    setBusy(false); pending.current = false;
  };
  const remove = async id => {
    if (pending.current || !window.confirm(copy.confirmDelete)) return;
    pending.current = true; setBusy(true); setError('');
    const request = ++version.current;
    const result = await api.deleteReport(id);
    if (request !== version.current) { pending.current = false; return; }
    if (result.error) setError(copy.actionFailed); else { if (preview?.id === id) setPreview(null); onChange(); }
    setBusy(false); pending.current = false;
  };
  const monthLabel = value => new Date(value + '-15T12:00:00Z').toLocaleDateString(dateLocale(locale), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const snapshot = preview?.snapshot;
  return <div className={styles.reportGrid}>
    <div className={styles.stack}>
      <section className={styles.cardPad}><h2>{copy.reports}</h2><p className={styles.muted}>{copy.reportHint}</p><div className={styles.reportControls}>
        <label>{copy.period}<input type="month" min="2000-01" max={today.slice(0, 7)} value={period} disabled={busy} onChange={event => { version.current++; setPeriod(event.target.value); setPreview(null); setError(''); }} /></label>
        <button className={styles.primary} disabled={busy || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(period) || period > today.slice(0, 7)} onClick={loadPreview}>{busy ? copy.loading : copy.preview}</button>
      </div></section>
      {error && <p className={styles.alert} role="alert">{error}</p>}
      {snapshot && <section className={styles.cardPad}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>AURA · {copy.reports}</p><h2>{monthLabel(snapshot.period)}</h2><p className={styles.caption}>{copy.generated}: {new Date(preview.created_at).toLocaleDateString(dateLocale(locale))}</p></div>{preview.id && <span className={styles.count}>{copy.saved}</span>}</div>
        <div className={styles.reportMetrics}>{[[copy.avgMood, snapshot.avgMood == null ? '—' : `${snapshot.avgMood}%`], [copy.avgSleep, snapshot.avgSleep == null ? '—' : `${snapshot.avgSleep} h`], [copy.activeDays, snapshot.daysActive], [copy.activities, snapshot.totalActivities], [copy.practices, snapshot.meditationSessions], [copy.minutes, snapshot.meditationMinutes]].map(([label, value]) => <div className={styles.reportMetric} key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
        <div className={styles.insight}><strong>{copy.trend}</strong><p>{snapshot.moodTrend == null ? copy.needMore : `${snapshot.moodTrend > 0 ? '+' : ''}${snapshot.moodTrend} · ${copy.trendHint}`}</p></div>
        {snapshot.assessments.length > 0 && <table className={styles.table}><caption>{copy.assessment}</caption><thead><tr><th>{copy.assessment}</th><th>{copy.score}</th><th>{copy.category}</th></tr></thead><tbody>{snapshot.assessments.map(row => <tr key={row.id}><td>{row.questionnaire}</td><td>{row.total_score}</td><td>{copy[`risk_${row.risk_level}`] || row.risk_level || "?"}</td></tr>)}</tbody></table>}
        {!snapshot.totalActivities && <p className={styles.muted}>{copy.noData}</p>}
        <p className={styles.caption}>{copy.reportDisclaimer}</p><div className={styles.actions}>
          {!preview.id && <button className={styles.primary} onClick={save} disabled={busy || !snapshot.totalActivities}><Save size={16} />{busy ? copy.saving : copy.saveReport}</button>}
          <button className={styles.secondary} onClick={() => { if (!printReport({ ...preview, userName, locale })) setError(copy.popupBlocked); }}><Printer size={16} />{copy.print}</button>
        </div>
      </section>}
    </div>
    <section className={styles.cardPad}><h2>{copy.savedReports}</h2>{!reports.length && <p className={styles.empty}>{copy.noData}</p>}<div className={styles.savedList}>{reports.map(report => <div key={report.id} className={styles.savedRow}><FileText size={20} aria-hidden="true" /><button className={styles.savedOpen} disabled={busy} onClick={() => { version.current++; setPreview(report); setPeriod(report.period); setError(''); }}><strong>{monthLabel(report.period)}</strong><span>{new Date(report.created_at).toLocaleDateString(dateLocale(locale))} · {copy.open}</span></button><button className={styles.iconButton} aria-label={`${copy.remove} ${monthLabel(report.period)}`} onClick={() => remove(report.id)} disabled={busy}><Trash2 size={16} /></button></div>)}</div>
      {earlier.length > 0 && <section style={{ marginTop: 28 }}><h3>{copy.earlierExports}</h3><p className={styles.caption}>{copy.earlierHint}</p>{earlier.map((row, index) => <p key={index} className={styles.caption} style={{ marginTop: 12 }}>{row.filename}</p>)}</section>}
    </section>
  </div>;
}
