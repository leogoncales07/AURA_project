import Link from 'next/link';
export const metadata = { title: 'AURA — Termos' };
export default function TermsPage() {
  const entity = process.env.AURA_LEGAL_ENTITY;
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return <main style={{ maxWidth: 760, margin: '48px auto', padding: 24, lineHeight: 1.8 }}>
    <h1>Termos de Utilização / Terms of Use</h1>
    <p><strong>Rascunho para revisão antes do lançamento / Draft for review before launch.</strong></p>
    {entity && <p>Responsáveis / Operators: {entity}.</p>}
    {email && <p>Contacto / Contact: <a href={`mailto:${email}`}>{email}</a></p>}
    <h2>Finalidade / Purpose</h2>
    <p>A AURA oferece ferramentas de bem-estar, autorregisto, exercícios e um assistente automático. Não fornece diagnóstico, tratamento, aconselhamento clínico ou acompanhamento contínuo.</p>
    <p>AURA provides wellbeing tools, self tracking, exercises and an automated assistant. It does not provide diagnosis, treatment, clinical advice or continuous monitoring.</p>
    <h2>Emergências / Emergencies</h2>
    <p>A AURA não é um serviço de emergência. Se existir perigo imediato para si ou outra pessoa, contacte os serviços de emergência locais. Não espere por uma resposta na aplicação.</p>
    <p>AURA is not an emergency service. If you or another person is in immediate danger, contact local emergency services. Do not wait for a response in the app.</p>
    <h2>Conta e conteúdo / Account and content</h2>
    <p>Proteja as suas credenciais. Não utilize a aplicação para atividades ilícitas ou para divulgar dados de terceiros sem autorização. As respostas de IA podem estar erradas e devem ser avaliadas com cuidado.</p>
    <p>Protect your credentials. Do not use the app for unlawful activities or disclose other people’s data without permission. AI responses may be wrong and should be assessed carefully.</p>
    <p>A elegibilidade etária, a lei aplicável, as condições de disponibilidade e a identificação do responsável devem ser finalizadas antes da publicação.</p>
    <Link href="/privacy">Privacidade / Privacy</Link>{' · '}<Link href="/login">Iniciar sessão / Sign in</Link>
  </main>;
}
