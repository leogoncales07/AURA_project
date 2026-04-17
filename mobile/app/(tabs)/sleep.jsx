import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useI18n } from '../../i18n';
import { useTheme, Fonts, Spacing, Radius } from '../../constants/Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsModal from '../../components/SettingsModal';

// SVG components based on the web version
const ClockHero = ({ sleepData }) => {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    
    // Determine center text (time) based on current real time or logged sleep time
    const displayTime = sleepData ? (sleepData.isAvg ? `${sleepData.hours}h` : sleepData.bedTime) : "22:45";
    const subText = sleepData ? (sleepData.isAvg ? "AVERAGE SLEEP" : "LOGGED BED TIME") : "WIND DOWN";

    return (
        <View style={styles.clockContainer}>
            <Svg viewBox="0 0 100 100" width="200" height="200">
                {/* Background Circle */}
                <Circle cx="50" cy="50" r="45" fill="none" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} strokeWidth="1.5" />
                
                {/* Sleep Arc (Blueish) */}
                <Path 
                    d="M 50 5 A 45 45 0 0 1 95 50 A 45 45 0 0 1 50 95" 
                    fill="none" 
                    stroke="#5B8AF0" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    transform="rotate(135 50 50)"
                />
                
                {/* Wake Arc (Orange-ish) */}
                <Path 
                    d="M 50 95 A 45 45 0 0 1 5 50 A 45 45 0 0 1 50 5" 
                    fill="none" 
                    stroke="#F0A070" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    transform="rotate(135 50 50)"
                    opacity="0.6"
                />
                
                {/* Current Time Dot */}
                <Circle cx="50" cy="5" r="3" fill={isDark ? "#fff" : "#111"} transform="rotate(320 50 50)" />
            </Svg>
            
            <View style={[styles.clockTimeCentral, { position: 'absolute' }]}>
                <Text style={[styles.clockTimeText, { color: colors.textPrimary }]}>{displayTime}</Text>
                <Text style={[styles.clockWindText, { color: colors.textTertiary }]}>{subText}</Text>
                {sleepData && !sleepData.isAvg && (
                    <Text style={[styles.clockWindText, { color: '#5B8AF0', marginTop: 4 }]}>{sleepData.hours} HRS SLEPT</Text>
                )}
            </View>
        </View>
    );
};

