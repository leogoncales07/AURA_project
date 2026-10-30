import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';
import { serviceUrl } from './dev-server.mjs';

// ── API URL — always derived from Expo's Metro host (same machine, port 8000) ──
// This avoids hardcoded IPs that break whenever the router reassigns a new address.
const _hostUri =
    Constants?.expoConfig?.hostUri ||       // Expo SDK 46+
    Constants?.manifest2?.extra?.expoGo?.debuggerHost || // Expo Go
    Constants?.manifest?.debuggerHost ||    // Legacy
    '';

const API_URL = serviceUrl(process.env.EXPO_PUBLIC_API_URL, _hostUri, 8000, __DEV__);


let refreshPromise;
export async function clearSession() {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter(key => key.startsWith('aura_cache_') || key.startsWith('aura_reports_') || key.startsWith('aura_saved_reports') || key === 'aura_sleep_logs_array'));
    await AsyncStorage.multiRemove(['aura_token', 'aura_refresh_token', 'aura_user']);
}
async function renewSession() {
    if (!refreshPromise) refreshPromise = (async () => {
        const refresh_token = await AsyncStorage.getItem('aura_refresh_token');
        if (!refresh_token) { await clearSession(); return false; }
        const result = await fetchApi('/auth/refresh', { method: 'POST', body: { refresh_token }, skipRefresh: true });
        if (result.data?.access_token) {
            if (await AsyncStorage.getItem('aura_refresh_token') !== refresh_token) return false;
            await AsyncStorage.multiSet([['aura_token', result.data.access_token], ['aura_refresh_token', result.data.refresh_token]]);
            return true;
        }
        if (result.status === 401) await clearSession();
        return false;
    })().finally(() => { refreshPromise = null; });
    return refreshPromise;
}
async function fetchApi(endpoint, options = {}) {
    const { method = 'GET', body, headers = {}, skipRefresh = false, ...rest } = options;
    const token = await AsyncStorage.getItem('aura_token');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
        const response = await fetch(API_URL + endpoint, {
            method, headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true',
                ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers },
            signal: controller.signal, ...rest, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
        const data = await response.json().catch(() => ({}));
        const canRefresh = !skipRefresh && (!endpoint.startsWith('/auth/') || endpoint === '/auth/me');
        if (response.status === 401 && token && canRefresh) {
            if (await AsyncStorage.getItem('aura_token') !== token || await renewSession()) {
                return fetchApi(endpoint, { ...options, skipRefresh: true });
            }
            if (await AsyncStorage.getItem('aura_token') === token) return { error: 'Unable to renew session. Please try again.', status: 503 };
        }
        if (!response.ok) return { error: data?.error?.message || data?.message || data?.detail || 'API Error', status: response.status };
        if ((endpoint === '/auth/login' || endpoint === '/auth/signup') && data.refresh_token) {
            await AsyncStorage.setItem('aura_refresh_token', data.refresh_token);
        }
        return { data, status: response.status };
    } catch (error) {
        return { error: error.name === 'AbortError' ? 'Request timed out' : 'Network error or server down', status: 503 };
    } finally { clearTimeout(timeout); }
}

export const api = {
    // Auth
    signup: (email, password, name) =>
        fetchApi('/auth/signup', { method: 'POST', body: { email, password, name } }),
    login: (email, password) =>
        fetchApi('/auth/login', { method: 'POST', body: { email, password } }),
    forgotPassword: (email) =>
        fetchApi('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (password, token) => fetchApi('/auth/reset-password', { method: 'POST', body: { password }, headers: { Authorization: 'Bearer ' + token }, skipRefresh: true }),
    changeEmail: (new_email, current_password) => fetchApi('/api/v1/account/email/change', { method: 'POST', body: { new_email, current_password } }),
    getMe: () => fetchApi('/auth/me'),
    logout: () => fetchApi('/auth/logout', { method: 'POST' }),

    // User Profile
    getUser: (userId) => fetchApi(`/api/v1/account/profile`),
    updateUser: (userId, update) =>
        fetchApi(`/api/v1/account/profile`, { method: 'PATCH', body: update }),
    deleteAccount: (confirm = 'DELETE') =>
        fetchApi('/api/v1/account/delete', { method: 'POST', body: { confirm } }),
    requestDataExport: () =>
        fetchApi('/api/v1/account/export', { method: 'POST' }),

    getUserSettings: () => fetchApi('/api/v1/settings'),
    updateUserSettings: (settings) => fetchApi('/api/v1/settings', { method: 'PATCH', body: settings }),
    getLibraryContent: () => fetchApi('/library/content'),

    // Daily Logs
    logMood: (userId, mood_score, sleep_hours, notes) =>
        fetchApi('/companion/log', {
            method: 'POST',
            body: { user_id: userId, mood_score, sleep_hours, notes },
        }),
    getLogs: (userId, limit = 14) =>
        fetchApi(`/companion/${userId}/logs?limit=${limit}`),

    // Sleep Logs
    logSleep: (userId, bedTime, wakeTime, hours, quality, notes) =>
        fetchApi('/companion/sleep', {
            method: 'POST',
            body: { user_id: userId, bedTime, wakeTime, hours, quality, notes },
        }),
    getSleepLogs: (userId, limit = 30) =>
        fetchApi(`/companion/${userId}/sleep?limit=${limit}`),

    // Dashboard Stats & Reflections
    getStats: (userId) =>
        fetchApi(`/companion/${userId}/stats`),
    saveReflection: (userId, text, prompt = '') =>
        fetchApi('/companion/reflection', {
            method: 'POST',
            body: { user_id: userId, text, prompt },
        }),

    // Assessments
    listQuestionnaires: async () => {
        const locale = await AsyncStorage.getItem('aura_locale') || 'pt';
        return fetchApi(`/questionnaires?lang=${locale}`);
    },
    getQuestionnaire: async (qId) => {
        const locale = await AsyncStorage.getItem('aura_locale') || 'pt';
        return fetchApi(`/questionnaires/${qId}?lang=${locale}`);
    },
    submitAssessment: (userId, questionnaireId, answers, language = 'pt') =>
        fetchApi('/assessments/submit', {
            method: 'POST',
            body: { user_id: userId, questionnaire_id: questionnaireId, answers, language },
        }),
    getHistory: (userId) => fetchApi(`/assessments/${userId}/history`),

    // Companion Chat
    chat: (userId, message, conversationId = null, language = 'pt') =>
        fetchApi('/companion/chat', {
            method: 'POST',
            body: { user_id: userId, message, conversation_id: conversationId, language },
        }),
    getConversations: (userId, limit = 50) =>
        fetchApi(`/companion/${userId}/conversations?limit=${limit}`),
    getConversationMessages: (userId, conversationId) =>
        fetchApi(`/companion/${userId}/conversations/${conversationId}`),
    deleteConversation: (userId, conversationId) =>
        fetchApi(`/companion/${userId}/conversations/${conversationId}`, { method: 'DELETE' }),

};
