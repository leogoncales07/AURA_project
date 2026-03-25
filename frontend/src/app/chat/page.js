
'use client';
import { Send, Sparkles } from 'lucide-react';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import AppShell from '@/components/AppShell';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';

const QUICK_REPLIES = [
  "how can i improve my sleep?",
  "i'm feeling overwhelmed",
  "daily breathwork session",
  "check my progress"
];

export default function ChatPage() {
    const { t } = useI18n();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [userId, setUserId] = useState(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        const stored = localStorage.getItem('aura_user');
        if (stored) {
            const user = JSON.parse(stored);
            setUserId(user.id);
            loadHistory(user.id);
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [input]);

    const loadHistory = async (uid) => {
        try {
            const { data } = await api.getConversations(uid, 40);
            if (data && data.conversations) {
                const mapped = data.conversations.reverse().map((c, i) => ({
                    id: i,
                    role: c.role,
                    content: c.message,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }));
                setMessages(mapped);
            }
        } catch (err) {
            console.error("Failed to load history", err);
        }
    };

    const handleSend = async (customText) => {
        const text = (typeof customText === 'string' ? customText : input).trim();
        if (!text || sending || !userId) return;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userMsg = { id: Date.now(), role: 'user', content: text, timestamp };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setSending(true);

        try {
            const { data, error } = await api.chat(userId, text);

            if (data && data.response) {
                setMessages((prev) => [
                    ...prev,
                    { 
                      id: Date.now() + 1, 
                      role: 'assistant', 
                      content: data.response,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { 
                      id: Date.now() + 1, 
                      role: 'assistant', 
                      content: error || t('chat.errorFallback'),
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    },
                ]);
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { 
                  id: Date.now() + 1, 
                  role: 'assistant', 
                  content: t('chat.connectionError'),
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                },
            ]);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <AppShell title={t('nav.chat')}>
            <div className={`${styles.chatContainer} fade-up-stagger`}>
                <header className={styles.chatHeader}>
                  <div className={styles.avatar}>
                    <div className={styles.statusDot} />
                  </div>
                  <div className={styles.headerInfo}>
                    <h2>{t('chat.botName')}</h2>
                    <p>{t('chat.botStatus')}</p>
                  </div>
                </header>

                <main className={styles.chatArea}>
                    {messages.length === 0 && !sending && (
                        <div className={styles.emptyState}>
                            <div style={{ marginBottom: '16px', opacity: 0.6 }}>
                              <Sparkles size={40} color="var(--aura-aurora-1)" />
                            </div>
                            <p className="label-text">{t('chat.label')}</p>
                            <h3 style={{ fontFamily: 'var(--aura-font-serif)', fontSize: 'var(--text-xl)', color: 'white', fontWeight: 400 }}>{t('chat.emptyState')}</h3>
                        </div>
                    )}

                    <div className={styles.messageList}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageRowRight : styles.messageRowLeft}`}>
                                <div className={styles.messageContent}>
                                    <p>{msg.content.toLowerCase()}</p>
                                    <div className={styles.timestamp}>{msg.timestamp}</div>
                                </div>
                            </div>
                        ))}

                        {sending && (
                            <div className={`${styles.messageRow} ${styles.messageRowLeft}`}>
                                <div className={styles.typingIndicator}>
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </main>

                <div className={styles.inputArea}>
                    <div className={styles.quickReplies}>
                      {QUICK_REPLIES.map((reply, i) => (
                        <button key={i} className={styles.replyChip} onClick={() => handleSend(reply)}>
                          {reply}
                        </button>
                      ))}
                    </div>

                    <div className={styles.inputContainer}>
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            placeholder={t('chat.placeholder')}
                            className={styles.textarea}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={sending}
                        />
                        <button
                            className={styles.sendButton}
                            onClick={() => handleSend()}
                            disabled={sending || !input.trim()}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

