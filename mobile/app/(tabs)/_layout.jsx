import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/Theme';

function TabIcon({ name, focused }) {
    const icons = {
        dashboard: focused ? '⚡' : '⚡',
        chat: focused ? '💬' : '💬',
        assessment: focused ? '📋' : '📋',
        meditations: focused ? '🌬️' : '🌬️',
        reports: focused ? '📊' : '📊',
    };
    return (
        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <View style={styles.emojiWrap}>
                <View style={focused ? styles.activeDot : null} />
            </View>
        </View>
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textTertiary,
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
                tabBarBackground: () => <View style={styles.tabBarBg} />,
            })}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Início',
                    tabBarIcon: ({ focused }) => (
                        <TabSymbol symbol="house.fill" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Chat',
                    tabBarIcon: ({ focused }) => (
                        <TabSymbol symbol="bubble.left.fill" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="assessment"
                options={{
                    title: 'Testes',
                    tabBarIcon: ({ focused }) => (
                        <TabSymbol symbol="checklist" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="meditations"
                options={{
                    title: 'Pausar',
                    tabBarIcon: ({ focused }) => (
                        <TabSymbol symbol="wind" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="reports"
                options={{
                    title: 'Progresso',
                    tabBarIcon: ({ focused }) => (
                        <TabSymbol symbol="chart.bar.fill" focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

// Simple text-symbol fallback that works cross-platform
function TabSymbol({ symbol, focused }) {
    const symbols = {
        'house.fill': '🏠',
        'bubble.left.fill': '💬',
        checklist: '📋',
        wind: '🌬️',
        'chart.bar.fill': '📊',
    };
    const { Text } = require('react-native');
    return (
        <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
            {symbols[symbol] || '•'}
        </Text>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.tabBar,
        borderTopColor: COLORS.tabBorder,
        borderTopWidth: 0.5,
        height: Platform.OS === 'ios' ? 84 : 64,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        paddingTop: 8,
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
    },
    tabBarBg: { flex: 1, backgroundColor: COLORS.tabBar },
    tabLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
    tabItem: { paddingTop: 4 },
    iconWrap: { alignItems: 'center', justifyContent: 'center' },
    iconWrapActive: {},
    emojiWrap: {},
    activeDot: {
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: COLORS.primary, marginTop: 2,
    },
});
