import styles from './page.module.css';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { Sparkles } from 'lucide-react';

export default function ChatPage() {
    return (
        <div className={styles.appContainer}>
            <header className={styles.chatHeader}>
                <div style={{ position: 'absolute', right: '16px', top: '16px' }}>
                    <ThemeToggle />
                </div>
                <div className={styles.chatHeaderContent}>
                    <div className={styles.botAvatar}>
                        <Sparkles size={24} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                        <h2 className={styles.botName}>AURA AI</h2>
                        <span className={styles.onlineStatus}>Companheira Pessoal</span>
                    </div>
                </div>
            </header>

            <main className={styles.chatArea}>
                <div className={styles.messageDate}>Hoje 10:00</div>

                <div className={styles.messageList}>
                    <div className={styles.messageRow}>
                        <div className={styles.messageBot}>
                            <p>Olá! Como tem sido a sua manhã? Estou aqui se precisar de organizar as ideias.</p>
                        </div>
                    </div>

                    <div className={styles.messageRowRight}>
                        <div className={styles.messageUser}>
                            <p>Sinto-me um pouco bloqueado com tantas tarefas hoje. Não sei por onde começar.</p>
                        </div>
                        <span className={styles.messageStatus}>Lido</span>
                    </div>

                    <div className={styles.messageRow}>
                        <div className={styles.messageBot}>
                            <p>É perfeitamente normal sentir sobrecarga quando há muito para fazer. Costuma ajudar pegar num papel e escolher apenas <strong>uma</strong> tarefa prioritária para os próximos 30 minutos. Quer que o ajude a dividi-las?</p>
                        </div>
                    </div>
                </div>
            </main>

            <div className={styles.inputArea}>
                <div className={styles.inputWrapper}>
                    <button className={styles.attachBtn}>+</button>
                    <input type="text" placeholder="Escreva uma mensagem..." className={styles.input} />
                    <button className={styles.sendBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
