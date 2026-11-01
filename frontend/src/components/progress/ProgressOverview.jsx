'use client';
import { useMemo, useState } from 'react';
import { Moon, Wind, Calendar, Flame, ArrowUpRight } from 'lucide-react';
import { weeklyReportStats } from '@/lib/wellness-metrics.mjs';
import { dateLocale, formatDay } from '@/lib/progress-copy.mjs';
import { EntryRow } from './JourneyTimeline';
import styles from '@/app/reports/page.module.css';
export default function ProgressOverview({ entries, copy, locale, today, onOpen, onJourney }) {
  const logs = useMemo(() => entries.filter(entry => entry.kind === 'mood').map(entry => entry.record), [entries]);
  const week = weeklyReportStats(logs, new Date(today + 'T12:00:00'));
  const month = entries.filter(entry => entry.day.startsWith(today.slice(0, 7)));
  const sleep = month.filter(entry => entry.kind === 'sleep');
  const sleepDays = new Map([...sleep].reverse().map(entry => [entry.day, Number(entry.record.hours)]));
  const avgSleep = sleepDays.size ? ([...sleepDays.values()].reduce((sum, value) => sum + value, 0) / sleepDays.size).toFixed(1) : '—';
  const practices = month.filter(entry => entry.kind === 'meditation');
  const [questionnaire, setQuestionnaire] = useState('WHO-5');
  const tests = entries.filter(entry => entry.kind === 'assessment');
  const series = tests.filter(entry => (entry.record.questionnaire === 'PSS' ? 'PSS-10' : entry.record.questionnaire) === questionnaire).slice(0, 8).reverse();
  const maxScore = { 'WHO-5': 100, 'PHQ-9': 27, 'GAD-7': 21, 'PSS-10': 40, PSS: 40 }[questionnaire] || 100;
  const weekStart = new Date(today + 'T12:00:00'); weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7);
  return <div className={styles.stack}>
    <div className={styles.overviewGrid}>
      <section className={`${styles.card} ${styles.weekCard}`}><p className={styles.eyebrow}>{copy.week}</p><div className={styles.largeValue}>{week.avgMood == null ? '—' : `${week.avgMood}%`}</div>
        <div className={styles.bars} aria-label={copy.week}>{week.chartData.map((value, index) => { const date = new Date(weekStart); date.setDate(date.getDate() + index); return <div key={index} className={styles.barColumn}><div className={styles.barTrack}><span style={{ height: value == null ? '0%' : `${value}%` }} /></div><span>{value == null ? '—' : value + '%'}</span><span>{date.toLocaleDateString(dateLocale(locale), { weekday: 'short' })}</span></div>; })}</div>
      </section>
      <div className={styles.metrics}>{[{ label: copy.activeDays, value: new Set(month.map(entry => entry.day)).size, Icon: Calendar }, { label: copy.avgSleep, value: `${avgSleep}${sleepDays.size ? ' h' : ''}`, Icon: Moon }, { label: copy.practices, value: practices.length, Icon: Wind }, { label: copy.streak, value: week.streak, Icon: Flame }].map(({ label, value, Icon }) => <div className={styles.metric} key={label}><Icon size={19} aria-hidden="true" /><strong>{value}</strong><span>{label}</span></div>)}</div>
    </div>
    <p className={styles.muted}>{copy.month} · {new Date(today + 'T12:00:00').toLocaleDateString(dateLocale(locale), { month: 'long', year: 'numeric' })}</p>
    <section className={styles.cardPad}><div className={styles.sectionHeading}><div><h2>{copy.scoreHistory}</h2><p className={styles.muted}>{copy.scoreHint}</p></div><select aria-label={copy.assessment} value={questionnaire} onChange={event => setQuestionnaire(event.target.value)}>{['WHO-5', 'PHQ-9', 'GAD-7', 'PSS-10'].map(id => <option key={id}>{id}</option>)}</select></div>
      {series.length ? <><svg className={styles.lineChart} viewBox="0 0 600 160" role="img" aria-label={`${questionnaire}: ${series.map(entry => entry.record.total_score).join(', ')}`}><line x1="20" y1="140" x2="580" y2="140" stroke="currentColor" opacity=".15" /><polyline fill="none" stroke="var(--brand-primary)" strokeWidth="3" points={series.map((entry, index) => `${series.length === 1 ? 300 : 20 + index * 560 / (series.length - 1)},${140 - entry.record.total_score / maxScore * 120}`).join(' ')} />{series.map((entry, index) => <circle key={entry.id} cx={series.length === 1 ? 300 : 20 + index * 560 / (series.length - 1)} cy={140 - entry.record.total_score / maxScore * 120} r="5" fill="var(--brand-primary)" />)}</svg><div className={styles.scoreList}>{[...series].reverse().map(entry => <button key={entry.id} className={styles.scoreItem} onClick={() => onOpen(entry)}><span>{formatDay(entry.day, locale)}</span><strong>{entry.record.total_score} / {maxScore}</strong><ArrowUpRight size={16} aria-hidden="true" /></button>)}</div></> : <p className={styles.empty}>{copy.noData}</p>}
      <button className={styles.textButton} onClick={() => onJourney('assessment')}>{copy.viewJourney} <ArrowUpRight size={16} /></button>
    </section>
    <section><div className={styles.sectionHeading}><h2>{copy.recent}</h2><button className={styles.textButton} onClick={() => onJourney('all')}>{copy.viewJourney} <ArrowUpRight size={16} /></button></div><div className={styles.card}>{entries.slice(0, 5).map(entry => <EntryRow key={entry.id} entry={entry} copy={copy} locale={locale} onOpen={onOpen} />)}{!entries.length && <p className={styles.empty}>{copy.emptyHint}</p>}</div></section>
  </div>;
}
