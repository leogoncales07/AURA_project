import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants/Theme';

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const rememberMe = await AsyncStorage.getItem('aura_remember_me');
            if (rememberMe === 'false') {
                await AsyncStorage.removeItem('aura_token');
                await AsyncStorage.removeItem('aura_user');
                await AsyncStorage.removeItem('aura_remember_me');
                router.replace('/(auth)/login');
                return;
            }

            const token = await AsyncStorage.getItem('aura_token');
            if (token) {
                router.replace('/(tabs)/dashboard');
            } else {
                router.replace('/(auth)/login');
            }
        };
        checkAuth();
    }, []);

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
