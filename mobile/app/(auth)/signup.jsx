import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n';
import { COLORS, Fonts, Spacing, Radius } from '../../constants/Theme';

export default function SignupScreen() {
    const { t } = useI18n();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async () => {
        if (!name || !email || !password) return;
        setError('');
        setLoading(true);
        const { data, error: apiError } = await api.signup(email, password, name);
        if (apiError) {
            setError(apiError);
            setLoading(false);
            return;
        }
        if (data?.access_token) {
            await AsyncStorage.setItem('aura_token', data.access_token);
            await AsyncStorage.setItem('aura_user', JSON.stringify(data.user));
            router.replace('/(tabs)/dashboard');
        } else {
            setError('Unexpected error. Please try again.');
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.logoArea}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoLetter}>A</Text>
                    </View>
                    <Text style={styles.logoTitle}>{t('signup.title')}</Text>
                    <Text style={styles.logoSubtitle}>{t('signup.subtitle')}</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder={t('signup.namePlaceholder')}
                        placeholderTextColor={COLORS.textTertiary}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoComplete="name"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder={t('signup.emailPlaceholder')}
                        placeholderTextColor={COLORS.textTertiary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                    />
                    <TextInput
                        style={[styles.input, styles.inputLast]}
                        placeholder={t('signup.passwordPlaceholder')}
                        placeholderTextColor={COLORS.textTertiary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="new-password"
                    />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleSignup}
                        disabled={loading || !name || !email || !password}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.btnText}>{t('signup.submit')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('signup.hasAccount')} </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.footerLink}>{t('signup.signIn')}</Text>
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
        backgroundColor: COLORS.accentMint,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.md,
        shadowColor: COLORS.accentMint, shadowOpacity: 0.4,
        shadowRadius: 20, elevation: 10,
    },
    logoLetter: { ...Fonts.heavy, fontSize: 40, color: '#fff' },
    logoTitle: { ...Fonts.heavy, fontSize: 28, color: COLORS.textPrimary },
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
        backgroundColor: COLORS.accentMint,
        padding: Spacing.md,
        borderRadius: Radius.full,
        alignItems: 'center',
        minHeight: 52,
        justifyContent: 'center',
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { ...Fonts.semibold, color: '#fff', fontSize: 16 },

    footer: {
        flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', marginTop: Spacing.xl,
    },
    footerText: { color: COLORS.textSecondary, fontSize: 14 },
    footerLink: { color: COLORS.primary, fontSize: 14, ...Fonts.semibold },
});
