import AsyncStorage from '@react-native-async-storage/async-storage';

// ── PUBLIC TUNNEL URL (Recommended for real devices) ──
const API_URL = 'https://breezy-news-kneel.loca.lt';
// const API_URL = 'http://10.20.40.45:8000'; // Local IP fallback
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
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (!response.ok) {
                console.warn(`[API Error] ${response.status}:`, data.detail || data);
                return { error: data.detail || 'API Error', status: response.status };
            }
            return { data, status: response.status };
        } else {
            const text = await response.text();
            console.warn(`[API Error] Non-JSON response (status ${response.status}):`, text.substring(0, 100));
            return { error: 'Invalid server response (not JSON)', status: response.status };
        }
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
