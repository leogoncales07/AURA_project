import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { I18nProvider } from '../i18n';
import { COLORS } from '../constants/Theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <I18nProvider>
                <View style={styles.root}>
                    <StatusBar style="light" />
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: COLORS.bg },
                            animation: 'fade_from_bottom',
                        }}
                    >
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)/login" />
                        <Stack.Screen name="(auth)/signup" />
                        <Stack.Screen name="(tabs)" />
                    </Stack>
                </View>
            </I18nProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
});
