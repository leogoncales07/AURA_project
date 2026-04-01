import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator, RefreshControl, Alert, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n';
import { useTheme, COLORS, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ── Weekday labels ──────────────────────────────────────────────
const DAYS_PT = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const DAYS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const SAVED_REPORTS_KEY = 'aura_saved_reports';

// ── Risk badge colours ──────────────────────────────────────────
const riskColors = {
    low: '#30D158',
    moderate: '#FFB340',
    high: '#FF6B9D',
    severe: '#FF6B9D',
};

// ── PDF HTML builder ────────────────────────────────────────────
function buildPdfHtml({ locale, userName, monthLabel, generatedDate, data }) {
    const isPt = locale === 'pt';

    const riskLabel = {
        low: isPt ? 'Baixo' : 'Low',
        moderate: isPt ? 'Moderado' : 'Moderate',
        high: isPt ? 'Alto' : 'High',
        severe: isPt ? 'Severo' : 'Severe',
    };

    const inquiryRows = (data.assessments || []).map((a) => `
        <tr>
            <td>${a.questionnaire || '—'}</td>
            <td style="text-align:center">${a.total_score ?? '—'}</td>
            <td style="text-align:center; color:${
                a.risk_level === 'low' ? '#10b981'
                : a.risk_level === 'moderate' ? '#f59e0b'
                : '#ef4444'
            }; font-weight:700; text-transform:uppercase">${riskLabel[a.risk_level] || a.risk_level || '—'}</td>
        </tr>`
    ).join('');

    const trendIcon = data.moodTrend > 0 ? '↑' : data.moodTrend < 0 ? '↓' : '→';
    const trendColor = data.moodTrend > 0 ? '#10b981' : data.moodTrend < 0 ? '#ef4444' : '#94a3b8';
    const trendLabel = data.moodTrend > 0
        ? (isPt ? 'A Melhorar' : 'Improving')
        : data.moodTrend < 0
            ? (isPt ? 'A Diminuir' : 'Declining')
            : (isPt ? 'Estável' : 'Stable');

    return `
<!DOCTYPE html>
<html lang="${isPt ? 'pt' : 'en'}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>AURA — ${isPt ? 'Relatório Mensal' : 'Monthly Report'}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; color: #1e293b; }

  .cover {
    background: linear-gradient(135deg, #020617 0%, #0f172a 60%, #10b98120 100%);
    padding: 48px 40px 36px;
    color: #fff;
    position: relative;
    overflow: hidden;
  }
  .cover::before {
    content: '';
    position: absolute;
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%);
    top: -80px; right: -80px; border-radius: 50%;
  }
  .cover-label {
    font-size: 10px; font-weight: 700; letter-spacing: 3px;
    color: #10b981; text-transform: uppercase; margin-bottom: 16px;
  }
  .cover-name { font-size: 30px; font-weight: 800; color: #fff; margin-bottom: 6px; }
  .cover-month { font-size: 18px; font-weight: 500; color: rgba(248,250,252,0.7); margin-bottom: 28px; }
  .cover-meta { font-size: 12px; color: rgba(248,250,252,0.45); }

  .aura-logo {
    position: absolute; top: 40px; right: 40px;
    font-size: 28px; font-weight: 900; color: #10b981; letter-spacing: -1px;
  }

  .body { padding: 32px 40px 48px; }

  .section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 2px;
    color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; margin-top: 28px;
  }

  .stats-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 4px;
  }
  .stat-card {
    background: #fff; border-radius: 12px; padding: 18px 14px;
    border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .stat-value { font-size: 26px; font-weight: 800; color: #10b981; }
  .stat-unit  { font-size: 14px; font-weight: 600; color: #64748b; }
  .stat-label { font-size: 11px; color: #94a3b8; margin-top: 4px; font-weight: 500; }

  .trend-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: ${trendColor}18; border: 1px solid ${trendColor}40;
    border-radius: 20px; padding: 6px 14px; margin-top: 4px;
    font-size: 13px; font-weight: 700; color: ${trendColor};
  }

  table {
    width: 100%; border-collapse: collapse;
    background: #fff; border-radius: 12px; overflow: hidden;
    border: 1px solid #e2e8f0; font-size: 13px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  thead tr { background: #f1f5f9; }
  th { padding: 12px 14px; font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #64748b; text-transform: uppercase; text-align: left; }
  td { padding: 11px 14px; border-top: 1px solid #f1f5f9; color: #334155; }
  tr:last-child td { border-bottom: none; }

  .no-data { color: #94a3b8; font-style: italic; font-size: 13px; margin-top: 6px; }

  .footer {
    margin-top: 48px; padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: space-between;
  }
  .footer-brand { font-size: 18px; font-weight: 900; color: #10b981; letter-spacing: -0.5px; }
  .footer-tagline { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .footer-right { font-size: 11px; color: #cbd5e1; text-align: right; }
  .footer-disclaimer {
    margin-top: 10px; font-size: 10px; color: #cbd5e1;
    line-height: 1.5; font-style: italic;
  }
</style>
</head>
<body>

<!-- COVER HEADER -->
<div class="cover">
  <div class="aura-logo">AURA</div>
  <div class="cover-label">${isPt ? 'Relatório de Bem-estar' : 'Well-being Report'}</div>
  <div class="cover-name">${userName}</div>
  <div class="cover-month">${monthLabel}</div>
  <div class="cover-meta">${isPt ? 'Gerado a' : 'Generated on'} ${generatedDate}</div>
</div>

<!-- BODY -->
<div class="body">

  <!-- STATS: overview -->
  <div class="section-label">${isPt ? 'Resumo do Mês' : 'Monthly Overview'}</div>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${data.avgMood > 0 ? data.avgMood + '%' : '—'}</div>
      <div class="stat-label">${isPt ? 'Bem-estar Médio' : 'Avg. Well-being'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.daysActive}</div>
      <div class="stat-label">${isPt ? 'Dias Ativos' : 'Active Days'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.totalSessions}</div>
      <div class="stat-label">${isPt ? 'Sessões Totais' : 'Total Sessions'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.avgSleep > 0 ? data.avgSleep + (isPt ? 'h' : 'h') : '—'}</div>
      <div class="stat-label">${isPt ? 'Sono Médio' : 'Avg. Sleep'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.meditationSessions}</div>
      <div class="stat-label">${isPt ? 'Meditações' : 'Meditations'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.assessments?.length ?? 0}</div>
      <div class="stat-label">${isPt ? 'Inquéritos' : 'Inquiries'}</div>
    </div>
  </div>

  <!-- MOOD TREND -->
  <div class="section-label" style="margin-top:20px">${isPt ? 'Tendência de Humor' : 'Mood Trend'}</div>
  <div class="trend-badge">${trendIcon} ${trendLabel}</div>

  <!-- ASSESSMENT HISTORY -->
  <div class="section-label">${isPt ? 'Inquéritos & Resultados' : 'Inquiries & Results'}</div>
  ${inquiryRows.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>${isPt ? 'Inquérito' : 'Inquiry'}</th>
        <th style="text-align:center">${isPt ? 'Pontuação' : 'Score'}</th>
        <th style="text-align:center">${isPt ? 'Nível de Risco' : 'Risk Level'}</th>
      </tr>
    </thead>
    <tbody>${inquiryRows}</tbody>
  </table>
  ` : `<p class="no-data">${isPt ? 'Nenhum inquérito realizado neste período.' : 'No inquiries completed this period.'}</p>`}

  <!-- WELLBEING NOTES -->
  <div class="section-label">${isPt ? 'Notas de Bem-estar' : 'Well-being Notes'}</div>
  <table>
    <tbody>
      <tr>
        <td style="font-weight:600; width:50%">${isPt ? 'Sono médio por noite' : 'Avg. sleep per night'}</td>
        <td>${data.avgSleep > 0 ? data.avgSleep + 'h' : (isPt ? 'Sem dados' : 'No data')}</td>
      </tr>
      <tr>
        <td style="font-weight:600">${isPt ? 'Sessões de meditação' : 'Meditation sessions'}</td>
        <td>${data.meditationSessions}</td>
      </tr>
      <tr>
        <td style="font-weight:600">${isPt ? 'Dias com registo de humor' : 'Days with mood logged'}</td>
        <td>${data.daysActive}</td>
      </tr>
    </tbody>
  </table>

  <!-- FOOTER -->
  <div class="footer">
    <div>
      <div class="footer-brand">AURA</div>
      <div class="footer-tagline">${isPt ? 'O seu refúgio digital.' : 'Your digital sanctuary.'}</div>
    </div>
    <div class="footer-right">
      <div>aura.health</div>
      <div>${generatedDate}</div>
    </div>
  </div>
  <div class="footer-disclaimer">
    ${isPt
        ? 'Este relatório é gerado automaticamente pela aplicação AURA com base nos dados registados pelo utilizador. Não substitui avaliação ou aconselhamento clínico profissional.'
        : 'This report is automatically generated by the AURA app based on user-logged data. It does not replace professional clinical evaluation or advice.'}
  </div>

</div>
</body>
</html>`;
}

// ── Main Component ──────────────────────────────────────────────
export default function ReportsScreen() {
    const { t, locale } = useI18n();
    const { colors } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isPt = locale === 'pt';

    // ── state ──
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState('');

    // Weekly chart
    const [weekStats, setWeekStats] = useState({ chartData: [0,0,0,0,0,0,0], avgMood: 0, streak: 0, todayIndex: 0 });

    // Month selector
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    // Report generation
    const [generating, setGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);

    // Saved reports
    const [savedReports, setSavedReports] = useState([]);

    // ── months array ──
    const monthNames = isPt
        ? ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
        : ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const shortMonths = isPt
        ? ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
        : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // ── Load on mount ──
    useEffect(() => {
        loadUser();
        loadSavedReports();
    }, []);

    const loadUser = async () => {
        const stored = await AsyncStorage.getItem('aura_user');
        if (!stored) { router.replace('/(auth)/login'); return; }
        const user = JSON.parse(stored);
        setUserId(user.id);
        setUserName(user.name || 'User');
        fetchWeeklyStats(user.id);
    };

    const loadSavedReports = async () => {
        const raw = await AsyncStorage.getItem(SAVED_REPORTS_KEY);
        if (raw) setSavedReports(JSON.parse(raw));
    };

    // ── Weekly chart data ──
    const fetchWeeklyStats = async (uid) => {
        const logsRes = await api.getLogs(uid, 14);
        let avgMood = 0, streak = 0;
        let chartData = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();
        const dayOfWeek = today.getDay();
        const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - todayIndex);
        monday.setHours(0, 0, 0, 0);

        if (logsRes.data?.logs) {
            const logs = logsRes.data.logs;
            streak = logs.length;
            let totalMood = 0, moodCount = 0;
            logs.forEach((log) => {
                const logDate = new Date(log.log_date || log.created_at);
                if (logDate >= monday) {
                    const lDay = logDate.getDay();
                    const lIndex = lDay === 0 ? 6 : lDay - 1;
                    if (log.mood_score && lIndex <= todayIndex) {
                        chartData[lIndex] = log.mood_score * 10;
                    }
                }
                if (log.mood_score) { totalMood += log.mood_score; moodCount++; }
            });
            if (moodCount > 0) avgMood = Math.round((totalMood / moodCount) * 10);
        }
        setWeekStats({ avgMood, streak, chartData, todayIndex });
        setLoading(false);
        setRefreshing(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (userId) fetchWeeklyStats(userId);
        loadSavedReports();
    };

    // ── Generate report data for selected month ──
    const generateReport = useCallback(async () => {
        if (!userId) return;
        setGenerating(true);
        setReportData(null);

        const [logsRes, historyRes] = await Promise.all([
            api.getLogs(userId, 90),
            api.getHistory(userId),
        ]);

        const allLogs = logsRes.data?.logs || [];
        const allAssessments = historyRes.data?.assessments || [];

        // Filter to selected month/year
        const monthLogs = allLogs.filter((log) => {
            const d = new Date(log.log_date || log.created_at);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });

        const monthAssessments = allAssessments.filter((a) => {
            if (!a.completed_at && !a.created_at) return true; // include all if no date
            const d = new Date(a.completed_at || a.created_at);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });

        // Compute stats
        const daysActive = new Set(monthLogs.map((l) => {
            const d = new Date(l.log_date || l.created_at);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })).size;

        const moodScores = monthLogs.filter((l) => l.mood_score).map((l) => l.mood_score * 10);
        const avgMood = moodScores.length > 0
            ? Math.round(moodScores.reduce((s, v) => s + v, 0) / moodScores.length)
            : 0;

        const sleepValues = monthLogs.filter((l) => l.sleep_hours).map((l) => l.sleep_hours);
        const avgSleep = sleepValues.length > 0
            ? (sleepValues.reduce((s, v) => s + v, 0) / sleepValues.length).toFixed(1)
            : 0;

        // Mood trend: compare first half vs second half of month logs
        let moodTrend = 0;
        if (moodScores.length >= 4) {
            const mid = Math.floor(moodScores.length / 2);
            const firstHalf = moodScores.slice(0, mid).reduce((s, v) => s + v, 0) / mid;
            const secondHalf = moodScores.slice(mid).reduce((s, v) => s + v, 0) / (moodScores.length - mid);
            moodTrend = secondHalf - firstHalf;
        }

        const data = {
            daysActive,
            avgMood,
            avgSleep: Number(avgSleep),
            totalSessions: monthLogs.length,
            meditationSessions: monthLogs.length, // proxy: each log = 1 session
            assessments: monthAssessments,
            moodTrend,
        };

        setReportData(data);
        setGenerating(false);
    }, [userId, selectedMonth, selectedYear]);

    // ── Export PDF ──
    const exportPdf = async () => {
        if (!reportData) return;

        const monthLabel = `${monthNames[selectedMonth]} ${selectedYear}`;
        const generatedDate = new Date().toLocaleDateString(isPt ? 'pt-PT' : 'en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
        });

        const html = buildPdfHtml({ locale, userName, monthLabel, generatedDate, data: reportData });

        try {
            // Dynamic import — only loaded when user taps Export PDF
            const Print = await import('expo-print').catch(() => null);
            const Sharing = await import('expo-sharing').catch(() => null);

            if (!Print || !Sharing) {
                Alert.alert(
                    isPt ? 'Pacote em falta' : 'Package missing',
                    isPt
                        ? 'Por favor reinicie a app após instalar expo-print e expo-sharing.'
                        : 'Please restart the app after installing expo-print and expo-sharing.'
                );
                return;
            }

            const { uri } = await Print.printToFileAsync({ html, base64: false });

            // Save metadata to AsyncStorage
            const filename = `AURA_${shortMonths[selectedMonth]}${selectedYear}.pdf`;
            const meta = {
                id: Date.now().toString(),
                filename,
                month: monthNames[selectedMonth],
                year: selectedYear,
                generatedDate,
                uri,
            };
            const updated = [meta, ...savedReports].slice(0, 10);
            setSavedReports(updated);
            await AsyncStorage.setItem(SAVED_REPORTS_KEY, JSON.stringify(updated));

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: isPt ? 'Partilhar Relatório AURA' : 'Share AURA Report',
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert(isPt ? 'PDF Guardado' : 'PDF Saved', uri);
            }
        } catch (err) {
            Alert.alert(isPt ? 'Erro' : 'Error', err.message);
        }
    };

    // ── Share saved report ──
    const shareSaved = async (item) => {
        try {
            const Sharing = await import('expo-sharing').catch(() => null);
            if (Sharing && await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(item.uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: isPt ? 'Partilhar Relatório AURA' : 'Share AURA Report',
                    UTI: 'com.adobe.pdf',
                });
            }
        } catch {
            Alert.alert(isPt ? 'Ficheiro indisponível' : 'File unavailable');
        }
    };

    const deleteSaved = async (id) => {
        const updated = savedReports.filter((r) => r.id !== id);
        setSavedReports(updated);
        await AsyncStorage.setItem(SAVED_REPORTS_KEY, JSON.stringify(updated));
    };

    // ── Loading state ──
    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const CHART_HEIGHT = 100;
    const DAYS = isPt ? DAYS_PT : DAYS_EN;

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.bg }]}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
            {/* ── PAGE TITLE ── */}
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>{t('reports.title')}</Text>

            {/* ══════════ SECTION A — WEEKLY CHART ══════════ */}
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('reports.weeklySummary')}</Text>
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.chartBars}>
                    {weekStats.chartData.map((val, i) => (
                        <View key={i} style={styles.barWrapper}>
                            <View style={[
                                styles.barFill,
                                {
                                    height: Math.max(val * CHART_HEIGHT / 100, 4),
                                    backgroundColor: i === weekStats.todayIndex
                                        ? colors.primary
                                        : val > 0 ? colors.accentBlue : colors.border,
                                    opacity: i > weekStats.todayIndex ? 0.3 : 1,
                                }
                            ]} />
                        </View>
                    ))}
                </View>
                <View style={styles.chartLabels}>
                    {DAYS.map((day, i) => (
                        <Text key={i} style={[
                            styles.chartDayLabel,
                            { color: colors.textTertiary },
                            i === weekStats.todayIndex && { color: colors.primary, fontWeight: '700' },
                        ]}>
                            {day}
                        </Text>
                    ))}
                </View>
                {weekStats.streak === 0 && (
                    <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                        {isPt ? 'Registe o seu humor diariamente.' : 'Log your mood daily to populate the chart.'}
                    </Text>
                )}
            </View>

            {/* Stats row */}
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('reports.statistics')}</Text>
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={styles.statEmoji}>📈</Text>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{weekStats.avgMood > 0 ? `${weekStats.avgMood}%` : '—'}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('reports.avgMood')}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={styles.statEmoji}>🗓️</Text>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{weekStats.streak}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('reports.consecutiveDays')}</Text>
                </View>
            </View>

            {/* ══════════ SECTION B — MONTHLY REPORT ══════════ */}
            <Text style={[styles.sectionLabel, { marginTop: Spacing.md, color: colors.textTertiary }]}>{t('reports.monthlyReport')}</Text>

            <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header row */}
                <View style={styles.reportCardHeader}>
                    <View style={styles.reportCardIconWrap}>
                        <Text style={styles.reportCardIcon}>📄</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.reportCardTitle, { color: colors.textPrimary }]}>{t('reports.monthlyReport')}</Text>
                        <Text style={[styles.reportCardDesc, { color: colors.textSecondary }]}>{t('reports.monthlyReportDesc')}</Text>
                    </View>
                </View>

                {/* Month selector */}
                <Text style={[styles.monthSelectLabel, { color: colors.textTertiary }]}>{t('reports.selectMonth')}</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.monthRow}
                >
                    {shortMonths.map((m, i) => {
                        const isFuture = (selectedYear === now.getFullYear() && i > now.getMonth());
                        const isSelected = i === selectedMonth;
                        return (
                            <TouchableOpacity
                                key={m}
                                style={[
                                    styles.monthChip,
                                    { backgroundColor: colors.card, borderColor: colors.border },
                                    isSelected && { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: colors.primary },
                                    isFuture && styles.monthChipDisabled,
                                ]}
                                onPress={() => { if (!isFuture) { setSelectedMonth(i); setReportData(null); } }}
                                disabled={isFuture}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.monthChipText,
                                    { color: colors.textSecondary },
                                    isSelected && { color: '#10b981', fontWeight: '700' },
                                    isFuture && styles.monthChipTextDisabled,
                                ]}>
                                    {m}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Selected month label */}
                <Text style={[styles.selectedMonthText, { color: colors.textPrimary }]}>
                    {monthNames[selectedMonth]} {selectedYear}
                </Text>

                {/* Generate button */}
                {!reportData && (
                    <TouchableOpacity
                        style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
                        onPress={generateReport}
                        disabled={generating}
                        activeOpacity={0.8}
                    >
                        {generating
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.generateBtnText}>✦ {t('reports.generateReport')}</Text>
                        }
                    </TouchableOpacity>
                )}
            </View>

            {/* ── REPORT PREVIEW (after generate) ── */}
            {reportData && (
                <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>
                        {t('reports.reportFor')} {monthNames[selectedMonth]} {selectedYear}
                    </Text>
                    <Text style={styles.previewSubtitle}>
                        {t('reports.generatedOn')} {new Date().toLocaleDateString(isPt ? 'pt-PT' : 'en-GB')}
                    </Text>

                    {/* Stats grid */}
                    <View style={styles.previewGrid}>
                        <View style={styles.previewStatCell}>
                            <Text style={styles.previewStatValue}>
                                {reportData.avgMood > 0 ? `${reportData.avgMood}%` : '—'}
                            </Text>
                            <Text style={styles.previewStatLabel}>{t('reports.avgWellbeing')}</Text>
                        </View>
                        <View style={styles.previewStatCell}>
                            <Text style={styles.previewStatValue}>{reportData.daysActive}</Text>
                            <Text style={styles.previewStatLabel}>{t('reports.daysActive')}</Text>
                        </View>
                        <View style={styles.previewStatCell}>
                            <Text style={styles.previewStatValue}>{reportData.totalSessions}</Text>
                            <Text style={styles.previewStatLabel}>{t('reports.totalSessions')}</Text>
                        </View>
                        <View style={styles.previewStatCell}>
                            <Text style={styles.previewStatValue}>
                                {reportData.avgSleep > 0 ? `${reportData.avgSleep}h` : '—'}
                            </Text>
                            <Text style={styles.previewStatLabel}>{t('reports.avgSleep')}</Text>
                        </View>
                        <View style={styles.previewStatCell}>
                            <Text style={styles.previewStatValue}>{reportData.meditationSessions}</Text>
                            <Text style={styles.previewStatLabel}>{t('reports.meditationSessions')}</Text>
                        </View>
                        <View style={styles.previewStatCell}>
                            <Text style={styles.previewStatValue}>{reportData.assessments?.length ?? 0}</Text>
                            <Text style={styles.previewStatLabel}>{t('reports.inquiries')}</Text>
                        </View>
                    </View>

                    {/* Mood trend pill */}
                    {(() => {
                        const trend = reportData.moodTrend;
                        const label = trend > 0 ? t('reports.improving') : trend < 0 ? t('reports.declining') : t('reports.stable');
                        const col = trend > 0 ? COLORS.accentMint : trend < 0 ? COLORS.accentPink : COLORS.accentBlue;
                        return (
                            <View style={[styles.trendPill, { backgroundColor: col + '20', borderColor: col + '60' }]}>
                                <Text style={[styles.trendText, { color: col }]}>
                                    {t('reports.moodTrend')}: {label}
                                </Text>
                            </View>
                        );
                    })()}

                    {/* Assessments list */}
                    {reportData.assessments?.length > 0 && (
                        <>
                            <Text style={styles.previewSubLabel}>{t('reports.inquiries')}</Text>
                            {reportData.assessments.map((a, i) => (
                                <View key={i} style={styles.assessmentRow}>
                                    <Text style={styles.assessmentName} numberOfLines={1}>{a.questionnaire || `Test ${i+1}`}</Text>
                                    <Text style={styles.assessmentScore}>{a.total_score ?? '—'} pts</Text>
                                    <View style={[styles.riskBadge, {
                                        backgroundColor: (riskColors[a.risk_level] || COLORS.primary) + '22',
                                        borderColor: riskColors[a.risk_level] || COLORS.primary,
                                    }]}>
                                        <Text style={[styles.riskText, { color: riskColors[a.risk_level] || COLORS.primary }]}>
                                            {a.risk_level?.toUpperCase() || '—'}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    {reportData.daysActive === 0 && (
                        <Text style={styles.noDataText}>{t('reports.noDataMonth')}</Text>
                    )}

                    {/* Action row */}
                    <View style={styles.previewActions}>
                        <TouchableOpacity
                            style={styles.regenerateBtn}
                            onPress={() => { setReportData(null); }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.regenerateBtnText}>↺ {isPt ? 'Refazer' : 'Redo'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.exportBtn} onPress={exportPdf} activeOpacity={0.8}>
                            <Text style={styles.exportBtnText}>⬇ {t('reports.exportPdf')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* SECTION C — SAVED REPORTS                      */}
            {/* ══════════════════════════════════════════════ */}
            <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>{t('reports.savedReports')}</Text>

            {savedReports.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>📁</Text>
                    <Text style={styles.emptyText}>{t('reports.noSavedReports')}</Text>
                </View>
            ) : (
                savedReports.map((item) => (
                    <View key={item.id} style={styles.savedItem}>
                        <View style={styles.savedIconWrap}>
                            <Text style={styles.savedIcon}>📄</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.savedFilename}>{item.filename}</Text>
                            <Text style={styles.savedDate}>{item.generatedDate}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.shareBtn}
                            onPress={() => shareSaved(item)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.shareBtnText}>{t('reports.share')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => Alert.alert(
                                isPt ? 'Eliminar relatório?' : 'Delete report?',
                                item.filename,
                                [
                                    { text: isPt ? 'Cancelar' : 'Cancel', style: 'cancel' },
                                    { text: isPt ? 'Eliminar' : 'Delete', style: 'destructive', onPress: () => deleteSaved(item.id) },
                                ]
                            )}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.deleteBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                ))
            )}

            {/* Small tip */}
            <View style={styles.tipCard}>
                <Text style={styles.tipLabel}>💡 {isPt ? 'Dica' : 'Tip'}</Text>
                <Text style={styles.tipText}>{t('reports.tip')}</Text>
            </View>

        </ScrollView>
    );
}

// ── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center' },
    content: { padding: Spacing.md, paddingBottom: 48 },
    pageTitle: { ...Fonts.heavy, fontSize: 28, marginBottom: Spacing.lg },
    sectionLabel: {
        ...Fonts.semibold, fontSize: 12,
        textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: Spacing.sm,
    },
    noDataText: { ...Fonts.regular, fontSize: 12, color: COLORS.textTertiary, textAlign: 'center', marginTop: Spacing.sm },

    // ── Weekly chart ──
    chartCard: {
        backgroundColor: COLORS.surface, borderRadius: Radius.xl,
        padding: Spacing.lg, marginBottom: Spacing.lg,
        borderWidth: 1, borderColor: COLORS.border,
    },
    chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 6, marginBottom: 8 },
    barWrapper: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
    barFill: { width: '100%', borderRadius: 4, minHeight: 4 },
    chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    chartDayLabel: { ...Fonts.semibold, fontSize: 11, color: COLORS.textTertiary, textAlign: 'center', flex: 1 },
    chartDayLabelActive: { color: COLORS.primary, fontWeight: '800' },

    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: {
        flex: 1, backgroundColor: COLORS.surface,
        borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.border,
    },
    statEmoji: { fontSize: 26, marginBottom: 6 },
    statValue: { ...Fonts.heavy, fontSize: 26, color: COLORS.textPrimary },
    statLabel: { ...Fonts.medium, fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },

    // ── Monthly report card ──
    reportCard: {
        backgroundColor: COLORS.surface, borderRadius: Radius.xl,
        padding: Spacing.lg, borderWidth: 1, borderColor: COLORS.border,
        marginBottom: Spacing.md,
    },
    reportCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
    reportCardIconWrap: {
        width: 44, height: 44, borderRadius: Radius.md,
        backgroundColor: COLORS.primaryDim, alignItems: 'center', justifyContent: 'center',
    },
    reportCardIcon: { fontSize: 22 },
    reportCardTitle: { ...Fonts.bold, fontSize: 16, color: COLORS.textPrimary, marginBottom: 4 },
    reportCardDesc: { ...Fonts.regular, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },

    monthSelectLabel: { ...Fonts.semibold, fontSize: 11, color: COLORS.textTertiary, marginBottom: Spacing.sm },
    monthRow: { paddingBottom: Spacing.sm, gap: 8 },
    monthChip: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: Radius.full, borderWidth: 1.5, borderColor: COLORS.border,
        backgroundColor: COLORS.surfaceAlt,
    },
    monthChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
    monthChipDisabled: { opacity: 0.3 },
    monthChipText: { ...Fonts.semibold, fontSize: 13, color: COLORS.textSecondary },
    monthChipTextActive: { color: COLORS.primary },
    monthChipTextDisabled: { color: COLORS.textTertiary },

    selectedMonthText: { ...Fonts.bold, fontSize: 16, color: COLORS.textPrimary, marginTop: Spacing.sm, marginBottom: Spacing.md },

    generateBtn: {
        backgroundColor: COLORS.primary, borderRadius: Radius.full,
        paddingVertical: 14, alignItems: 'center',
    },
    generateBtnDisabled: { opacity: 0.5 },
    generateBtnText: { ...Fonts.bold, color: '#fff', fontSize: 15 },

    // ── Preview card ──
    previewCard: {
        backgroundColor: COLORS.surface, borderRadius: Radius.xl,
        padding: Spacing.lg, borderWidth: 1.5, borderColor: COLORS.primary + '40',
        marginBottom: Spacing.md,
    },
    previewTitle: { ...Fonts.bold, fontSize: 17, color: COLORS.textPrimary, marginBottom: 4 },
    previewSubtitle: { ...Fonts.regular, fontSize: 12, color: COLORS.textTertiary, marginBottom: Spacing.md },
    previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    previewStatCell: {
        width: (width - Spacing.md * 2 - Spacing.lg * 2 - Spacing.sm * 2) / 3,
        backgroundColor: COLORS.bg + 'CC', borderRadius: Radius.md,
        padding: Spacing.sm, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.border,
    },
    previewStatValue: { ...Fonts.heavy, fontSize: 20, color: COLORS.primary },
    previewStatLabel: { ...Fonts.regular, fontSize: 10, color: COLORS.textTertiary, marginTop: 3, textAlign: 'center' },

    trendPill: {
        alignSelf: 'flex-start', borderRadius: Radius.full,
        paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, marginBottom: Spacing.md,
    },
    trendText: { ...Fonts.semibold, fontSize: 13 },

    previewSubLabel: { ...Fonts.semibold, fontSize: 11, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
    assessmentRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        backgroundColor: COLORS.bg + 'AA', borderRadius: Radius.md, padding: Spacing.sm,
        marginBottom: 6, borderWidth: 1, borderColor: COLORS.border,
    },
    assessmentName: { ...Fonts.semibold, color: COLORS.textPrimary, flex: 1, fontSize: 13 },
    assessmentScore: { ...Fonts.regular, color: COLORS.textSecondary, fontSize: 12 },
    riskBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
    riskText: { ...Fonts.bold, fontSize: 10, letterSpacing: 0.5 },

    previewActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    regenerateBtn: {
        flex: 1, paddingVertical: 12, borderRadius: Radius.full,
        borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
    },
    regenerateBtnText: { ...Fonts.semibold, color: COLORS.textSecondary, fontSize: 14 },
    exportBtn: {
        flex: 2, paddingVertical: 12, borderRadius: Radius.full,
        backgroundColor: COLORS.primary, alignItems: 'center',
    },
    exportBtnText: { ...Fonts.bold, color: '#fff', fontSize: 14 },

    // ── Saved reports ──
    emptyCard: {
        backgroundColor: COLORS.surface, borderRadius: Radius.lg,
        padding: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
        marginBottom: Spacing.md,
    },
    emptyIcon: { fontSize: 36, marginBottom: Spacing.sm },
    emptyText: { ...Fonts.regular, fontSize: 13, color: COLORS.textTertiary, textAlign: 'center' },

    savedItem: {
        backgroundColor: COLORS.surface, borderRadius: Radius.lg,
        padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
        gap: Spacing.sm, marginBottom: Spacing.sm,
        borderWidth: 1, borderColor: COLORS.border,
    },
    savedIconWrap: {
        width: 40, height: 40, borderRadius: Radius.md,
        backgroundColor: COLORS.primaryDim, alignItems: 'center', justifyContent: 'center',
    },
    savedIcon: { fontSize: 20 },
    savedFilename: { ...Fonts.semibold, fontSize: 13, color: COLORS.textPrimary },
    savedDate: { ...Fonts.regular, fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },
    shareBtn: {
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
        borderWidth: 1.5, borderColor: COLORS.primary,
    },
    shareBtnText: { ...Fonts.semibold, color: COLORS.primary, fontSize: 12 },
    deleteBtn: {
        width: 30, height: 30, borderRadius: 15, alignItems: 'center',
        justifyContent: 'center', backgroundColor: COLORS.accentPink + '18',
    },
    deleteBtnText: { color: COLORS.accentPink, fontSize: 14, fontWeight: '700' },

    // ── Tip card ──
    tipCard: {
        backgroundColor: COLORS.primaryDim, borderRadius: Radius.lg,
        padding: Spacing.md, borderWidth: 1, borderColor: COLORS.primary + '40',
        marginTop: Spacing.md,
    },
    tipLabel: { ...Fonts.semibold, color: COLORS.primary, fontSize: 13, marginBottom: 6 },
    tipText: { ...Fonts.regular, color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
});
