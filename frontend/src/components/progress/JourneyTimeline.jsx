'use client';
import { useEffect, useMemo, useState } from 'react';
import { Activity, Moon, PenLine, ClipboardList, Wind, ChevronRight, Search } from 'lucide-react';
import { formatDay } from '@/lib/progress-copy.mjs';
import styles from '@/app/reports/page.module.css';
export const entryIcons = { mood: Activity, sleep: Moon, reflection: PenLine, assessment: ClipboardList, meditation: Wind };
export function entryTitle(entry, copy) { return entry.kind === 'assessment' ? entry.record.questionnaire : entry.kind === 'meditation' ? entry.record.title : copy[entry.kind]; }
export function entryPreview(entry, copy) {
  const row = entry.record;
  switch (entry.kind) {
    case 'mood': return `${row.mood_score != null ? row.mood_score + '/10' : ''}${row.notes ? ' · ' + row.notes : ''}`;
    case 'sleep': return `${row.hours} h${row.bedTime && row.wakeTime ? ` · ${row.bedTime}–${row.wakeTime}` : ''}`;
    case 'reflection': return row.text;
    case 'assessment': return `${copy.score}: ${row.total_score}`;
    case 'meditation': return `${Math.round(row.practiced_seconds / 60)} min`;
    default: return '';
  }
}
export function EntryRow({ entry, copy, locale, onOpen }) {
  const Icon = entryIcons[entry.kind];
  return <button className={styles.entry} onClick={() => onOpen(entry)}><span className={styles.entryIcon} data-kind={entry.kind}><Icon size={19} /></span><span className={styles.entryBody}><strong>{entryTitle(entry, copy)}</strong><span>{entryPreview(entry, copy)}</span></span><span className={styles.entryDate}>{formatDay(entry.day, locale)}</span><ChevronRight size={17} aria-hidden="true" /></button>;
}
export default function JourneyTimeline({ entries, copy, locale, initialType, onOpen }) {
  const [type, setType] = useState(initialType);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limit, setLimit] = useState(20);
  useEffect(() => { setType(initialType); }, [initialType]);
  useEffect(() => { setLimit(20); }, [type, search, from, to]);
  const filtered = useMemo(() => entries.filter(entry => (type === 'all' || entry.kind === type) && (!from || entry.day >= from) && (!to || entry.day <= to) && `${entryTitle(entry, copy)} ${entryPreview(entry, copy)}`.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale))), [entries, type, search, from, to, locale, copy]);
  const grouped = filtered.slice(0, limit).reduce((groups, entry) => { (groups[entry.day] ||= []).push(entry); return groups; }, {});
  return <div className={styles.stack}>
    <div className={styles.sectionHeading}><div><h2>{copy.journey}</h2><p className={styles.muted}>{copy.emptyHint}</p></div><span className={styles.count} aria-live="polite">{filtered.length}</span></div>
    <div className={styles.filters}>
      <label className={styles.search}><Search size={17} aria-hidden="true" /><input aria-label={copy.search} placeholder={copy.search} value={search} onChange={event => setSearch(event.target.value)} /></label>
      <label><span>{copy.all}</span><select value={type} onChange={event => setType(event.target.value)}><option value="all">{copy.all}</option>{Object.keys(entryIcons).map(kind => <option key={kind} value={kind}>{copy[kind]}</option>)}</select></label>
      <label><span>{copy.from}</span><input type="date" value={from} max={to || undefined} onChange={event => setFrom(event.target.value)} /></label>
      <label><span>{copy.to}</span><input type="date" value={to} min={from || undefined} onChange={event => setTo(event.target.value)} /></label>
    </div>
    {(search || type !== 'all' || from || to) && <button className={styles.textButton} onClick={() => { setSearch(''); setType('all'); setFrom(''); setTo(''); }}>{copy.clear}</button>}
    {!filtered.length && <div className={styles.empty}><h3>{entries.length ? copy.noMatches : copy.empty}</h3><p>{copy.emptyHint}</p></div>}
    {Object.entries(grouped).map(([day, rows]) => <section key={day} className={styles.dayGroup}><h3><time dateTime={day}>{formatDay(day, locale)}</time></h3><div className={styles.card}>{rows.map(entry => <EntryRow key={entry.id} entry={entry} copy={copy} locale={locale} onOpen={onOpen} />)}</div></section>)}
    {limit < filtered.length && <button className={styles.secondary} onClick={() => setLimit(value => value + 20)}>{copy.loadMore}</button>}
  </div>;
}
