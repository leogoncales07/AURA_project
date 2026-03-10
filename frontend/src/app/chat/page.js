'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import AuraLogo from '@/components/AuraLogo';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';

export default function ChatPage() {
    const { t } = useI18n();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [userId, setUserId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const stored = localStorage.getItem('aura_user');
        if (stored) {
            const user = JSON.parse(stored);
            setUserId(user.id);
            loadHistory(user.id);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadHistory = async (uid) => {
        const { data } = await api.getConversations(uid, 20);
        if (data && data.conversations) {
            // conversations come newest-first from backend, reverse to chronological
            const mapped = data.conversations.reverse().map((c, i) => ({
                id: i,
                role: c.role,
                content: c.message,
            }));
            setMessages(mapped);
        }
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending || !userId) return;

        const userMsg = { id: Date.now(), role: 'user', content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setSending(true);

        const { data, error } = await api.chat(userId, text);

        if (data && data.response) {
            setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, role: 'assistant', content: data.response },
            ]);
        } else {
            setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, role: 'assistant', content: error || 'Something went wrong.' },
            ]);
        }

        setSending(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.appContainer}>
            <header className={styles.chatHeader}>
                <div style={{ position: 'absolute', right: '16px', top: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
                <div className={styles.chatHeaderContent}>
                    <div className={styles.botAvatar}>
                        <AuraLogo size={40} />
                    </div>
                    <div>
                        <h2 className={styles.botName}>{t('chat.botName')}</h2>
                        <span className={styles.onlineStatus}>{t('chat.botStatus')}</span>
                    </div>
                </div>
            </header>

            <main className={styles.chatArea}>
                {messages.length === 0 && (
                    <div className={styles.emptyState}>
                        <AuraLogo size={96} style={{ marginBottom: '20px', opacity: 0.8 }} />
                        <p>{t('chat.emptyState')}</p>
                    </div>
                )}

                <div className={styles.messageList}>
                    {messages.map((msg) => (
                        msg.role === 'user' ? (
                            <div key={msg.id} className={styles.messageRowRight}>
                                <div className={styles.messageUser}>
                                    <p>{msg.content}</p>
                                </div>
                            </div>
                        ) : (
                            <div key={msg.id} className={styles.messageRow}>
                                <div className={styles.messageBot}>
                                    <p>{msg.content}</p>
                                </div>
                            </div>
                        )
                    ))}

                    {sending && (
                        <div className={styles.messageRow}>
                            <div className={styles.messageBot}>
                                <div className={styles.typingIndicator}>
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </main>

            <div className={styles.inputArea}>
                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        placeholder={t('chat.placeholder')}
                        className={styles.input}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sending}
                    />
                    <button
                        className={styles.sendBtn}
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                        style={{ opacity: sending || !input.trim() ? 0.5 : 1 }}
                    >
                        {sending ? (
                            <Loader2 size={16} className={styles.spin} />
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
