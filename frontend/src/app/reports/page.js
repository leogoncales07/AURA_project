'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, BookOpen, FileText, RefreshCw } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { progressCopy } from '@/lib/progress-copy.mjs';
import ProgressOverview from '@/components/progress/ProgressOverview';
import JourneyTimeline from '@/components/progress/JourneyTimeline';
import ProgressReports from '@/components/progress/ProgressReports';
import EntryDetails from '@/components/progress/EntryDetails';
import styles from './page.module.css';

const views = ['overview', 'journey', 'reports'];
const icons = { overview: Activity, journey: BookOpen, reports: FileText };
const emptyEntries = [];
export default function ReportsPage() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const copy = progressCopy(locale);
  const [view, setView] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState(null);
  const [initialType, setInitialType] = useState('all');
  const [timeZone, setTimeZone] = useState('UTC');
  const [today, setToday] = useState('');
  const tabs = useRef([]);
  const reload = useCallback(() => setRefresh(value => value + 1), []);
  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    const now = new Date();
    setToday(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    const syncView = () => {
      const params = new URLSearchParams(window.location.search);
      setView(views.includes(params.get('view')) ? params.get('view') : 'overview');
      setInitialType(params.get('type') || 'all');
    };
    syncView();
    window.addEventListener('popstate', syncView);
    window.addEventListener('aura:data', reload);
    return () => { window.removeEventListener('popstate', syncView); window.removeEventListener('aura:data', reload); };
  }, [reload]);
  useEffect(() => {
    if (!user?.id || !today) return;
    let active = true;
    setLoading(true); setError(false);
    api.getProgress(timeZone).then(result => {
      if (!active) return;
      if (result.error) setError(true);
      else setData({ ...result.data, ownerId: user.id });
      setLoading(false);
    });
    return () => { active = false; };
  }, [user?.id, refresh, timeZone, today]);
  const ownsData = Boolean(user?.id && data?.ownerId === user.id);
  const entries = ownsData ? data.entries : emptyEntries;
  const reports = ownsData ? data.reports : emptyEntries;
  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get('entry');
    if (target) { const entry = entries.find(item => item.id === target); setSelected(entry ? { ...entry, ownerId: data.ownerId } : null); }
  }, [entries, data]);
  const openEntry = entry => setSelected({ ...entry, ownerId: user.id });
  const changeView = (next, type = 'all') => {
    setView(next); setInitialType(type); setSelected(null);
    const params = new URLSearchParams({ view: next });
    if (type !== 'all') params.set('type', type);
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
  };
  const closeDetails = () => {
    setSelected(null);
    const params = new URLSearchParams(window.location.search); params.delete('entry');
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
  };
  const tabKeys = (event, index) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % views.length;
    if (event.key === 'ArrowLeft') next = (index + views.length - 1) % views.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = views.length - 1;
    if (next !== undefined) { event.preventDefault(); changeView(views[next]); tabs.current[next]?.focus(); }
  };
  return <AppShell title={copy.progress}><div className={styles.page}>
    <div className={styles.heading}><div><p className={styles.eyebrow}>AURA</p><h1>{copy.progress}</h1><p className={styles.muted}>{copy.subtitle}</p></div><button className={styles.iconButton} onClick={reload} aria-label={copy.refresh} disabled={loading}><RefreshCw size={18} /></button></div>
    <div className={styles.tabs} role="tablist" aria-label={copy.progress}>{views.map((name, index) => { const Icon = icons[name]; return <button key={name} ref={element => { tabs.current[index] = element; }} role="tab" id={`tab-${name}`} aria-selected={view === name} aria-controls={`panel-${name}`} tabIndex={view === name ? 0 : -1} onClick={() => changeView(name)} onKeyDown={event => tabKeys(event, index)}><Icon size={17} />{copy[name]}</button>; })}</div>
    {error && <div role="alert" className={styles.alert}>{copy.failed}<button className={styles.textButton} onClick={reload}>{copy.retry}</button></div>}
    {loading && !ownsData && <p role="status" className={styles.empty}>{copy.loading}</p>}
    {ownsData && <section role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`} tabIndex={0} aria-busy={loading}>
      {view === 'overview' && <ProgressOverview entries={entries} copy={copy} locale={locale} today={today} onOpen={openEntry} onJourney={type => changeView('journey', type)} />}
      {view === 'journey' && <JourneyTimeline entries={entries} copy={copy} locale={locale} initialType={initialType} onOpen={openEntry} />}
      {view === 'reports' && <ProgressReports key={user.id} userId={user.id} reports={reports} copy={copy} locale={locale} today={today} timeZone={timeZone} userName={user.name || user.display_name || 'AURA'} onChange={reload} />}
    </section>}
    {selected?.ownerId === user?.id && user?.id && <EntryDetails key={selected.id} entry={selected} copy={copy} locale={locale} onClose={closeDetails} onChange={() => { closeDetails(); reload(); }} />}
  </div></AppShell>;
}
