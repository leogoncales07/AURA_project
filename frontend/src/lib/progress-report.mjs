import { dateLocale, progressCopy } from './progress-copy.mjs';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export function reportHtml({ snapshot, created_at, userName, locale }) {
  const c = progressCopy(locale);
  const period = new Date(snapshot.period + '-15T12:00:00Z').toLocaleDateString(dateLocale(locale), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const created = new Date(created_at).toLocaleDateString(dateLocale(locale));
  const fields = [[c.avgMood, snapshot.avgMood == null ? '—' : `${snapshot.avgMood}%`], [c.avgSleep, snapshot.avgSleep == null ? '—' : `${snapshot.avgSleep} h`], [c.activeDays, snapshot.daysActive], [c.activities, snapshot.totalActivities], [c.practices, snapshot.meditationSessions], [c.minutes, snapshot.meditationMinutes]];
  return `<!doctype html><html lang="${escapeHtml(locale)}"><head><meta charset="utf-8"><title>AURA ${escapeHtml(snapshot.period)}</title><style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#173b37;margin:0;line-height:1.6}header{padding:42px;background:#103e39;color:white}h1{font-size:32px;margin:0}header p{margin:8px 0}main{padding:32px 42px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.stat{border:1px solid #d7e5e1;border-radius:12px;padding:18px}.stat strong{display:block;font-size:26px;color:#127760}.stat span{font-size:12px;color:#536e68}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{text-align:left;border-bottom:1px solid #d7e5e1;padding:12px}footer{margin-top:36px;padding-top:18px;border-top:1px solid #d7e5e1;color:#536e68;font-size:12px}@page{size:A4;margin:16mm}@media print{header{-webkit-print-color-adjust:exact;print-color-adjust:exact}.stat,tr{break-inside:avoid}}
  </style></head><body><header><p>AURA · ${escapeHtml(c.reports)}</p><h1>${escapeHtml(userName)}</h1><p>${escapeHtml(period)}</p><small>${escapeHtml(c.generated)}: ${escapeHtml(created)}</small></header><main><div class="grid">${fields.map(([label, value]) => `<div class="stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join('')}</div><h2>${escapeHtml(c.trend)}</h2><p>${snapshot.moodTrend == null ? escapeHtml(c.needMore) : `${snapshot.moodTrend > 0 ? '+' : ''}${escapeHtml(snapshot.moodTrend)} ${escapeHtml(c.trendHint)}`}</p><h2>${escapeHtml(c.assessment)}</h2>${snapshot.assessments.length ? `<table><thead><tr><th>${escapeHtml(c.assessment)}</th><th>${escapeHtml(c.score)}</th><th>${escapeHtml(c.category)}</th></tr></thead><tbody>${snapshot.assessments.map(row => `<tr><td>${escapeHtml(row.questionnaire)}</td><td>${escapeHtml(row.total_score)}</td><td>${escapeHtml(c[`risk_${row.risk_level}`] || row.risk_level || "?")}</td></tr>`).join('')}</tbody></table>` : `<p>${escapeHtml(c.noData)}</p>`}<p>${escapeHtml(c.sleepNights)}: ${escapeHtml(snapshot.sleepNights)}</p><footer>AURA · ${escapeHtml(c.reportDisclaimer)}</footer></main></body></html>`;
}
export function printReport(options) {
  const popup = window.open('', '_blank');
  if (!popup) return false;
  popup.opener = null;
  popup.document.open(); popup.document.write(reportHtml(options)); popup.document.close();
  popup.document.title = `AURA_${options.snapshot.period}`;
  popup.focus();
  setTimeout(() => { if (!popup.closed) popup.print(); }, 350);
  return true;
}
