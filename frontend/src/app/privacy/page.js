import Link from 'next/link';
export const metadata = { title: 'AURA — Privacidade' };
export default function PrivacyPage() {
  const entity = process.env.AURA_LEGAL_ENTITY;
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return <main style={{ maxWidth: 760, margin: '48px auto', padding: 24, lineHeight: 1.8 }}>
    <h1>Política de Privacidade / Privacy Policy</h1>
    <p role="status"><strong>Rascunho para revisão antes do lançamento / Draft for review before launch.</strong></p>
    <p>Atualização / Updated: 26/10/2026</p>
    {entity && <p>Responsáveis / Controllers: {entity}. {email && <a href={`mailto:${email}`}>{email}</a>}</p>}
    <h2>Dados e finalidade / Data and purpose</h2>
    <p>A AURA trata o e-mail, os dados de perfil, as preferências e os registos de humor, sono, reflexões, avaliações e conversas que fornece. Estes dados permitem gerir a conta, sincronizar o histórico e apresentar funcionalidades de bem-estar e relatórios.</p>
    <p>AURA processes the email, profile, preferences, mood, sleep, reflections, assessments and conversations you provide to operate your account, sync your history and display wellbeing features and reports.</p>
    <h2>Serviços externos / External services</h2>
    <p>A autenticação e os dados da aplicação usam o Supabase. Quando a análise por IA está disponível, o conteúdo das conversas, os registos recentes e as respostas às avaliações podem ser enviados ao Google Gemini para produzir respostas. As respostas automáticas podem conter erros. Evite fornecer dados identificáveis de terceiros.</p>
    <p>Authentication and application data use Supabase. When AI analysis is available, conversation content, recent logs and assessment answers may be sent to Google Gemini to generate responses. Automated responses can contain errors. Avoid sharing identifying information about other people.</p>
    <h2>Dispositivo e controlo dos dados / Device and data controls</h2>
    <p>A aplicação guarda informação de sessão e algumas preferências ou cópias do histórico no dispositivo. Em Definições pode corrigir o perfil, exportar os dados e solicitar a eliminação da conta. Os lembretes locais dependem da sua autorização e podem ser desativados.</p>
    <p>The app stores session information and some preferences or cached history on your device. Settings lets you correct your profile, export your data and request account deletion. Local reminders require your permission and can be disabled.</p>
    {email && <p>Para pedidos de privacidade / For privacy requests: <a href={`mailto:${email}`}>{email}</a>.</p>}
    <p>Antes da publicação, esta política deve ser completada com a base jurídica, prazos de conservação e de cópias de segurança, regiões de alojamento, transferências internacionais, direitos e autoridade de controlo aplicáveis ao responsável.</p>
    <Link href="/terms">Termos / Terms</Link>{' · '}<Link href="/login">Iniciar sessão / Sign in</Link>
  </main>;
}
