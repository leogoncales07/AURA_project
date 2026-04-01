import { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
    Modal, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n';
import { COLORS, useTheme, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function ChatScreen() {
    const { t, locale } = useI18n();
    const { theme, colors } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    
    // Core state
    const [userId, setUserId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    
    // Multi-thread state
    const [threads, setThreads] = useState([]);
    const [currentThreadId, setCurrentThreadId] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    
    const listRef = useRef(null);

    useEffect(() => {
        AsyncStorage.getItem('aura_user').then((stored) => {
            if (stored) {
                const user = JSON.parse(stored);
                setUserId(user.id);
                loadThreads(user.id);
            }
        });
    }, []);

    const loadThreads = async (uid) => {
        const { data } = await api.getConversations(uid, 50);
        if (data?.conversations) {
            setThreads(data.conversations);
            // Auto load first thread if multiple exist
            if (data.conversations.length > 0 && !currentThreadId) {
                loadThreadMessages(uid, data.conversations[0].id);
            }
        }
    };

    const loadThreadMessages = async (uid, threadId) => {
        setCurrentThreadId(threadId);
        setShowHistory(false);
        setMessages([]); // Clear visually while loading
        const { data } = await api.getConversationMessages(uid, threadId);
        if (data?.messages) {
            const mapped = data.messages.map((c, i) => ({
                id: String(i),
                role: c.role,
                content: c.message,
            }));
            setMessages(mapped);
        }
    };

    const handleNewChat = () => {
        setCurrentThreadId(null);
        setMessages([]);
        setShowHistory(false);
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending || !userId) return;

        const userMsg = { id: String(Date.now()), role: 'user', content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setSending(true);

        const { data, error } = await api.chat(userId, text, currentThreadId, locale);
        
        if (data?.response) {
            // New thread logic
            if (!currentThreadId && data.conversation_id) {
                setCurrentThreadId(data.conversation_id);
                loadThreads(userId);
            }
        }

        const botMsg = {
            id: String(Date.now() + 1),
            role: 'assistant',
            content: data?.response || error || t('common.error'),
        };
        setMessages((prev) => [...prev, botMsg]);
        setSending(false);
    };

    const renderMessage = ({ item }) => (
        <View style={[styles.msgRow, item.role === 'user' ? styles.msgRowRight : styles.msgRowLeft]}>
            {item.role === 'assistant' && (
                <View style={styles.botAvatar}>
                    <Text style={styles.botAvatarText}>A</Text>
                </View>
            )}
            
            {item.role === 'user' ? (
                // User Bubble - Gradient
                <View style={[styles.bubbleWrap, styles.bubbleWrapRight]}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                        style={[styles.bubble, styles.bubbleUser]}
                    >
                        <Text style={styles.bubbleTextUser}>{item.content}</Text>
                    </LinearGradient>
                </View>
            ) : (
                // Bot Bubble - Glass
                <View style={[styles.bubbleWrap, styles.bubbleWrapLeft]}>
                    <BlurView intensity={40} tint="dark" style={[styles.bubble, styles.bubbleBot]}>
                        <Text style={styles.bubbleTextBot}>{item.content}</Text>
                    </BlurView>
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.root, { backgroundColor: colors.bg }]}>
            {/* Ambient Background Grid / Blur base */}
            <LinearGradient
                colors={['rgba(6,182,212,0.1)', 'transparent']}
                style={[styles.ambientBlob, { top: -100, left: -50 }]}
                start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider, paddingTop: insets.top + Spacing.sm }]}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.botAvatar, { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}>
                            <Text style={[styles.botAvatarText, { color: colors.primary }]}>A</Text>
                        </View>
                        <View>
                            <Text style={[styles.botName, { color: colors.textPrimary }]}>{t('chat.botName')}</Text>
                            <Text style={[styles.botStatus, { color: colors.accentMint }]}>● {t('chat.botStatus')}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.historyBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]} onPress={() => setShowHistory(true)}>
                        <Text style={[styles.historyBtnIcon, { color: colors.textPrimary }]}>☰</Text>
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <FlatList
                    ref={listRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>✨</Text>
                            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('chat.botName')}</Text>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('chat.emptyState')}</Text>
                        </View>
                    }
                    ListFooterComponent={
                        sending ? (
                            <View style={styles.msgRowLeft}>
                                <View style={[styles.botAvatar, { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}>
                                    <Text style={[styles.botAvatarText, { color: colors.primary }]}>A</Text>
                                </View>
                                <BlurView intensity={40} tint="dark" style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
                                    <Text style={styles.typingDots}>• • •</Text>
                                </BlurView>
                            </View>
                        ) : null
                    }
                />

                {/* Input Area */}
                <View style={[styles.inputArea, { backgroundColor: colors.surface, borderTopColor: colors.divider, paddingBottom: insets.bottom + Spacing.sm }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border }]}
                        placeholder={t('chat.placeholder')}
                        placeholderTextColor={COLORS.textTertiary}
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                        editable={!sending}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtnWrap, (!input.trim() || sending) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!input.trim() || sending}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.secondary]}
                            style={styles.sendBtn}
                            start={{x:0, y:0}} end={{x:1, y:1}}
                        >
                            {sending ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.sendBtnText}>↑</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Sliding History Modal */}
            <Modal
                visible={showHistory}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowHistory(false)}
            >
                <BlurView intensity={90} tint="dark" style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chat History</Text>
                            <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.newChatCard} onPress={handleNewChat}>
                            <LinearGradient colors={['rgba(16,185,129,0.2)', 'transparent']} style={StyleSheet.absoluteFillObject} />
                            <Text style={styles.newChatText}>+ New Conversation</Text>
                        </TouchableOpacity>

                        <FlatList
                            data={threads}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[styles.threadCard, currentThreadId === item.id && styles.threadCardActive]}
                                    onPress={() => loadThreadMessages(userId, item.id)}
                                >
                                    <Text style={[styles.threadTitle, currentThreadId === item.id && styles.threadTitleActive]} numberOfLines={1}>
                                        💬 {item.title || 'Conversation'}
                                    </Text>
                                    <Text style={styles.threadDate}>{new Date(item.updated_at).toLocaleDateString()}</Text>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.threadList}
                        />
                    </View>
                </BlurView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    keyboardView: { flex: 1 },

    ambientBlob: {
        position: 'absolute',
        width: width * 1.5,
        height: height * 0.5,
        borderRadius: 9999,
        transform: [{ scale: 1.5 }],
    },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    botName: { ...Fonts.serif, fontWeight: '500', fontSize: 18, letterSpacing: 0.5 },
    botStatus: { ...Fonts.semibold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },

    botAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: COLORS.primaryDim,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: COLORS.primary,
    },
    botAvatarText: { ...Fonts.bold, color: COLORS.primary, fontSize: 18 },

    historyBtn: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
    },
    historyBtnIcon: { fontSize: 20 },

    messageList: { padding: Spacing.md, paddingBottom: Spacing.xl },

    emptyState: { alignItems: 'center', marginTop: height * 0.15 },
    emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
    emptyTitle: { ...Fonts.serif, fontSize: 28, marginBottom: Spacing.xs },
    emptyText: { ...Fonts.regular, fontSize: 15, textAlign: 'center' },

    msgRow: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'flex-end', gap: Spacing.sm },
    msgRowLeft: { justifyContent: 'flex-start' },
    msgRowRight: { justifyContent: 'flex-end' },

    bubbleWrap: {
        maxWidth: '80%',
        borderRadius: Radius.xl,
        overflow: 'hidden',
    },
    bubbleWrapLeft: { borderBottomLeftRadius: 4 },
    bubbleWrapRight: { borderBottomRightRadius: 4 },

    bubble: { padding: Spacing.md },
    bubbleUser: {
        // LinearGradient applied automatically over this
    },
    bubbleBot: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1, borderColor: COLORS.border,
    },
    
    bubbleTextUser: { ...Fonts.regular, color: '#fff', fontSize: 16, lineHeight: 22 },
    bubbleTextBot: { ...Fonts.regular, color: COLORS.textPrimary, fontSize: 16, lineHeight: 24 },

    typingBubble: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
    typingDots: { ...Fonts.heavy, color: COLORS.textSecondary, letterSpacing: 4, fontSize: 18 },

    inputArea: {
        flexDirection: 'row', alignItems: 'flex-end',
        padding: Spacing.md,
        borderTopWidth: 1,
        gap: Spacing.sm,
    },
    input: {
        flex: 1,
        borderRadius: Radius.xl,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
        fontSize: 16,
        maxHeight: 120,
        ...Fonts.regular,
        borderWidth: 1,
    },
    sendBtnWrap: {
        width: 48, height: 48, borderRadius: 24, overflow: 'hidden'
    },
    sendBtn: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.5 },
    sendBtnText: { ...Fonts.heavy, color: '#fff', fontSize: 24, marginBottom: 4 },

    /* Modal Styles */
    modalOverlay: { flex: 1 },
    modalContent: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.6)', padding: Spacing.lg },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
    modalTitle: { ...Fonts.serif, fontSize: 28, color: COLORS.textPrimary },
    closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
    closeBtnText: { color: COLORS.textPrimary, fontSize: 16, ...Fonts.bold },

    newChatCard: {
        padding: Spacing.lg, borderRadius: Radius.lg,
        borderWidth: 1, borderColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.lg, overflow: 'hidden'
    },
    newChatText: { ...Fonts.semibold, color: COLORS.primary, fontSize: 16 },

    threadList: { paddingBottom: 100 },
    threadCard: {
        padding: Spacing.md, borderRadius: Radius.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: Spacing.sm, borderWidth: 1, borderColor: 'transparent'
    },
    threadCardActive: {
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderColor: 'rgba(16,185,129,0.3)',
    },
    threadTitle: { ...Fonts.medium, color: COLORS.textSecondary, fontSize: 16, marginBottom: 4 },
    threadTitleActive: { color: COLORS.primary, ...Fonts.bold },
    threadDate: { ...Fonts.regular, color: COLORS.textTertiary, fontSize: 12 },
});
