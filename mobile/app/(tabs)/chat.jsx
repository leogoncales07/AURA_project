import { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n';
import { COLORS, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
    const { t, locale } = useI18n();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [userId, setUserId] = useState(null);
    const listRef = useRef(null);

    useEffect(() => {
        AsyncStorage.getItem('aura_user').then((stored) => {
            if (stored) {
                const user = JSON.parse(stored);
                setUserId(user.id);
                loadHistory(user.id);
            }
        });
    }, []);

    const loadHistory = async (uid) => {
        const { data } = await api.getConversations(uid, 20);
        if (data?.conversations) {
            const mapped = data.conversations.reverse().map((c, i) => ({
                id: String(i),
                role: c.role,
                content: c.message,
            }));
            setMessages(mapped);
        }
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending || !userId) return;

        const userMsg = { id: String(Date.now()), role: 'user', content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setSending(true);

        const { data, error } = await api.chat(userId, text, locale);
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
            <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]}>
                    {item.content}
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <View style={styles.botAvatar}>
                    <Text style={styles.botAvatarText}>A</Text>
                </View>
                <View>
                    <Text style={styles.botName}>{t('chat.botName')}</Text>
                    <Text style={styles.botStatus}>● {t('chat.botStatus')}</Text>
                </View>
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
                        <Text style={styles.emptyEmoji}>💬</Text>
                        <Text style={styles.emptyText}>{t('chat.emptyState')}</Text>
                    </View>
                }
                ListFooterComponent={
                    sending ? (
                        <View style={styles.msgRowLeft}>
                            <View style={styles.botAvatar}>
                                <Text style={styles.botAvatarText}>A</Text>
                            </View>
                            <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
                                <Text style={styles.typingDots}>• • •</Text>
                            </View>
                        </View>
                    ) : null
                }
            />

            {/* Input */}
            <View style={[styles.inputArea, { paddingBottom: insets.bottom + Spacing.sm }]}>
                <TextInput
                    style={styles.input}
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
                    style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!input.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.sendBtnText}>↑</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        backgroundColor: COLORS.surface,
        padding: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    botName: { ...Fonts.bold, color: COLORS.textPrimary, fontSize: 16 },
    botStatus: { ...Fonts.regular, color: COLORS.accentMint, fontSize: 12 },

    botAvatar: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    botAvatarText: { ...Fonts.bold, color: '#fff', fontSize: 18 },

    messageList: { padding: Spacing.md, paddingBottom: Spacing.sm },

    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyEmoji: { fontSize: 56, marginBottom: Spacing.md },
    emptyText: { ...Fonts.regular, color: COLORS.textSecondary, fontSize: 15, textAlign: 'center' },

    msgRow: { flexDirection: 'row', marginBottom: Spacing.sm, alignItems: 'flex-end', gap: Spacing.xs },
    msgRowLeft: { justifyContent: 'flex-start' },
    msgRowRight: { justifyContent: 'flex-end' },

    bubble: {
        maxWidth: '78%', padding: Spacing.sm + 4,
        borderRadius: Radius.lg, flexShrink: 1,
    },
    bubbleUser: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    bubbleBot: {
        backgroundColor: COLORS.surface,
        borderWidth: 1, borderColor: COLORS.border,
        borderBottomLeftRadius: 4,
    },
    bubbleText: { ...Fonts.regular, color: COLORS.textPrimary, fontSize: 15, lineHeight: 22 },
    bubbleTextUser: { color: '#fff' },

    typingBubble: { paddingVertical: Spacing.sm },
    typingDots: { ...Fonts.bold, color: COLORS.textSecondary, letterSpacing: 4, fontSize: 16 },

    inputArea: {
        flexDirection: 'row', alignItems: 'flex-end',
        padding: Spacing.md,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1, borderTopColor: COLORS.border,
        gap: Spacing.sm,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.surfaceAlt,
        color: COLORS.textPrimary,
        borderRadius: Radius.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: 15,
        maxHeight: 120,
        ...Fonts.regular,
        borderWidth: 1, borderColor: COLORS.border,
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
    sendBtnText: { ...Fonts.bold, color: '#fff', fontSize: 22, marginBottom: 2 },
});
