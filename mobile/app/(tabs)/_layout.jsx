import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme, Fonts } from '../../constants/Theme';
import { useI18n } from '../../i18n';
import { Feather } from '@expo/vector-icons';

const TAB_ICONS = {
    dashboard:   'grid',
    chat:        'message-square',
    assessment:  'clipboard',
    meditations: 'feather',
    reports:     'bar-chart-2',
};

function TabIcon({ name, focused, colors }) {
    const iconName = TAB_ICONS[name];
    if (!iconName) return null;
    return (
        <Feather
            name={iconName}
            size={21}
            color={focused ? colors.primary : colors.textTertiary}
        />
    );
}

export default function TabsLayout() {
    const { colors, theme } = useTheme();
    const { t } = useI18n();
    const isDark = theme === 'dark';

    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: [styles.tabBar, {
                    backgroundColor: colors.tabBar,
                    borderTopColor: colors.tabBorder,
                    shadowColor: isDark ? '#000' : 'rgba(0,0,0,0.08)',
                }],
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textTertiary,
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
                tabBarBackground: () => (
                    <View style={[styles.tabBarBg, { backgroundColor: colors.tabBar }]} />
                ),
            })}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: t('tabs.dashboard'),
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="dashboard" focused={focused} colors={colors} />
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: t('tabs.chat'),
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="chat" focused={focused} colors={colors} />
                    ),
                }}
            />
            <Tabs.Screen
                name="assessment"
                options={{
                    title: t('tabs.assessment'),
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="assessment" focused={focused} colors={colors} />
                    ),
                }}
            />
            <Tabs.Screen
                name="meditations"
                options={{
                    title: t('tabs.meditations'),
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="meditations" focused={focused} colors={colors} />
                    ),
                }}
            />
            <Tabs.Screen
                name="reports"
                options={{
                    title: t('tabs.reports'),
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="reports" focused={focused} colors={colors} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        borderTopWidth: 0.5,
        height: Platform.OS === 'ios' ? 84 : 64,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        paddingTop: 8,
        elevation: 20,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
    },
    tabBarBg: { flex: 1 },
    tabLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
    tabItem: { paddingTop: 4 },
});
