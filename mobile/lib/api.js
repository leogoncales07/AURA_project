import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Update this to your backend URL when running on a real device ──
// For local dev on the same machine, use your PC's local IP instead of localhost
// e.g. 'http://192.168.1.XX:8000'
const API_URL = 'http://10.20.40.45:8000';
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
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            return { error: data.detail || 'API Error', status: response.status };
        }

        return { data, status: response.status };
    } catch (err) {
        console.error('Fetch error:', err);
        return { error: 'Network error or server down', status: 500 };
    }
}

export const api = {
    // Auth
    signup: (email, password, name) =>
        fetchApi('/auth/signup', { method: 'POST', body: { email, password, name } }),
    login: (email, password) =>
        fetchApi('/auth/login', { method: 'POST', body: { email, password } }),
    getMe: () => fetchApi('/auth/me'),

    // User Profile
    getUser: (userId) => fetchApi(`/users/${userId}`),
    updateUser: (userId, update) =>
        fetchApi(`/users/${userId}`, { method: 'PATCH', body: update }),

    // Daily Logs
    logMood: (userId, mood_score, sleep_hours, notes) =>
        fetchApi('/companion/log', {
            method: 'POST',
            body: { user_id: userId, mood_score, sleep_hours, notes },
        }),
    getLogs: (userId, limit = 14) =>
        fetchApi(`/companion/${userId}/logs?limit=${limit}`),

    // Assessments
    listQuestionnaires: () => fetchApi('/questionnaires'),
    getQuestionnaire: (qId) => fetchApi(`/questionnaires/${qId}`),
    submitAssessment: (userId, questionnaireId, answers) =>
        fetchApi('/assessments/submit', {
            method: 'POST',
            body: { user_id: userId, questionnaire_id: questionnaireId, answers },
        }),
    getHistory: (userId) => fetchApi(`/assessments/${userId}/history`),

    // Companion Chat
    chat: (userId, message, language = 'pt') =>
        fetchApi('/companion/chat', {
            method: 'POST',
            body: { user_id: userId, message, language },
        }),
    getConversations: (userId, limit = 50) =>
        fetchApi(`/companion/${userId}/conversations?limit=${limit}`),

    // Reports
    generateReport: (userId, context = '') =>
        fetchApi('/reports/generate', {
            method: 'POST',
            body: { user_id: userId, context },
        }),
};