export default function SleepTab() {
    const { t } = useI18n();
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const isDark = theme === 'dark';
    
    const [user, setUser] = useState(null);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [watchSynced, setWatchSynced] = useState(false);
    
    const [sleepLogs, setSleepLogs] = useState([]);
    const [timeframe, setTimeframe] = useState('Day');

    // Modal
    const [logModalVisible, setLogModalVisible] = useState(false);
    const [bedTimeInput, setBedTimeInput] = useState('23:30');
    const [wakeTimeInput, setWakeTimeInput] = useState('07:00');

    // Automatic calculation logic
    const calculateHours = (bed, wake) => {
        const bedParts = bed.split(':');
        const wakeParts = wake.split(':');
        if (bedParts.length !== 2 || wakeParts.length !== 2) return null;
        
        const bedH = parseInt(bedParts[0], 10);
        const bedM = parseInt(bedParts[1], 10);
        const wakeH = parseInt(wakeParts[0], 10);
        const wakeM = parseInt(wakeParts[1], 10);
        
        if (isNaN(bedH) || isNaN(bedM) || isNaN(wakeH) || isNaN(wakeM)) return null;

        const bedDecimal = bedH + (bedM / 60);
        const wakeDecimal = wakeH + (wakeM / 60);

        let diff = wakeDecimal - bedDecimal;
        if (diff <= 0) {
            diff += 24; // Crosses midnight
        }
        return parseFloat(diff.toFixed(1));
    };

    const handleSaveLog = () => {
        const calculatedHours = calculateHours(bedTimeInput, wakeTimeInput) || 8;
        setLogModalVisible(false);
        const newLog = {
            id: Date.now().toString(),
            bedTime: bedTimeInput,
            wakeTime: wakeTimeInput,
            hours: calculatedHours,
            timestamp: new Date().toISOString()
        };
        const updatedLogs = [newLog, ...sleepLogs];
        setSleepLogs(updatedLogs);
        AsyncStorage.setItem('aura_sleep_logs_array', JSON.stringify(updatedLogs));
    };

    // Load data from storage
    useEffect(() => {
        AsyncStorage.getItem('aura_user').then(u => { if (u) setUser(JSON.parse(u)); });
        AsyncStorage.getItem('aura_sleep_logs_array').then(res => {
            if (res) {
                try { setSleepLogs(JSON.parse(res)); } catch(e){}
            }
        });
    }, []);

    const getAggregatedData = () => {
        if (!sleepLogs || !sleepLogs.length) return null;
        const now = new Date();
        let filtered = [];
        
        if (timeframe === 'Day') {
             return sleepLogs[0]; 
        } else if (timeframe === 'Week') {
             const limit = new Date(now.setDate(now.getDate() - 7));
             filtered = sleepLogs.filter(l => new Date(l.timestamp) >= limit);
        } else if (timeframe === 'Month') {
             const limit = new Date(now.setDate(now.getDate() - 30));
             filtered = sleepLogs.filter(l => new Date(l.timestamp) >= limit);
        } else if (timeframe === 'Year') {
             const limit = new Date(now.setFullYear(now.getFullYear() - 1));
             filtered = sleepLogs.filter(l => new Date(l.timestamp) >= limit);
        }

        if(!filtered.length) return sleepLogs[0]; // fallback to oldest/latest

        const avgHours = filtered.reduce((acc, obj) => acc + obj.hours, 0) / filtered.length;
        return {
             hours: parseFloat(avgHours.toFixed(1)),
             bedTime: "--:--", 
             isAvg: true
        }
    };

    const displayData = getAggregatedData();

    const weeklyData = [
        { day: 'M', duration: 7.2, quality: 80 },
        { day: 'T', duration: 6.8, quality: 75 },
        { day: 'W', duration: 8.1, quality: 90 },
        { day: 'T', duration: 7.5, quality: 82 },
        { day: 'F', duration: 7.0, quality: 78 },
        { day: 'S', duration: 9.2, quality: 95 },
        { day: 'S', duration: 8.5, quality: 88 },
    ];

    const sleepScore = 84;

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>sleep sanctuary</Text>
                
                <View style={styles.headerRight}>
                    <TouchableOpacity 
                        style={[styles.smallLogButton, { backgroundColor: colors.primaryDim }]} 
                        onPress={() => setLogModalVisible(true)}
                    >
                        <Feather name="plus" size={14} color={colors.primary} />
                        <Text style={[styles.smallLogButtonText, { color: colors.primary }]}>{t('sleepTab.logData') || 'Log'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.avatarBtn, { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(16,185,129,0.35)' }]}
                        onPress={() => setSettingsVisible(true)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            style={StyleSheet.absoluteFillObject}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        />
                        <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                style={styles.scrollContent} 
                contentContainerStyle={styles.scrollInner}
                showsVerticalScrollIndicator={false}
            >
                {/* Timeframe Tabs */}
                <View style={styles.timeframeTabs}>
                    {['Day', 'Week', 'Month', 'Year'].map(tab => (
                        <TouchableOpacity 
                            key={tab} 
                            style={[
                                styles.timeframeTab, 
                                timeframe === tab && { backgroundColor: isDark ? colors.surface : colors.primaryDim }
                            ]}
                            onPress={() => setTimeframe(tab)}
                        >
                            <Text style={[
                                styles.timeframeText, 
                                timeframe === tab 
                                    ? { color: colors.primary, fontFamily: Fonts.bold.fontFamily, fontWeight: '700' } 
                                    : { color: colors.textSecondary }
                            ]}>
                                {t(`sleepTab.${tab.toLowerCase()}`) || tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Main Hero */}
                <ClockHero sleepData={displayData} />

                {/* Score Section */}
                <View style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.scoreCircle}>
                        <Text style={[styles.scoreValueText, { color: colors.textPrimary }]}>{sleepScore}</Text>
                    </View>
                    <View style={styles.scoreTextCont}>
                        <Text style={[styles.scoreTitle, { color: colors.textPrimary }]}>Restorative Sleep</Text>
                        <Text style={[styles.scoreSubtitle, { color: colors.textTertiary }]}>Your quality is 12% higher than last week.</Text>
                    </View>
                </View>

                {/* Smartwatch Setup */}
                <TouchableOpacity 
                    style={[styles.watchCard, { backgroundColor: colors.surface }]}
                    onPress={() => setWatchSynced(true)}
                >
                    <View style={[styles.iconBox, { backgroundColor: watchSynced ? 'rgba(16,185,129,0.15)' : 'rgba(158,158,158,0.15)' }]}>
                        <Feather name="watch" size={18} color={watchSynced ? colors.primary : colors.textTertiary} />
                    </View>
                    <View style={styles.watchTextContainer}>
                        <Text style={[styles.watchTitle, { color: colors.textPrimary }]}>
                            {watchSynced ? "Smartwatch Synced" : "Connect Smartwatch"}
                        </Text>
                        <Text style={[styles.watchSubtitle, { color: colors.textTertiary }]}>
                            {watchSynced ? "Activity tracking active" : "Sync devices for accurate data"}
                        </Text>
                    </View>
                    {watchSynced && <Feather name="check" size={20} color={colors.primary} />}
                </TouchableOpacity>

                {/* Tonight's Protocol */}
                <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.xl }]}>
                    TONIGHT'S PROTOCOL
                </Text>

                <View style={[styles.protocolCard, { backgroundColor: colors.surface, borderLeftColor: '#4FC3F7' }]}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(79,195,247,0.15)' }]}>
                        <Feather name="wind" size={18} color="#4FC3F7" />
                    </View>
                    <View style={styles.protocolInfo}>
                        <View style={styles.protocolHeaderRow}>
                            <Text style={[styles.protocolTitle, { color: colors.textPrimary }]}>Wind Down</Text>
                            <Text style={[styles.protocolTime, { color: colors.textTertiary }]}>21:30 - 23:00</Text>
                        </View>
                        <Text style={[styles.protocolDesc, { color: colors.textTertiary }]}>No blue light. Soft reading or breathwork.</Text>
                    </View>
                </View>

                <View style={[styles.protocolCard, { backgroundColor: colors.surface, borderLeftColor: '#5B8AF0' }]}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(91,138,240,0.15)' }]}>
                        <Feather name="moon" size={18} color="#5B8AF0" />
                    </View>
                    <View style={styles.protocolInfo}>
                        <View style={styles.protocolHeaderRow}>
                            <Text style={[styles.protocolTitle, { color: colors.textPrimary }]}>Core Sleep</Text>
                            <Text style={[styles.protocolTime, { color: colors.textTertiary }]}>23:00 - 03:00</Text>
                        </View>
                        <Text style={[styles.protocolDesc, { color: colors.textTertiary }]}>Consistent temperature at 18°C.</Text>
                    </View>
                </View>

                <View style={[styles.protocolCard, { backgroundColor: colors.surface, borderLeftColor: '#9E9E9E' }]}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(158,158,158,0.15)' }]}>
                        <Feather name="activity" size={18} color="#9E9E9E" />
                    </View>
                    <View style={styles.protocolInfo}>
                        <View style={styles.protocolHeaderRow}>
                            <Text style={[styles.protocolTitle, { color: colors.textPrimary }]}>Deep Cycle</Text>
                            <Text style={[styles.protocolTime, { color: colors.textTertiary }]}>03:00 - 06:00</Text>
                        </View>
                        <Text style={[styles.protocolDesc, { color: colors.textTertiary }]}>Peak physical and mental recovery.</Text>
                    </View>
                </View>

                <View style={[styles.protocolCard, { backgroundColor: colors.surface, borderLeftColor: '#FFB340' }]}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255,179,64,0.15)' }]}>
                        <Feather name="sun" size={18} color="#FFB340" />
                    </View>
                    <View style={styles.protocolInfo}>
                        <View style={styles.protocolHeaderRow}>
                            <Text style={[styles.protocolTitle, { color: colors.textPrimary }]}>Wake Window</Text>
                            <Text style={[styles.protocolTime, { color: colors.textTertiary }]}>06:00 - 07:30</Text>
                        </View>
                        <Text style={[styles.protocolDesc, { color: colors.textTertiary }]}>Light exposure within 15 mins of waking.</Text>
                    </View>
                </View>

                {/* Weekly Efficiency */}
                <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.xl }]}>
                    WEEKLY EFFICIENCY
                </Text>
                
                <View style={[styles.weeklyCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.chartGrid}>
                        {weeklyData.map((data, i) => (
                            <View key={i} style={styles.chartColumn}>
                                {/* Invisible max height container (approx 100px) */}
                                <View style={styles.chartBarArea}>
                                    <View style={[styles.chartDot, { bottom: `${data.quality}%` }]} />
                                    <View style={[styles.chartBar, { height: `${(data.duration / 10) * 100}%` }]} />
                                </View>
                                <Text style={[styles.chartLabelText, { color: colors.textTertiary }]}>{data.day}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* New Feature: Rest Environment */}
                <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: Spacing.xl }]}>
                    REST ENVIRONMENT
                </Text>

                <TouchableOpacity 
                    style={[styles.protocolCard, { backgroundColor: colors.surface, borderLeftColor: '#F0A070' }]} 
                    onPress={() => router.push('/(tabs)/meditations')}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(240,160,112,0.15)' }]}>
                        <Feather name="headphones" size={18} color="#F0A070" />
                    </View>
                    <View style={styles.protocolInfo}>
                        <View style={styles.protocolHeaderRow}>
                            <Text style={[styles.protocolTitle, { color: colors.textPrimary }]}>White Noise & Sounds</Text>
                        </View>
                        <Text style={[styles.protocolDesc, { color: colors.textTertiary }]}>Brown noise, rain, and deep focus.</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.protocolCard, { backgroundColor: colors.surface, borderLeftColor: '#5B8AF0' }]}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(91,138,240,0.15)' }]}>
                        <Feather name="bell" size={18} color="#5B8AF0" />
                    </View>
                    <View style={styles.protocolInfo}>
                        <View style={styles.protocolHeaderRow}>
                            <Text style={[styles.protocolTitle, { color: colors.textPrimary }]}>Smart Alarm (Beta)</Text>
                            <Text style={[styles.protocolTime, { color: colors.textTertiary }]}>Off</Text>
                        </View>
                        <Text style={[styles.protocolDesc, { color: colors.textTertiary }]}>Wakes you during a light sleep cycle.</Text>
                    </View>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />

            {/* Log Data Modal */}
            <Modal
                visible={logModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setLogModalVisible(false)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                            {t('sleepTab.logData') || 'Log Sleep'}
                        </Text>
                        
                        <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                            Input your times in HH:MM format. We will calculate the total hours automatically.
                        </Text>

                        <Text style={[styles.label, { color: colors.textSecondary }]}>
                            {t('sleepTab.bedTime') || 'Bed Time'} (e.g. 23:30)
                        </Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
                            value={bedTimeInput}
                            onChangeText={setBedTimeInput}
                            placeholder="23:30"
                            placeholderTextColor={colors.textGhost}
                        />

                        <Text style={[styles.label, { color: colors.textSecondary }]}>
                            {t('sleepTab.wakeUpTime') || 'Wake Time'} (e.g. 07:15)
                        </Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
                            value={wakeTimeInput}
                            onChangeText={setWakeTimeInput}
                            placeholder="07:15"
                            placeholderTextColor={colors.textGhost}
                        />

                        {/* Live calculation preview */}
                        {calculateHours(bedTimeInput, wakeTimeInput) !== null && (
                            <Text style={[styles.previewText, { color: colors.primary }]}>
                                {calculateHours(bedTimeInput, wakeTimeInput)} hours total
                            </Text>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setLogModalVisible(false)}>
                                <Text style={[styles.modalCancelText, { color: colors.textTertiary }]}>
                                    {t('common.cancel') || 'Cancel'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalSave, { backgroundColor: colors.primary }]} onPress={handleSaveLog}>
                                <Text style={styles.modalSaveText}>
                                    {t('common.save') || 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Fonts.serif.fontFamily, // Matching the serif/gentle font of the web if available, else system
        fontWeight: Fonts.medium.fontWeight,
    },
    smallLogButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radius.full,
    },
    smallLogButtonText: {
        fontSize: 12,
        fontFamily: Fonts.semibold.fontFamily,
        fontWeight: Fonts.semibold.fontWeight,
    },
    scrollContent: {
        flex: 1,
    },
    scrollInner: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
    },
    clockContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: Spacing.xl,
        position: 'relative',
    },
    clockTimeCentral: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    clockTimeText: {
        fontSize: 32,
        fontFamily: Fonts.serif.fontFamily,
        fontWeight: Fonts.regular.fontWeight,
        marginBottom: 4,
    },
    clockWindText: {
        fontSize: 10,
        letterSpacing: 2,
        fontFamily: Fonts.medium.fontFamily,
        fontWeight: Fonts.medium.fontWeight,
        textTransform: 'uppercase',
    },
    scoreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    scoreCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#5B8AF0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    scoreValueText: {
        fontSize: 18,
        fontFamily: Fonts.bold.fontFamily,
        fontWeight: Fonts.bold.fontWeight,
    },
    scoreTextCont: {
        flex: 1,
    },
    scoreTitle: {
        fontSize: 16,
        fontFamily: Fonts.semibold.fontFamily,
        fontWeight: Fonts.semibold.fontWeight,
        marginBottom: 2,
    },
    scoreSubtitle: {
        fontSize: 12,
        fontFamily: Fonts.regular.fontFamily,
        fontWeight: Fonts.regular.fontWeight,
    },
    sectionHeading: {
        fontSize: 10,
        fontFamily: Fonts.semibold.fontFamily,
        fontWeight: Fonts.semibold.fontWeight,
        letterSpacing: 1.5,
        marginBottom: Spacing.md,
    },
    protocolCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radius.md,
        borderLeftWidth: 4,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    protocolInfo: {
        flex: 1,
    },
    protocolHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    protocolTitle: {
        fontSize: 15,
        fontFamily: Fonts.medium.fontFamily,
        fontWeight: Fonts.medium.fontWeight,
    },
    protocolTime: {
        fontSize: 11,
        fontFamily: Fonts.regular.fontFamily,
        fontWeight: Fonts.regular.fontWeight,
    },
    protocolDesc: {
        fontSize: 12,
        fontFamily: Fonts.regular.fontFamily,
        fontWeight: Fonts.regular.fontWeight,
    },
    weeklyCard: {
        padding: Spacing.lg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    chartGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
        paddingTop: 10,
    },
    chartColumn: {
        alignItems: 'center',
        width: '12%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    chartBarArea: {
        height: 80,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 8,
        position: 'relative',
    },
    chartBar: {
        width: 12,
        backgroundColor: '#AEE4D7',
        borderRadius: 2,
    },
    chartDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#06B6D4',
        position: 'absolute',
        zIndex: 2,
        marginLeft: -2,
        left: '50%',
    },
    chartLabelText: {
        fontSize: 10,
        fontFamily: Fonts.medium.fontFamily,
        fontWeight: Fonts.medium.fontWeight,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        borderRadius: Radius.lg,
        padding: Spacing.xl,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: Fonts.semibold.fontFamily,
        fontWeight: Fonts.semibold.fontWeight,
        marginBottom: Spacing.xs,
    },
    modalDesc: {
        fontSize: 13,
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 14,
        marginBottom: Spacing.xs,
        marginTop: Spacing.sm,
        fontFamily: Fonts.medium.fontFamily,
        fontWeight: Fonts.medium.fontWeight,
    },
    input: {
        borderRadius: Radius.sm,
        padding: Spacing.md,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    previewText: {
        marginTop: Spacing.md,
        fontSize: 14,
        fontFamily: Fonts.semibold.fontFamily,
        fontWeight: Fonts.semibold.fontWeight,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: Spacing.lg,
        gap: Spacing.md,
    },
    modalCancel: {
        padding: Spacing.md,
    },
    modalCancelText: {
        fontSize: 16,
        fontFamily: Fonts.medium.fontFamily,
        fontWeight: Fonts.medium.fontWeight,
    },
    modalSave: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
    },
    modalSaveText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: Fonts.semibold.fontFamily,
        fontWeight: Fonts.semibold.fontWeight,
    },
    timeframeTabs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: Radius.full,
        padding: 4,
        marginBottom: Spacing.md,
    },
    timeframeTab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: Radius.full,
    },
    timeframeText: {
        fontSize: 13,
        fontFamily: Fonts.medium.fontFamily,
        fontWeight: Fonts.medium.fontWeight,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatarBtn: {
        width: 36, height: 36, borderRadius: 18,
        overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
    },
    avatarText: {
        fontFamily: Fonts.bold.fontFamily,
        fontWeight: Fonts.bold.fontWeight,
        color: '#fff', fontSize: 14, zIndex: 10,
    },
    watchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
        marginTop: Spacing.md,
    },
    watchTextContainer: {
        flex: 1,
    },
    watchTitle: {
        fontSize: 15,
        fontFamily: Fonts.medium.fontFamily,
        fontWeight: Fonts.medium.fontWeight,
    },
    watchSubtitle: {
        fontSize: 12,
        fontFamily: Fonts.regular.fontFamily,
        fontWeight: Fonts.regular.fontWeight,
    },
});
