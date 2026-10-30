import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { api, clearSession } from '../lib/api';
import { COLORS } from '../constants/Theme';
import { useI18n } from '../i18n';

export default function Index() {
    const router = useRouter();
    const { t } = useI18n();
    const [retry, setRetry] = useState(0);
    const [connectionError, setConnectionError] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            setConnectionError(false);
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
                if (!result.data?.user) { setConnectionError(true); return; }
                const u = result.data.user;
                await AsyncStorage.setItem('aura_user', JSON.stringify({ ...u, ...u.user_metadata,
                    name: u.user_metadata?.display_name || u.user_metadata?.name || u.email }));
                router.replace('/(tabs)/dashboard');
            } else {
                router.replace('/(auth)/login');
            }
        };
        checkAuth();
    }, [router, retry]);

    return (
        <View style={styles.container}>
            {connectionError ? <>
                <Text style={styles.error}>{t('login.networkError')}</Text>
                <TouchableOpacity onPress={() => setRetry(value => value + 1)} style={styles.retry}>
                    <Text style={styles.retryText}>{t('common.retry')}</Text>
                </TouchableOpacity>
            </> : <ActivityIndicator size="large" color={COLORS.primary} />}
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
    error: { color: COLORS.textPrimary, textAlign: 'center', marginHorizontal: 24, marginBottom: 16 },
    retry: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
    retryText: { color: '#fff', fontWeight: '600' },
});
