const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? (
    window.location.port === '3000'
        ? `${window.location.protocol}//${window.location.hostname}:8000`
        : window.location.origin
) : 'http://localhost:8000');
const OWNER_SECRET = process.env.NEXT_PUBLIC_DEV_KEY;

/**
 * Enhanced Fetch Wrapper with Owner Auth & Token Support
 */
async function fetchApi(endpoint, options = {}) {
    const { method = 'GET', body, headers = {}, ...rest } = options;

    const defaultHeaders = {
        'Content-Type': 'application/json',
        'X-Owner-Secret': OWNER_SECRET,
        'Bypass-Tunnel-Reminder': 'true',
    };

    // Add Auth Token if available
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('aura_token');
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for dev stability

    const config = {
        method,
        headers: {
            ...defaultHeaders,
            ...headers,
        },
        signal: controller.signal,
        ...rest,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        clearTimeout(timeoutId);
        
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return { error: data?.detail || data?.message || 'API Error', status: response.status };
        }

        return { data, status: response.status };
    } catch (err) {
        clearTimeout(timeoutId);
        console.warn(`[API] Fetch failed for ${endpoint}:`, err.message);
        return { error: err.name === 'AbortError' ? 'Request timed out' : 'Network mismatch or server down', status: 500 };
    }
}

export const api = {
    // Auth
    signup: (email, password, name) => fetchApi('/auth/signup', { method: 'POST', body: { email, password, name } }),
    login: (email, password) => fetchApi('/auth/login', { method: 'POST', body: { email, password } }),
    getMe: () => fetchApi('/auth/me'),

    // User Profile
    getUser: (userId) => fetchApi(`/users/${userId}`),
    updateUser: (userId, update) => fetchApi(`/users/${userId}`, { method: 'PATCH', body: update }),

    // Daily Logs
    logMood: (userId, mood_score, sleep_hours, notes) => fetchApi('/companion/log', { method: 'POST', body: { user_id: userId, mood_score, sleep_hours, notes } }),
    getLogs: (userId, limit = 14) => fetchApi(`/companion/${userId}/logs?limit=${limit}`),

    // Assessments
    listQuestionnaires: () => fetchApi('/questionnaires'),
    getQuestionnaire: (qId) => fetchApi(`/questionnaires/${qId}`),
    submitAssessment: (userId, questionnaireId, answers) => fetchApi('/assessments/submit', { method: 'POST', body: { user_id: userId, questionnaire_id: questionnaireId, answers } }),
    getHistory: (userId) => fetchApi(`/assessments/${userId}/history`),

    // Library
    getLibraryContent: () => fetchApi('/library/content'),

    // Companion Chat
    chat: (userId, message, conversationId = null) => fetchApi('/companion/chat', { method: 'POST', body: { user_id: userId, message, conversation_id: conversationId } }),
    getConversations: (userId, limit = 50) => fetchApi(`/companion/${userId}/conversations?limit=${limit}`),
    getConversationMessages: (userId, conversationId) => fetchApi(`/companion/${userId}/conversations/${conversationId}`),
    deleteConversation: (userId, conversationId) => fetchApi(`/companion/${userId}/conversations/${conversationId}`, { method: 'DELETE' }),

    // Reports
    generateReport: (userId, context = "") => fetchApi('/reports/generate', { method: 'POST', body: { user_id: userId, context } }),
};
