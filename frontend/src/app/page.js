import Link from "next/link";
import styles from "./page.module.css";
import Button from "@/components/Button";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <main className={styles.main}>
      <header className={styles.topNav}>
        <div className={styles.logo}>AURA</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <ThemeToggle />
          <Link href="/login" passHref className={styles.loginLink}>
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            O seu refúgio digital.
          </h1>
          <p className={styles.subtitle}>
            AURA é o seu assistente pessoal confindencial para compreensão, consciencialização e recuperação do seu bem-estar emocional.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/login" passHref>
              <Button variant="primary" size="lg">Começar Agora</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features} id="features">
        <div className={styles.featuresHeader}>
          <h2 className={styles.sectionTitle}>Concebido para a vida moderna.</h2>
          <p className={styles.sectionSubtitle}>Ferramentas baseadas em evidências integradas organicamente no seu dia.</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.featureItem}>
            <div className={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
              </svg>
            </div>
            <h3>Avaliações Clínicas</h3>
            <p>Acompanhamento médico contínuo através de testes validados (PHQ-9, GAD-7).</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>Terapeuta IA Privado</h3>
            <p>Conversação orgânica, livre de julgamentos, disponível a qualquer segundo.</p>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8M12 8v8" />
              </svg>
            </div>
            <h3>Foco na Respiração</h3>
            <p>Rotinas simplificadas que desativam instantaneamente a resposta de stress.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
