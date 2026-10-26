import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ── API URL — always derived from Expo's Metro host (same machine, port 8000) ──
// This avoids hardcoded IPs that break whenever the router reassigns a new address.
const _hostUri =
    Constants?.expoConfig?.hostUri ||       // Expo SDK 46+
    Constants?.manifest2?.extra?.expoGo?.debuggerHost || // Expo Go
    Constants?.manifest?.debuggerHost ||    // Legacy
    '';

let API_URL;
if (_hostUri && !_hostUri.includes('exp.direct') && !_hostUri.includes('tunnel')) {
    // Extract just the IP (strip the Metro port e.g. "192.168.68.51:8081" → "192.168.68.51")
    API_URL = `http://${_hostUri.split(':')[0]}:8000`;
} else {
    // Fallback: read from .env or last-known IP
    API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.68.51:8000';
}

console.log('[API] Base URL:', API_URL);
const OWNER_SECRET = 'rRA5utI-P45PjhV3HP1gYLmDCSbFL29l-uqunqqtArV8mohJk9Ov1R2QSGKYkZXN';

async function fetchApi(endpoint, options = {}) {
    const { method = 'GET', body, headers = {}, ...rest } = options;

    const defaultHeaders = {
        'Content-Type': 'application/json',
        'X-Owner-Secret': OWNER_SECRET,
        'Bypass-Tunnel-Reminder': 'true',
    };

    const token = await AsyncStorage.getItem('aura_token');
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers: { ...defaultHeaders, ...headers },
        ...rest,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        console.log(`[API] ${method} ${API_URL}${endpoint}`, body ? '(with body)' : '');
        const response = await fetch(`${API_URL}${endpoint}`, config);

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.warn(`[API] Non-JSON response (${response.status}):`, text.substring(0, 100));
            return { error: 'Invalid server response', status: response.status };
        }

        if (!response.ok) {
            // Handle both Node backend {error:{message}} and Python {detail} formats
            const errMsg = data?.message || data?.error?.message || data?.detail || 'API Error';
            console.warn(`[API Error] ${response.status}:`, errMsg);
            return { error: errMsg, status: response.status };
        }

        return { data, status: response.status };
    } catch (err) {
        console.error('[API Network Error]:', err);
        return { error: 'Network error or server down', status: 500 };
    }
}

export const api = {
    // Auth
    signup: (email, password, name) =>
        fetchApi('/auth/signup', { method: 'POST', body: { email, password, name } }),
    login: (email, password) =>
        fetchApi('/auth/login', { method: 'POST', body: { email, password } }),
    forgotPassword: (email) =>
        fetchApi('/auth/forgot-password', { method: 'POST', body: { email } }),
    getMe: () => fetchApi('/auth/me'),

    // User Profile
    getUser: (userId) => fetchApi(`/api/v1/account/profile`),
    updateUser: (userId, update) =>
        fetchApi(`/api/v1/account/profile`, { method: 'PATCH', body: update }),
    deleteAccount: (confirm = 'DELETE') =>
        fetchApi('/api/v1/account/delete', { method: 'POST', body: { confirm } }),
    requestDataExport: () =>
        fetchApi('/api/v1/account/export', { method: 'POST' }),

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
    submitAssessment: (userId, questionnaireId, answers) =>
        fetchApi('/assessments/submit', {
            method: 'POST',
            body: { user_id: userId, questionnaire_id: questionnaireId, answers },
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

    // Reports
    generateReport: (userId, context = '') =>
        fetchApi('/reports/generate', {
            method: 'POST',
            body: { user_id: userId, context },
        }),
};
