// Calendar dates are handled separately from instants: parsing a SQL DATE as UTC
// would move a record to the previous day in time zones west of Greenwich.
export function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function recordDay(record) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(record.log_date || '')) {
    const parsed = new Date(`${record.log_date}T12:00:00Z`);
    if (Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === record.log_date) return record.log_date;
  }
  const date = new Date(record.timestamp || record.created_at || '');
  return Number.isFinite(date.getTime()) ? dayKey(date) : null;
}

function shiftedDay(date, offset) {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + offset);
  return dayKey(shifted);
}

function previousDay(key) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function weeklyReportStats(logs, now = new Date()) {
  const today = dayKey(now);
  const todayIdx = (now.getDay() + 6) % 7;
  const byDay = new Map();
  for (const log of logs) {
    const day = recordDay(log);
    if (day && day <= today && !byDay.has(day)) byDay.set(day, log);
  }
  const chartData = Array(7).fill(null);
  const scores = [];
  for (let index = 0; index <= todayIdx; index++) {
    const log = byDay.get(shiftedDay(now, index - todayIdx));
    if (typeof log?.mood_score === 'number' && Number.isFinite(log.mood_score) && log.mood_score >= 0 && log.mood_score <= 10) {
      chartData[index] = log.mood_score * 10;
      scores.push(chartData[index]);
    }
  }
  let day = byDay.has(today) ? today : previousDay(today);
  let streak = 0;
  while (byDay.has(day)) { streak++; day = previousDay(day); }
  return { chartData, todayIdx, streak, totalLogs: byDay.size,
    avgMood: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null };
}

export function calculateSleepHours(bedTime, wakeTime) {
  const valid = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  if (!valid(bedTime) || !valid(wakeTime) || bedTime === wakeTime) return null;
  const minutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  const duration = (minutes(wakeTime) - minutes(bedTime) + 1440) % 1440;
  return Math.round(duration / 6) / 10;
}

export function sleepSummary(logs, timeframe, now = new Date(), locale = 'pt-PT') {
  const today = dayKey(now);
  const days = { Day: 1, Week: 7, Month: 30, Year: 365 }[timeframe] || 1;
  const firstDay = shiftedDay(now, 1 - days);
  const usable = logs.filter(log => {
    const day = recordDay(log);
    return day && day <= today && typeof log.hours === 'number' && log.hours > 0 && log.hours <= 24;
  }).sort((a, b) => (recordDay(b).localeCompare(recordDay(a))) ||
    (String(b.timestamp || b.created_at || '').localeCompare(String(a.timestamp || a.created_at || ''))));
  const selected = usable.filter(log => recordDay(log) >= firstDay);
  const rated = selected.filter(log => typeof log.quality === 'number' && log.quality >= 0 && log.quality <= 100);
  const displayData = !selected.length ? null : timeframe === 'Day' ? selected[0] : {
    hours: Math.round(selected.reduce((sum, log) => sum + log.hours, 0) / selected.length * 10) / 10,
    isAvg: true,
  };
  const weeklyData = Array.from({ length: 7 }, (_, index) => {
    const key = shiftedDay(now, index - 6);
    const log = usable.find(entry => recordDay(entry) === key);
    return { date: key, day: new Date(`${key}T12:00:00Z`).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' }),
      duration: log?.hours ?? null, quality: log?.quality ?? null };
  });
  return { displayData, weeklyData,
    sleepScore: rated.length ? Math.round(rated.reduce((sum, log) => sum + log.quality, 0) / rated.length) : null };
}
