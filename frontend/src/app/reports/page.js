'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Flame, FileText, Download, BarChart3, Calendar, Share2,
    TrendingUp, TrendingDown, Minus, Trash2, RefreshCw, Loader2,
    Moon, Sparkles, ClipboardList, Activity
} from 'lucide-react';
import styles from './page.module.css';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import StaggeredEntrance from '@/components/StaggeredEntrance';

// ── Animated counter ─────────────────────────────────────────────
const AnimatedNumber = ({ value, duration = 1200 }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            setDisplay(Math.floor(p * value));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [value, duration]);
    return <>{display}</>;
};

// ── Risk colours ─────────────────────────────────────────────────
const RISK_COLOURS = {
    low: '#10b981',
    moderate: '#f59e0b',
    high: '#ef4444',
    severe: '#ef4444',
};

// ── Month names ──────────────────────────────────────────────────
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_PT  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const SHORT_EN  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SAVED_KEY = 'aura_web_reports';

// ── PDF builder ──────────────────────────────────────────────────
function buildHtml({ locale, userName, monthLabel, generatedDate, data }) {
    const isPt = locale === 'pt';
    const riskLabel = { low: isPt?'Baixo':'Low', moderate: isPt?'Moderado':'Moderate', high: isPt?'Alto':'High', severe: isPt?'Severo':'Severe' };
    const trendIcon = data.moodTrend > 0 ? '↑' : data.moodTrend < 0 ? '↓' : '→';
    const trendColor = data.moodTrend > 0 ? '#10b981' : data.moodTrend < 0 ? '#ef4444' : '#94a3b8';
    const trendLabel = data.moodTrend > 0 ? (isPt?'A Melhorar':'Improving') : data.moodTrend < 0 ? (isPt?'A Diminuir':'Declining') : (isPt?'Estável':'Stable');

    const rows = (data.assessments || []).map(a => `
        <tr>
            <td>${a.questionnaire||'—'}</td>
            <td style="text-align:center">${a.total_score??'—'}</td>
            <td style="text-align:center;color:${RISK_COLOURS[a.risk_level]||'#94a3b8'};font-weight:700;text-transform:uppercase">${riskLabel[a.risk_level]||a.risk_level||'—'}</td>
        </tr>`).join('');

    return `<!DOCTYPE html><html lang="${isPt?'pt':'en'}">
<head><meta charset="UTF-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;background:#f8fafc;color:#1e293b}
.cover{background:linear-gradient(135deg,#020617 0%,#0f172a 60%,#10b98118 100%);padding:48px 40px 36px;color:#fff;position:relative;overflow:hidden}
.cover::before{content:'';position:absolute;width:280px;height:280px;background:radial-gradient(circle,rgba(16,185,129,.28) 0%,transparent 70%);top:-80px;right:-80px;border-radius:50%}
.cover-label{font-size:10px;font-weight:700;letter-spacing:3px;color:#10b981;text-transform:uppercase;margin-bottom:16px}
.cover-name{font-size:30px;font-weight:800;margin-bottom:6px}
.cover-month{font-size:18px;font-weight:500;color:rgba(248,250,252,.7);margin-bottom:28px}
.cover-meta{font-size:12px;color:rgba(248,250,252,.4)}
.logo{position:absolute;top:40px;right:40px;font-size:28px;font-weight:900;color:#10b981;letter-spacing:-1px}
.body{padding:32px 40px 48px}
.sec{font-size:10px;font-weight:700;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;margin:28px 0 12px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:4px}
.card{background:#fff;border-radius:12px;padding:18px 14px;border:1px solid #e2e8f0;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.04)}
.cv{font-size:26px;font-weight:800;color:#10b981}
.cl{font-size:11px;color:#94a3b8;margin-top:4px;font-weight:500}
.trend{display:inline-flex;align-items:center;gap:6px;background:${trendColor}18;border:1px solid ${trendColor}40;border-radius:20px;padding:6px 14px;margin-top:4px;font-size:13px;font-weight:700;color:${trendColor}}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;font-size:13px}
thead tr{background:#f1f5f9}
th{padding:12px 14px;font-size:10px;font-weight:700;letter-spacing:1px;color:#64748b;text-transform:uppercase;text-align:left}
td{padding:11px 14px;border-top:1px solid #f1f5f9;color:#334155}
.nodata{color:#94a3b8;font-style:italic;font-size:13px;margin-top:6px}
.footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between}
.fb{font-size:18px;font-weight:900;color:#10b981;letter-spacing:-.5px}
.ft{font-size:11px;color:#94a3b8;margin-top:2px}
.fr{font-size:11px;color:#cbd5e1;text-align:right}
.disc{margin-top:10px;font-size:10px;color:#cbd5e1;line-height:1.5;font-style:italic}
</style></head><body>
<div class="cover">
  <div class="logo">AURA</div>
  <div class="cover-label">${isPt?'Relatório de Bem-estar':'Well-being Report'}</div>
  <div class="cover-name">${userName}</div>
  <div class="cover-month">${monthLabel}</div>
  <div class="cover-meta">${isPt?'Gerado a':'Generated on'} ${generatedDate}</div>
</div>
<div class="body">
  <div class="sec">${isPt?'Resumo do Mês':'Monthly Overview'}</div>
  <div class="grid">
    <div class="card"><div class="cv">${data.avgMood>0?data.avgMood+'%':'—'}</div><div class="cl">${isPt?'Bem-estar Médio':'Avg. Well-being'}</div></div>
    <div class="card"><div class="cv">${data.daysActive}</div><div class="cl">${isPt?'Dias Ativos':'Active Days'}</div></div>
    <div class="card"><div class="cv">${data.totalSessions}</div><div class="cl">${isPt?'Sessões Totais':'Total Sessions'}</div></div>
    <div class="card"><div class="cv">${data.avgSleep>0?data.avgSleep+'h':'—'}</div><div class="cl">${isPt?'Sono Médio':'Avg. Sleep'}</div></div>
    <div class="card"><div class="cv">${data.meditationSessions}</div><div class="cl">${isPt?'Meditações':'Meditations'}</div></div>
    <div class="card"><div class="cv">${data.assessments?.length??0}</div><div class="cl">${isPt?'Inquéritos':'Inquiries'}</div></div>
  </div>
  <div class="sec">${isPt?'Tendência de Humor':'Mood Trend'}</div>
  <div class="trend">${trendIcon} ${trendLabel}</div>
  <div class="sec">${isPt?'Inquéritos & Resultados':'Inquiries & Results'}</div>
  ${rows.length ? `<table><thead><tr><th>${isPt?'Inquérito':'Inquiry'}</th><th style="text-align:center">${isPt?'Pontuação':'Score'}</th><th style="text-align:center">${isPt?'Nível de Risco':'Risk Level'}</th></tr></thead><tbody>${rows}</tbody></table>`:`<p class="nodata">${isPt?'Nenhum inquérito realizado neste período.':'No inquiries completed this period.'}</p>`}
  <div class="sec">${isPt?'Notas de Bem-estar':'Wellbeing Notes'}</div>
  <table><tbody>
    <tr><td style="font-weight:600;width:50%">${isPt?'Sono médio por noite':'Avg. sleep per night'}</td><td>${data.avgSleep>0?data.avgSleep+'h':(isPt?'Sem dados':'No data')}</td></tr>
    <tr><td style="font-weight:600">${isPt?'Sessões de meditação':'Meditation sessions'}</td><td>${data.meditationSessions}</td></tr>
    <tr><td style="font-weight:600">${isPt?'Dias com registo':'Days with log'}</td><td>${data.daysActive}</td></tr>
  </tbody></table>
  <div class="footer">
    <div><div class="fb">AURA</div><div class="ft">${isPt?'O seu refúgio digital.':'Your digital sanctuary.'}</div></div>
    <div class="fr"><div>aura.health</div><div>${generatedDate}</div></div>
  </div>
  <div class="disc">${isPt?'Este relatório é gerado automaticamente pela aplicação AURA com base nos dados registados pelo utilizador. Não substitui avaliação ou aconselhamento clínico profissional.':'This report is automatically generated by the AURA app based on user-logged data. It does not replace professional clinical evaluation or advice.'}</div>
</div></body></html>`;
}

