import { wellness } from './wellnessService.js';

export function calendarDay(row, timeZone = 'UTC') {
  if (/^\d{4}-\d{2}-\d{2}$/.test(row.log_date || '')) return row.log_date;
  const date = new Date(row.timestamp || row.created_at);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export async function readProgress(client, userId) {
  const store = wellness(client, userId);
  const [logs, sleep, reflections, assessments, meditations] = await Promise.all([
    store.logs(), store.sleep(), store.reflections(), store.assessments(), store.meditations(),
  ]);
  return { logs, sleep, reflections, assessments, meditations };
}

export function journeyEntries(data, timeZone = 'UTC') {
  const entries = [];
  const add = (kind, row) => {
    const day = calendarDay(row, timeZone);
    if (day) entries.push({ id: `${kind}:${row.id}`, kind, day,
      occurredAt: row.timestamp || row.created_at || `${day}T12:00:00Z`, record: row });
  };
  for (const row of data.logs) if (row.mood_score != null || row.notes) add('mood', row);
  for (const row of data.sleep) add('sleep', row);
  const sleepDays = new Set(data.sleep.map(row => calendarDay(row, timeZone)));
  for (const row of data.logs) if (row.sleep_hours != null && !sleepDays.has(calendarDay(row, timeZone))) {
    add('sleep', { ...row, hours: row.sleep_hours });
  }
  for (const kind of ['reflection', 'assessment', 'meditation']) {
    const rows = data[{ reflection: 'reflections', assessment: 'assessments', meditation: 'meditations' }[kind]];
    for (const row of rows) add(kind, row);
  }
  return entries.sort((a, b) => b.day.localeCompare(a.day) || b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));
}

export function monthlySnapshot(data, period, timeZone = 'UTC') {
  const inMonth = row => calendarDay(row, timeZone)?.startsWith(period + '-');
  const entries = journeyEntries(data, timeZone).filter(entry => entry.day.startsWith(period + '-'));
  const dailyMood = new Map();
  const dailySleep = new Map();
  // Process oldest first so the latest measurement for a day wins.
  for (const row of [...data.sleep].reverse().filter(inMonth)) {
    if (Number.isFinite(Number(row.hours))) dailySleep.set(calendarDay(row, timeZone), Number(row.hours));
  }
  for (const row of [...data.logs].reverse().filter(inMonth)) {
    const day = calendarDay(row, timeZone);
    if (row.mood_score != null) dailyMood.set(day, Number(row.mood_score) * 10);
    if (row.sleep_hours != null) dailySleep.set(day, Number(row.sleep_hours));
  }
  const moods = [...dailyMood].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  const sleep = [...dailySleep.values()];
  const meditations = data.meditations.filter(inMonth);
  const average = values => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) / 10 : null;
  const mid = Math.floor(moods.length / 2);
  return {
    version: 1, period, timeZone,
    daysActive: new Set(entries.map(entry => entry.day)).size,
    totalActivities: entries.length,
    avgMood: average(moods), avgSleep: average(sleep),
    moodDays: moods.length, sleepNights: sleep.length,
    meditationSessions: meditations.length,
    meditationMinutes: Math.round(meditations.reduce((sum, row) => sum + row.practiced_seconds, 0) / 60),
    moodTrend: moods.length >= 4 ? Math.round((average(moods.slice(mid)) - average(moods.slice(0, mid))) * 10) / 10 : null,
    assessments: data.assessments.filter(inMonth).map(({ id, questionnaire, total_score, risk_level, created_at }) => ({ id, questionnaire, total_score, risk_level, created_at })),
  };
}
