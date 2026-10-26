const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? (
    window.location.port === '3000'
        ? `${window.location.protocol}//${window.location.hostname}:8000`
        : window.location.origin
) : 'http://localhost:8000');

const SESSION_KEYS = ['aura_token', 'aura_refresh_token', 'aura_user'];
let refreshPromise;
const activeStorage = () => localStorage.getItem('aura_token') ? localStorage : sessionStorage;
export function saveSession(data, remember = false) {
    const storage = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    SESSION_KEYS.forEach(key => other.removeItem(key));
    storage.setItem('aura_token', data.access_token);
    if (data.refresh_token) storage.setItem('aura_refresh_token', data.refresh_token);
    storage.setItem('aura_user', JSON.stringify(data.user));
    window.dispatchEvent(new Event('aura:session'));
}
export function clearSession() {
    localStorage.removeItem('aura_sleep_logs_array');
    localStorage.removeItem('aura_web_reports');
    SESSION_KEYS.forEach(key => { localStorage.removeItem(key); sessionStorage.removeItem(key); });
    window.dispatchEvent(new Event('aura:session'));
}
async function renewSession() {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const storage = activeStorage();
            const refresh_token = storage.getItem('aura_refresh_token');
            if (!refresh_token) { clearSession(); return false; }
            const result = await fetchApi('/auth/refresh', { method: 'POST', body: { refresh_token }, skipRefresh: true });
            if (result.data?.access_token) {
                // Ignore a late refresh if the user signed out while it was in flight.
                if (storage.getItem('aura_refresh_token') !== refresh_token) return false;
                storage.setItem('aura_token', result.data.access_token);
                storage.setItem('aura_refresh_token', result.data.refresh_token);
                window.dispatchEvent(new Event('aura:session'));
                return true;
            }
            if (result.status === 401) clearSession();
            return false;
        })().finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
}

async function fetchApi(endpoint, options = {}) {
    const { method = 'GET', body, headers = {}, skipRefresh = false, ...rest } = options;
    const token = typeof window !== 'undefined' ? activeStorage().getItem('aura_token') : null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
        const response = await fetch(API_URL + endpoint, {
            method, headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true',
                ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers },
            signal: controller.signal, ...rest, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
        const data = await response.json().catch(() => ({}));
        const canRefresh = !skipRefresh && (!endpoint.startsWith('/auth/') || endpoint === '/auth/me' || endpoint === '/auth/logout');
        if (response.status === 401 && token && canRefresh) {
            if (activeStorage().getItem('aura_token') !== token || await renewSession()) {
                return fetchApi(endpoint, { ...options, skipRefresh: true });
            }
            if (activeStorage().getItem('aura_token') === token) return { error: 'Unable to renew session. Please try again.', status: 503 };
        }
        if (!response.ok) return { error: data?.error?.message || data?.message || data?.detail || 'API Error', status: response.status };
        if (method !== 'GET' && !endpoint.startsWith('/auth/')) window.dispatchEvent(new Event('aura:data'));
        return { data, status: response.status };
    } catch (error) {
        return { error: error.name === 'AbortError' ? 'Request timed out' : 'Network error or server down', status: 503 };
    } finally { clearTimeout(timeout); }
}

export const api = {
    // Auth
    signup: (email, password, name) => fetchApi('/auth/signup', { method: 'POST', body: { email, password, name } }),
    login: (email, password) => fetchApi('/auth/login', { method: 'POST', body: { email, password } }),
    forgotPassword: (email) => fetchApi('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (password, token) => fetchApi('/auth/reset-password', { method: 'POST', body: { password }, headers: { Authorization: 'Bearer ' + token }, skipRefresh: true }),
    changeEmail: (new_email, current_password) => fetchApi('/api/v1/account/email/change', { method: 'POST', body: { new_email, current_password } }),
    getMe: () => fetchApi('/auth/me'),
    logout: () => fetchApi('/auth/logout', { method: 'POST' }),

    // User Profile
    getUser: (userId) => fetchApi(`/api/v1/account/profile`),
    updateUser: (userId, update) => fetchApi(`/api/v1/account/profile`, { method: 'PATCH', body: update }),
    deleteAccount: (confirm = 'DELETE') => fetchApi('/api/v1/account/delete', { method: 'POST', body: { confirm } }),
    requestDataExport: () => fetchApi('/api/v1/account/export', { method: 'POST' }),

    // Settings
    getUserSettings: () => fetchApi('/api/v1/settings'),
    updateUserSettings: (settings) => fetchApi('/api/v1/settings', { method: 'PATCH', body: settings }),

    // Daily Logs
    logMood: (userId, mood_score, sleep_hours, notes) => fetchApi('/companion/log', { method: 'POST', body: { user_id: userId, mood_score, sleep_hours, notes } }),
    getLogs: (userId, limit = 14) => fetchApi(`/companion/${userId}/logs?limit=${limit}`),

    // Sleep Logs
    logSleep: (userId, bedTime, wakeTime, hours, quality, notes) => fetchApi('/companion/sleep', { method: 'POST', body: { user_id: userId, bedTime, wakeTime, hours, quality, notes } }),
    getSleepLogs: (userId, limit = 30) => fetchApi(`/companion/${userId}/sleep?limit=${limit}`),

    // Dashboard Stats & Reflections
    getStats: (userId) => fetchApi(`/companion/${userId}/stats`),
    saveReflection: (userId, text, prompt = '') => fetchApi('/companion/reflection', { method: 'POST', body: { user_id: userId, text, prompt } }),

    // Assessments
    listQuestionnaires: () => {
        const lang = typeof window !== 'undefined' ? localStorage.getItem('aura_locale') || 'pt' : 'pt';
        return fetchApi(`/questionnaires?lang=${lang}`);
    },
    getQuestionnaire: (qId) => {
        const lang = typeof window !== 'undefined' ? localStorage.getItem('aura_locale') || 'pt' : 'pt';
        return fetchApi(`/questionnaires/${qId}?lang=${lang}`);
    },
    submitAssessment: (userId, questionnaireId, answers) => fetchApi('/assessments/submit', { method: 'POST', body: { user_id: userId, questionnaire_id: questionnaireId, answers } }),
    getHistory: (userId) => fetchApi(`/assessments/${userId}/history`),

    // Library
    getLibraryContent: () => fetchApi('/library/content'),

    // Companion Chat
    chat: (userId, message, conversationId = null) => fetchApi('/companion/chat', { method: 'POST', body: { user_id: userId, message, conversation_id: conversationId } }),
    getConversations: (userId, limit = 50) => fetchApi(`/companion/${userId}/conversations?limit=${limit}`),
    getConversationMessages: (userId, conversationId) => fetchApi(`/companion/${userId}/conversations/${conversationId}`),
    deleteConversation: (userId, conversationId) => fetchApi(`/companion/${userId}/conversations/${conversationId}`, { method: 'DELETE' }),

};
