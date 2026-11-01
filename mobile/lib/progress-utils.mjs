export { progressCopy, formatDay, dateLocale } from '../../frontend/src/lib/progress-copy.mjs';
export { weeklyReportStats } from '../../frontend/src/lib/wellness-metrics.mjs';
export { reportHtml } from '../../frontend/src/lib/progress-report.mjs';
export { practiceElapsed, practicePhase, audioPracticeDelta } from '../../frontend/src/lib/practice.mjs';
export function entryTitle(entry, copy) { return entry.kind === 'assessment' ? entry.record.questionnaire : entry.kind === 'meditation' ? entry.record.title : copy[entry.kind]; }
export function entryPreview(entry, copy) {
  const row = entry.record;
  return entry.kind === 'reflection' ? row.text : entry.kind === 'mood' ? `${row.mood_score == null ? '—' : row.mood_score + '/10'}${row.notes ? ' · ' + row.notes : ''}`
    : entry.kind === 'sleep' ? `${row.hours} h` : entry.kind === 'meditation' ? `${Math.round(row.practiced_seconds / 60)} min` : `${copy.score}: ${row.total_score}`;
}
