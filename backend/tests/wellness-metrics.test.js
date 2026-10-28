import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { weeklyReportStats, calculateSleepHours, sleepSummary } from '../../frontend/src/lib/wellness-metrics.mjs';

const now = new Date('2026-10-28T12:00:00'); // Wednesday

test('weekly average excludes previous weeks and future data; missing days remain unknown', () => {
  const stats = weeklyReportStats([
    { log_date: '2026-10-27', mood_score: 8 },
    { log_date: '2026-10-26', mood_score: 6 },
    { log_date: '2026-10-25', mood_score: 1 },
    { log_date: '2026-10-29', mood_score: 10 },
  ], now);
  assert.deepEqual(stats.chartData, [60, 80, null, null, null, null, null]);
  assert.equal(stats.avgMood, 70);
  assert.equal(stats.totalLogs, 3);
  assert.equal(weeklyReportStats([], now).avgMood, null);
});

test('a streak uses consecutive calendar days, tolerates an unlogged today and ignores duplicate dates', () => {
  const logs = ['2026-10-27', '2026-10-27', '2026-10-26', '2026-10-24'].map(log_date => ({ log_date }));
  assert.equal(weeklyReportStats(logs, now).streak, 2);
  assert.equal(weeklyReportStats(logs, now).totalLogs, 3);
  assert.equal(weeklyReportStats([...logs, { log_date: '2026-10-28' }], now).streak, 3);
  assert.equal(weeklyReportStats([{ log_date: '2026-10-24' }], now).streak, 0);
});

test('calendar dates stay on their recorded day across time zones and DST changes', () => {
  const moduleUrl = new URL('../../frontend/src/lib/wellness-metrics.mjs', import.meta.url).href;
  const result = execFileSync(process.execPath, ['--input-type=module', '-e',
    `import { weeklyReportStats, recordDay } from ${JSON.stringify(moduleUrl)};
     const stats = weeklyReportStats(['2026-10-26','2026-10-25','2026-10-24'].map(log_date => ({log_date,mood_score:7})), new Date('2026-10-26T12:00:00'));
     console.log(JSON.stringify({stats,day:recordDay({log_date:'2026-10-26'})}));`],
    { env: { ...process.env, TZ: 'America/Los_Angeles' }, encoding: 'utf8' });
  const { stats, day } = JSON.parse(result);
  assert.equal(day, '2026-10-26');
  assert.equal(stats.chartData[0], 70);
  assert.equal(stats.streak, 3);
});

test('sleep duration validates the clock and calculates overnight intervals', () => {
  assert.equal(calculateSleepHours('23:30', '07:00'), 7.5);
  assert.equal(calculateSleepHours('00:00', '08:00'), 8);
  for (const [bed, wake] of [['99:30','07:00'], ['23:60','07:00'], ['23:30x','07:00'], ['7:30','08:00'], ['', '08:00'], ['08:00','08:00']]) {
    assert.equal(calculateSleepHours(bed, wake), null);
  }
});

test('sleep periods show no data rather than falling back to an old measurement', () => {
  const logs = [{ timestamp: '2026-09-01T12:00:00', hours: 8, quality: 90 }];
  assert.equal(sleepSummary(logs, 'Week', now).displayData, null);
  assert.equal(sleepSummary(logs, 'Week', now).sleepScore, null);
  assert.equal(sleepSummary(logs, 'Year', now).displayData.hours, 8);
});

test('sleep averages and quality use the selected period, including its first day', () => {
  const logs = [
    { timestamp: '2026-10-28T12:00:00', hours: 7, quality: 80 },
    { timestamp: '2026-10-22T12:00:00', hours: 9, quality: 60 },
    { timestamp: '2026-10-21T12:00:00', hours: 2, quality: 10 },
    { timestamp: '2026-10-29T12:00:00', hours: 1, quality: 0 },
  ];
  const week = sleepSummary(logs, 'Week', now);
  assert.equal(week.displayData.hours, 8);
  assert.equal(week.sleepScore, 70);
  assert.equal(week.weeklyData[0].duration, 9);
  assert.equal(week.weeklyData[6].duration, 7);
  assert.equal(sleepSummary(logs, 'Day', now).displayData.hours, 7);
});

test('sleep chart labels follow the application locale rather than the machine locale', () => {
  const english = sleepSummary([], 'Week', now, 'en-GB').weeklyData;
  const portuguese = sleepSummary([], 'Week', now, 'pt-PT').weeklyData;
  assert.equal(english[0].day, 'Thu');
  assert.equal(english[6].day, 'Wed');
  assert.notEqual(portuguese[0].day, english[0].day);
  assert.deepEqual(portuguese.map(row => row.day), sleepSummary([], 'Week', now).weeklyData.map(row => row.day));

  const moduleUrl = new URL('../../frontend/src/lib/wellness-metrics.mjs', import.meta.url).href;
  const code = `import { sleepSummary } from ${JSON.stringify(moduleUrl)};
    console.log(JSON.stringify(sleepSummary([], 'Week', new Date('2026-10-28T12:00:00'), 'pt-PT').weeklyData));`;
  const render = (lang, tz) => execFileSync(process.execPath, ['--input-type=module', '-e', code], {
    env: { ...process.env, LANG: lang, LC_ALL: lang, TZ: tz }, encoding: 'utf8',
  }).trim();
  assert.equal(render('en_US.UTF-8', 'America/Los_Angeles'), render('pt_PT.UTF-8', 'Pacific/Kiritimati'));
});
