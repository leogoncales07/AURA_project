'use client';
import { Send, Sparkles, Plus, MessageSquare, Trash2 } from 'lucide-react';
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
    
    const [threads, setThreads] = useState([]);
    const [currentThreadId, setCurrentThreadId] = useState(null);
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
            loadThreads(user.id);
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

    const loadThreads = async (uid) => {
        try {
            const { data } = await api.getConversations(uid, 50);
            if (data && data.conversations) {
                setThreads(data.conversations);
                // Auto-load the first thread if none is selected
                if (data.conversations.length > 0 && !currentThreadId) {
                    loadThreadMessages(uid, data.conversations[0].id);
                }
            }
        } catch (err) {
            console.error("Failed to load threads", err);
        }
    };

    const loadThreadMessages = async (uid, threadId) => {
        try {
            setCurrentThreadId(threadId);
            const { data } = await api.getConversationMessages(uid, threadId);
            if (data && data.messages) {
                const mapped = data.messages.map((c, i) => ({
                    id: i,
                    role: c.role,
                    content: c.message,
                    timestamp: c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
                }));
                setMessages(mapped);
            }
        } catch (err) {
            console.error("Failed to load thread messages", err);
        }
    };

    const handleNewChat = () => {
        setCurrentThreadId(null);
        setMessages([]);
    };

    const handleDeleteThread = async (e, threadId) => {
        e.stopPropagation();
        if (!confirm(t('common.deleteConfirm') || 'Are you sure you want to delete this conversation?')) return;
        
        try {
            const { data } = await api.deleteConversation(userId, threadId);
            if (data && data.success) {
                setThreads(prev => prev.filter(t => t.id !== threadId));
                if (currentThreadId === threadId) {
                    handleNewChat();
                }
            }
        } catch (err) {
            console.error("Failed to delete thread", err);
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
            const { data, error } = await api.chat(userId, text, currentThreadId);

            if (data && data.response) {
                // If this is a brand new thread, refresh the list and lock its ID
                if (!currentThreadId && data.conversation_id) {
                    setCurrentThreadId(data.conversation_id);
                    loadThreads(userId); // to update the sidebar with the generated title
                }

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
            <div className={`${styles.chatLayout} fade-up-stagger`}>
                
                {/* Conversations Sidebar */}
                <aside className={styles.sidebar}>
                    <button className={styles.newChatBtn} onClick={handleNewChat}>
                        <Plus size={18} />
                        New Chat
                    </button>
                    
                    <div className={styles.historyList}>
                        {threads.map((thread) => (
                            <div 
                                key={thread.id} 
                                className={`${styles.historyItem} ${currentThreadId === thread.id ? styles.historyItemActive : ''}`}
                                onClick={() => loadThreadMessages(userId, thread.id)}
                            >
                                <span className={styles.historyItemText}>
                                    <MessageSquare size={14} style={{ display: 'inline', marginRight: '8px', opacity: 0.8 }} />
                                    {thread.title}
                                </span>
                                <button className={styles.deleteThreadBtn} onClick={(e) => handleDeleteThread(e, thread.id)} title="Delete Chat">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Chat Area */}
                <div className={styles.chatContainer}>
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
                                <h3 style={{ fontFamily: 'var(--aura-font-serif)', fontSize: 'var(--text-xl)', color: 'var(--fg-foreground)', fontWeight: 400 }}>{t('chat.emptyState')}</h3>
                            </div>
                        )}

                        <div className={styles.messageList}>
                            {messages.map((msg) => (
                                <div key={msg.id} className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageRowRight : styles.messageRowLeft}`}>
                                    <div className={styles.messageContent}>
                                        <p>{msg.content}</p>
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
            </div>
        </AppShell>
    );
}
