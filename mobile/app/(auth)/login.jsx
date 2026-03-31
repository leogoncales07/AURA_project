import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Dimensions
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n';
import { COLORS, Fonts, Spacing, Radius } from '../../constants/Theme';

const { width, height } = Dimensions.get('window');

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
                setLoading(true);
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
                const demoUser = data.user || { 
                    id: 'demo-user-id', 
                    name: 'Demo User', 
                    email: 'demo@aura.com' 
                };
                await AsyncStorage.setItem('aura_user', JSON.stringify(demoUser));
                router.replace('/(tabs)/dashboard');
            } else {
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
        <View style={styles.root}>
            {/* Ambient Aura Gradients in absolute background */}
            <LinearGradient
                colors={[COLORS.primary, 'transparent']}
                style={[styles.auraBlob, { top: -height * 0.1, left: -width * 0.2 }]}
                start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }}
            />
            <LinearGradient
                colors={[COLORS.secondary, 'transparent']}
                style={[styles.auraBlob, { bottom: -height * 0.1, right: -width * 0.3 }]}
                start={{ x: 0.5, y: 0.5 }} end={{ x: 0, y: 0 }}
            />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    
                    {/* Glassmorphism Container */}
                    <BlurView intensity={40} tint="dark" style={styles.glassContainer}>
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
                                style={[styles.btn, loading && styles.btnDisabled]}
                                onPress={handleLogin}
                                disabled={loading || !email || !password}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[COLORS.primary, COLORS.secondary]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={StyleSheet.absoluteFillObject}
                                />
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.btnPrimaryText}>{t('login.submit')}</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btnOutline, demoLoading && styles.btnDisabled]}
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
                    </BlurView>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg },
    keyboardView: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },

    auraBlob: {
        position: 'absolute',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: 9999,
        opacity: 0.15,
        transform: [{ scale: 1.2 }],
    },

    glassContainer: {
        padding: Spacing.xl,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        backgroundColor: COLORS.card, // Fallback for poor blur rendering
    },

    logoArea: { alignItems: 'center', marginBottom: Spacing.xxl },
    logoCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.md,
        shadowColor: COLORS.primary, shadowOpacity: 0.5,
        shadowRadius: 20, elevation: 10,
    },
    logoLetter: { ...Fonts.heavy, fontSize: 36, color: '#fff' },
    logoTitle: { ...Fonts.serif, fontWeight: '500', fontSize: 36, color: COLORS.textPrimary, letterSpacing: 2 },
    logoSubtitle: { ...Fonts.regular, fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

    form: { gap: 0 },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: COLORS.textPrimary,
        padding: Spacing.md,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: 15,
        ...Fonts.regular,
        marginBottom: Spacing.sm,
    },
    inputLast: { marginBottom: Spacing.lg },
    errorText: { color: COLORS.accentPink, fontSize: 13, textAlign: 'center', marginBottom: Spacing.sm },

    btn: {
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        marginBottom: Spacing.md,
        overflow: 'hidden', // to clip the absolute gradient
    },
    btnDisabled: { opacity: 0.6 },
    btnPrimaryText: { ...Fonts.semibold, color: '#fff', fontSize: 16 },
    
    btnOutline: {
        borderRadius: Radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    btnOutlineText: { ...Fonts.semibold, color: COLORS.textPrimary, fontSize: 15 },

    footer: {
        flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', marginTop: Spacing.xl,
    },
    footerText: { color: COLORS.textSecondary, fontSize: 14 },
    footerLink: { color: COLORS.primary, fontSize: 14, ...Fonts.semibold },
});

