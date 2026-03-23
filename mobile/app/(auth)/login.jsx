import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n';
import { COLORS, Fonts, Spacing, Radius } from '../../constants/Theme';

export default function LoginScreen() {
    const { t } = useI18n();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) return;
        setError('');
        setLoading(true);
        try {
            const { data, error: apiError } = await api.login(email, password);
            if (apiError) {
                setError(apiError === 'Invalid login credentials' ? t('login.invalidCredentials') : apiError);
                setLoading(true); // Keep spinner for a moment to avoid jump
                setTimeout(() => setLoading(false), 1000);
                return;
            }
            if (data?.access_token) {
                await AsyncStorage.setItem('aura_token', data.access_token);
                await AsyncStorage.setItem('aura_user', JSON.stringify(data.user));
                router.replace('/(tabs)/dashboard');
            } else {
                setError(t('login.serverError'));
                setLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(t('login.networkError') || 'Network error connecting to backend');
            setLoading(false);
        }
    };

    const handleDemo = async () => {
        setError('');
        setDemoLoading(true);
        try {
            const { data, error: apiError } = await api.login('demo@aura.com', 'demo123456');
            if (data?.access_token) {
                await AsyncStorage.setItem('aura_token', data.access_token);
                // Ensure the demo user has an 'id' property so the rest of the app doesn't break
                const demoUser = data.user || { 
                    id: 'demo-user-id', 
                    name: 'Demo User', 
                    email: 'demo@aura.com' 
                };
                await AsyncStorage.setItem('aura_user', JSON.stringify(demoUser));
                router.replace('/(tabs)/dashboard');
            } else {
                // If backend fails but we are in a presentation, we can optionally bypass
                // For now, let's show the error but allow a "magic" bypass if it's explicitly for a presentation
                setError(t('login.demoFailed') + ' (Network issue)');
                setDemoLoading(false);
            }
        } catch (err) {
            console.error('Demo login error:', err);
            setError('Could not reach backend for Demo. Please check internet connection.');
            setDemoLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Logo */}
                <View style={styles.logoArea}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoLetter}>A</Text>
                    </View>
                    <Text style={styles.logoTitle}>AURA</Text>
                    <Text style={styles.logoSubtitle}>{t('login.subtitle')}</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder={t('login.emailPlaceholder')}
                        placeholderTextColor={COLORS.textTertiary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                    />
                    <TextInput
                        style={[styles.input, styles.inputLast]}
                        placeholder={t('login.passwordPlaceholder')}
                        placeholderTextColor={COLORS.textTertiary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="password"
                    />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading || !email || !password}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.btnPrimaryText}>{t('login.submit')}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, styles.btnOutline, demoLoading && styles.btnDisabled]}
                        onPress={handleDemo}
                        disabled={demoLoading}
                        activeOpacity={0.8}
                    >
                        {demoLoading ? (
                            <ActivityIndicator color={COLORS.primary} size="small" />
                        ) : (
                            <Text style={styles.btnOutlineText}>{t('login.demoButton')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('login.noAccount')} </Text>
                    <Link href="/(auth)/signup" asChild>
                        <TouchableOpacity>
                            <Text style={styles.footerLink}>{t('login.createAccount')}</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },

    logoArea: { alignItems: 'center', marginBottom: Spacing.xxl },
    logoCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.md,
        shadowColor: COLORS.primary, shadowOpacity: 0.5,
        shadowRadius: 20, elevation: 10,
    },
    logoLetter: { ...Fonts.heavy, fontSize: 40, color: '#fff' },
    logoTitle: { ...Fonts.heavy, fontSize: 32, color: COLORS.textPrimary, letterSpacing: 6 },
    logoSubtitle: { ...Fonts.regular, fontSize: 14, color: COLORS.textSecondary, marginTop: 6 },

    form: { gap: 0 },
    input: {
        backgroundColor: COLORS.surface,
        color: COLORS.textPrimary,
        padding: Spacing.md,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: 15,
        ...Fonts.regular,
        marginBottom: 2,
    },
    inputLast: { marginBottom: Spacing.md },
    errorText: { color: COLORS.accentPink, fontSize: 13, textAlign: 'center', marginBottom: Spacing.sm },

    btn: {
        padding: Spacing.md,
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        marginBottom: Spacing.sm,
    },
    btnPrimary: { backgroundColor: COLORS.primary },
    btnOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    btnDisabled: { opacity: 0.6 },
    btnPrimaryText: { ...Fonts.semibold, color: '#fff', fontSize: 16 },
    btnOutlineText: { ...Fonts.semibold, color: COLORS.primary, fontSize: 15 },

    footer: {
        flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', marginTop: Spacing.xl,
    },
    footerText: { color: COLORS.textSecondary, fontSize: 14 },
    footerLink: { color: COLORS.primary, fontSize: 14, ...Fonts.semibold },
});
