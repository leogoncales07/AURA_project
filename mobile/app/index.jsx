import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants/Theme';

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        AsyncStorage.getItem('aura_token').then((token) => {
            if (token) {
                router.replace('/(tabs)/dashboard');
            } else {
                router.replace('/(auth)/login');
            }
        });
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