// ── Print util (browser) ─────────────────────────────────────────
function printHtmlAsPdf(html, filename) {
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
        win.print();
        // win.close(); // keep open so user can save
    }, 500);
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function ReportsPage() {
    const { t, locale } = useI18n();
    const router = useRouter();
    const isPt = locale === 'pt';

    const monthNames = isPt ? MONTHS_PT : MONTHS_EN;
    const shortMonths = isPt ? SHORT_PT : SHORT_EN;

    const now = new Date();
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState('User');

    // ── Weekly chart state ──
    const [weekLoading, setWeekLoading] = useState(true);
    const [weekStats, setWeekStats] = useState({ chartData: [], streak: 0, avgMood: 0, days: [] });
    const [hoveredBar, setHoveredBar] = useState(null);

    // ── Month selector ──
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear]  = useState(now.getFullYear());

    // ── Report generation ──
    const [generating, setGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);

    // ── Saved reports ──
    const [savedReports, setSavedReports] = useState([]);

    // ── Load user ──
    useEffect(() => {
        const stored = (localStorage.getItem('aura_user') || sessionStorage.getItem('aura_user'));
        if (!stored) { router.push('/login'); return; }
        const u = JSON.parse(stored);
        setUserId(u.id);
        setUserName(u.name || u.display_name || 'User');
        fetchWeekly(u.id);
        // Load saved
        const saved = localStorage.getItem(SAVED_KEY);
        if (saved) setSavedReports(JSON.parse(saved));
    }, []);

    // ── Weekly data ──
    const fetchWeekly = async (uid) => {
        setWeekLoading(true);
        const res = await api.getLogs(uid, 14);
        const logs = res.data?.logs || [];
        const today = new Date();
        const dow = today.getDay();
        const todayIdx = dow === 0 ? 6 : dow - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - todayIdx);
        monday.setHours(0, 0, 0, 0);

        let chartData = [0,0,0,0,0,0,0];
        let totalMood = 0, moodCount = 0;

        logs.forEach(log => {
            const d = new Date(log.log_date || log.created_at);
            if (d >= monday) {
                const lDow = d.getDay();
                const lIdx = lDow === 0 ? 6 : lDow - 1;
                if (log.mood_score && lIdx <= todayIdx) chartData[lIdx] = log.mood_score * 10;
            }
            if (log.mood_score) { totalMood += log.mood_score; moodCount++; }
        });

        const avgMood = moodCount > 0 ? Math.round((totalMood / moodCount) * 10) : 0;
        const dayLabels = isPt
            ? ['S','T','Q','Q','S','S','D']
            : ['M','T','W','T','F','S','S'];

        setWeekStats({ chartData, streak: logs.length, avgMood, todayIdx, days: dayLabels });
        setWeekLoading(false);
    };

    // ── Generate report ──
    const generateReport = useCallback(async () => {
        if (!userId) return;
        setGenerating(true);
        setReportData(null);

        const [logsRes, histRes] = await Promise.all([
            api.getLogs(userId, 90),
            api.getHistory(userId),
        ]);
        const allLogs = logsRes.data?.logs || [];
        const allAssessments = histRes.data?.assessments || [];

        const monthLogs = allLogs.filter(l => {
            const d = new Date(l.log_date || l.created_at);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });

        const monthAssessments = allAssessments.filter(a => {
            if (!a.completed_at && !a.created_at) return true;
            const d = new Date(a.completed_at || a.created_at);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });

        const daysActive = new Set(monthLogs.map(l => {
            const d = new Date(l.log_date || l.created_at);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })).size;

        const moodScores = monthLogs.filter(l => l.mood_score).map(l => l.mood_score * 10);
        const avgMood = moodScores.length > 0
            ? Math.round(moodScores.reduce((s,v) => s+v, 0) / moodScores.length)
            : 0;

        const sleepVals = monthLogs.filter(l => l.sleep_hours).map(l => l.sleep_hours);
        const avgSleep = sleepVals.length > 0
            ? parseFloat((sleepVals.reduce((s,v) => s+v, 0) / sleepVals.length).toFixed(1))
            : 0;

        let moodTrend = 0;
        if (moodScores.length >= 4) {
            const mid = Math.floor(moodScores.length / 2);
            const first = moodScores.slice(0,mid).reduce((s,v)=>s+v,0)/mid;
            const last  = moodScores.slice(mid).reduce((s,v)=>s+v,0)/(moodScores.length-mid);
            moodTrend = last - first;
        }

        setReportData({ daysActive, avgMood, avgSleep, totalSessions: monthLogs.length, meditationSessions: monthLogs.length, assessments: monthAssessments, moodTrend });
        setGenerating(false);
    }, [userId, selectedMonth, selectedYear]);

    // ── Export PDF ──
    const exportPdf = () => {
        if (!reportData) return;
        const monthLabel = `${monthNames[selectedMonth]} ${selectedYear}`;
        const generatedDate = new Date().toLocaleDateString(isPt ? 'pt-PT' : 'en-GB', { day:'numeric', month:'long', year:'numeric' });
        const html = buildHtml({ locale, userName, monthLabel, generatedDate, data: reportData });

        // Save metadata
        const entry = {
            id: Date.now().toString(),
            filename: `AURA_${shortMonths[selectedMonth]}${selectedYear}.pdf`,
            month: monthNames[selectedMonth],
            year: selectedYear,
            generatedDate,
        };
        const updated = [entry, ...savedReports].slice(0, 10);
        setSavedReports(updated);
        localStorage.setItem(SAVED_KEY, JSON.stringify(updated));

        printHtmlAsPdf(html, entry.filename);
    };

    const deleteSaved = (id) => {
        const updated = savedReports.filter(r => r.id !== id);
        setSavedReports(updated);
        localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    };

    // ── Trend helpers ──
    const trend = reportData?.moodTrend ?? 0;
    const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
    const trendColor = trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#94a3b8';
    const trendLabel = trend > 0
        ? (isPt ? 'A Melhorar' : 'Improving')
        : trend < 0
            ? (isPt ? 'A Diminuir' : 'Declining')
            : (isPt ? 'Estável' : 'Stable');

    const CHART_MAX = 100;

    return (
        <AppShell title={isPt ? 'Progresso' : 'Progress'}>
            <StaggeredEntrance className={styles.pageGrid}>

                {/* ══ LEFT COLUMN ══════════════════════════════ */}
                <div className={styles.mainCol}>

                    {/* ── Weekly Chart Card ── */}
                    <div className={styles.heroCard}>
                        <div className={styles.heroCardHeader}>
                            <div>
                                <span className={styles.heroLabel}>
                                    {isPt ? 'ÍNDICE DE BEM-ESTAR' : 'WELLNESS INDEX'}
                                </span>
                                {weekLoading ? (
                                    <div className={styles.heroValue}>—</div>
                                ) : (
                                    <div className={styles.heroValue}>
                                        <AnimatedNumber value={weekStats.avgMood} />
                                        <span className={styles.heroUnit}>%</span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.streakPill}>
                                <Flame size={14} color="#f59e0b" fill="#f59e0b" />
                                <span>{weekStats.streak} {isPt ? 'dias' : 'days'}</span>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className={styles.barChart}>
                            {weekStats.chartData.map((val, i) => (
                                <div
                                    key={i}
                                    className={styles.barCol}
                                    onMouseEnter={() => setHoveredBar(i)}
                                    onMouseLeave={() => setHoveredBar(null)}
                                >
                                    {hoveredBar === i && val > 0 && (
                                        <div className={styles.barTooltip}>{val}%</div>
                                    )}
                                    <div className={styles.barTrack}>
                                        <div
                                            className={styles.barFill}
                                            style={{
                                                height: `${Math.max((val / CHART_MAX) * 100, 3)}%`,
                                                background: i === weekStats.todayIdx
                                                    ? 'var(--brand-primary)'
                                                    : val > 0
                                                        ? 'var(--brand-secondary)'
                                                        : 'var(--border-primary)',
                                                opacity: i > weekStats.todayIdx ? 0.25 : 1,
                                            }}
                                        />
                                    </div>
                                    <span className={styles.barLabel}
                                        style={{ color: i === weekStats.todayIdx ? 'var(--brand-primary)' : undefined }}>
                                        {weekStats.days[i]}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {weekStats.streak === 0 && (
                            <p className={styles.noDataHint}>
                                {isPt ? 'Registe o seu humor diariamente para ver o gráfico.' : 'Log your mood daily to populate the chart.'}
                            </p>
                        )}
                    </div>

                    {/* ── Monthly Report Generator ── */}
                    <div className={styles.reportGenCard}>
                        <div className={styles.reportGenHeader}>
                            <div className={styles.reportGenIconWrap}>
                                <FileText size={20} color="var(--brand-primary)" />
                            </div>
                            <div>
                                <div className={styles.reportGenTitle}>
                                    {isPt ? 'Relatório Mensal' : 'Monthly Report'}
                                </div>
                                <div className={styles.reportGenDesc}>
                                    {isPt
                                        ? 'Gere um relatório completo do seu bem-estar para o mês selecionado.'
                                        : 'Generate a complete well-being report for the selected month.'}
                                </div>
                            </div>
                        </div>

                        {/* Month Selector */}
                        <p className={styles.monthPickerLabel}>
                            <Calendar size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                            {isPt ? 'Selecionar Mês' : 'Select Month'}
                        </p>
                        <div className={styles.monthPicker}>
                            {shortMonths.map((m, i) => {
                                const isFuture = (selectedYear === now.getFullYear() && i > now.getMonth());
                                return (
                                    <button
                                        key={m}
                                        className={`${styles.monthChip} ${i === selectedMonth ? styles.monthChipActive : ''} ${isFuture ? styles.monthChipDisabled : ''}`}
                                        onClick={() => { if (!isFuture) { setSelectedMonth(i); setReportData(null); } }}
                                        disabled={isFuture}
                                    >
                                        {m}
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.selectedMonthLabel}>
                            {monthNames[selectedMonth]} {selectedYear}
                        </div>

                        {!reportData && (
                            <button
                                className={styles.generateBtn}
                                onClick={generateReport}
                                disabled={generating}
                            >
                                {generating
                                    ? <><Loader2 size={16} className={styles.spin} /> {isPt ? 'A gerar...' : 'Generating...'}</>
                                    : <><Sparkles size={16} /> {isPt ? 'Gerar Relatório' : 'Generate Report'}</>
                                }
                            </button>
                        )}
                    </div>

                    {/* ── Report Preview ── */}
                    {reportData && (
                        <div className={styles.previewCard}>
                            <div className={styles.previewHeader}>
                                <div>
                                    <div className={styles.previewTitle}>
                                        {isPt ? 'Relatório de' : 'Report for'} {monthNames[selectedMonth]} {selectedYear}
                                    </div>
                                    <div className={styles.previewSub}>
                                        {isPt ? 'Gerado agora' : 'Generated just now'} · {userName}
                                    </div>
                                </div>
                                <button
                                    className={styles.redoBtn}
                                    onClick={() => setReportData(null)}
                                    title={isPt ? 'Refazer' : 'Redo'}
                                >
                                    <RefreshCw size={15} />
                                </button>
                            </div>

                            {/* Stats grid */}
                            <div className={styles.previewGrid}>
                                {[
                                    { icon: <Activity size={16}/>, val: reportData.avgMood > 0 ? `${reportData.avgMood}%` : '—', lbl: isPt ? 'Bem-estar Médio' : 'Avg. Well-being' },
                                    { icon: <Calendar size={16}/>, val: reportData.daysActive, lbl: isPt ? 'Dias Ativos' : 'Active Days' },
                                    { icon: <BarChart3 size={16}/>, val: reportData.totalSessions, lbl: isPt ? 'Sessões Totais' : 'Total Sessions' },
                                    { icon: <Moon size={16}/>, val: reportData.avgSleep > 0 ? `${reportData.avgSleep}h` : '—', lbl: isPt ? 'Sono Médio' : 'Avg. Sleep' },
                                    { icon: <Sparkles size={16}/>, val: reportData.meditationSessions, lbl: isPt ? 'Meditações' : 'Meditations' },
                                    { icon: <ClipboardList size={16}/>, val: reportData.assessments?.length ?? 0, lbl: isPt ? 'Inquéritos' : 'Inquiries' },
                                ].map((s, i) => (
                                    <div key={i} className={styles.previewStat}>
                                        <div className={styles.previewStatIcon}>{s.icon}</div>
                                        <div className={styles.previewStatVal}>{s.val}</div>
                                        <div className={styles.previewStatLbl}>{s.lbl}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Trend pill */}
                            <div className={styles.trendPill} style={{ borderColor: trendColor + '50', background: trendColor + '12', color: trendColor }}>
                                <TrendIcon size={14} />
                                <span>{isPt ? 'Tendência' : 'Trend'}: {trendLabel}</span>
                            </div>

                            {/* Assessments */}
                            {reportData.assessments?.length > 0 && (
                                <div className={styles.assessmentList}>
                                    <p className={styles.assessmentListLabel}>
                                        {isPt ? 'Inquéritos & Resultados' : 'Inquiries & Results'}
                                    </p>
                                    {reportData.assessments.map((a, i) => (
                                        <div key={i} className={styles.assessmentRow}>
                                            <span className={styles.assessmentName}>{a.questionnaire || `Test ${i+1}`}</span>
                                            <span className={styles.assessmentScore}>{a.total_score ?? '—'} pts</span>
                                            <span
                                                className={styles.riskBadge}
                                                style={{ color: RISK_COLOURS[a.risk_level] || 'var(--brand-primary)', borderColor: (RISK_COLOURS[a.risk_level] || 'var(--brand-primary)') + '50', background: (RISK_COLOURS[a.risk_level] || 'var(--brand-primary)') + '14' }}
                                            >
                                                {a.risk_level?.toUpperCase() || '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {reportData.daysActive === 0 && (
                                <p className={styles.noDataHint}>
                                    {isPt ? 'Sem dados para este mês. Registe o seu humor diariamente.' : 'No data for this month. Log your mood daily.'}
                                </p>
                            )}

                            <button className={styles.exportBtn} onClick={exportPdf}>
                                <Download size={16} />
                                {isPt ? 'Exportar PDF' : 'Export PDF'}
                            </button>
                        </div>
                    )}
                </div>

                {/* ══ RIGHT COLUMN ═════════════════════════════ */}
                <div className={styles.sideCol}>

                    {/* Streak card */}
                    <div className={styles.streakCard}>
                        <div className={styles.flameIcon}>
                            <Flame size={48} fill="currentColor" />
                        </div>
                        <div className={styles.streakValue}>
                            {weekLoading ? '—' : <AnimatedNumber value={weekStats.streak} />}
                        </div>
                        <span className={styles.heroLabel}>{isPt ? 'dias seguidos' : 'day streak'}</span>
                    </div>

                    {/* Quick stats */}
                    <div className={styles.quickStatsGrid}>
                        <div className={styles.quickStat}>
                            <div className={styles.quickStatVal}>
                                {weekLoading ? '—' : (weekStats.avgMood > 0 ? `${weekStats.avgMood}%` : '—')}
                            </div>
                            <div className={styles.quickStatLbl}>{isPt ? 'Humor Semanal' : 'Weekly Mood'}</div>
                        </div>
                        <div className={styles.quickStat}>
                            <div className={styles.quickStatVal}>{weekStats.streak}</div>
                            <div className={styles.quickStatLbl}>{isPt ? 'Registos Totais' : 'Total Logs'}</div>
                        </div>
                    </div>

                    {/* Saved Reports */}
                    <div className={styles.savedCard}>
                        <div className={styles.savedHeader}>
                            <FileText size={16} color="var(--brand-primary)" />
                            <span>{isPt ? 'Relatórios Guardados' : 'Saved Reports'}</span>
                        </div>

                        {savedReports.length === 0 ? (
                            <div className={styles.savedEmpty}>
                                <div className={styles.savedEmptyIcon}>📁</div>
                                <p>{isPt ? 'Nenhum relatório gerado ainda.' : 'No reports generated yet.'}</p>
                            </div>
                        ) : (
                            <div className={styles.savedList}>
                                {savedReports.map(item => (
                                    <div key={item.id} className={styles.savedItem}>
                                        <div className={styles.savedItemIcon}>
                                            <FileText size={16} color="var(--brand-primary)" />
                                        </div>
                                        <div className={styles.savedItemInfo}>
                                            <div className={styles.savedItemName}>{item.filename}</div>
                                            <div className={styles.savedItemDate}>{item.generatedDate}</div>
                                        </div>
                                        <button
                                            className={styles.savedDeleteBtn}
                                            onClick={() => deleteSaved(item.id)}
                                            title={isPt ? 'Eliminar' : 'Delete'}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tip card */}
                    <div className={styles.tipCard}>
                        <div className={styles.tipHeader}>💡 {isPt ? 'Dica' : 'Tip'}</div>
                        <p className={styles.tipBody}>
                            {isPt
                                ? 'Registe o seu humor diariamente para obter melhores insights sobre o seu bem-estar e relatórios mais completos.'
                                : 'Log your mood daily to get richer insights into your well-being and more complete reports.'}
                        </p>
                    </div>
                </div>

            </StaggeredEntrance>
        </AppShell>
    );
}
