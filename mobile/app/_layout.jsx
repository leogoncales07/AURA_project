import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { I18nProvider } from '../i18n';
import { ThemeProvider, useTheme } from '../constants/Theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import { registerForPushNotificationsAsync, scheduleDailyMoodReminder } from '../lib/notifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AppShell() {
    const { colors, theme } = useTheme();

    useEffect(() => {
        SplashScreen.hideAsync().catch(() => { /* ignore */ });
        
        // 1) Configure audio to play in background (e.g. screen off during meditation/sleep)
        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        }).catch((e) => console.warn('Audio mode config error:', e));

        // 2) Setup daily local mood notification reminder
        registerForPushNotificationsAsync()
            .then((hasPermission) => {
                if (hasPermission) scheduleDailyMoodReminder();
            })
            .catch(() => {});
    }, []);

    return (
        <View style={[styles.root, { backgroundColor: colors.bg }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.bg },
                    animation: 'fade_from_bottom',
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
            </Stack>
        </View>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <I18nProvider>
                    <AppShell />
                </I18nProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
});
