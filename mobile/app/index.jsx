import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { api, clearSession } from '../lib/api';
import { COLORS } from '../constants/Theme';

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const rememberMe = await AsyncStorage.getItem('aura_remember_me');
            if (rememberMe === 'false') {
                await clearSession();
                await AsyncStorage.removeItem('aura_remember_me');
                router.replace('/(auth)/login');
                return;
            }

            const token = await AsyncStorage.getItem('aura_token');
            if (token) {
                const result = await api.getMe();
                if (result.status === 401) { router.replace('/(auth)/login'); return; }
                if (result.data?.user) {
                    const u = result.data.user;
                    await AsyncStorage.setItem('aura_user', JSON.stringify({ ...u, ...u.user_metadata,
                        name: u.user_metadata?.display_name || u.user_metadata?.name || u.email }));
                }
                router.replace('/(tabs)/dashboard');
            } else {
                router.replace('/(auth)/login');
            }
        };
        checkAuth();
    }, [router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
