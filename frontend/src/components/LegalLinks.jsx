import Link from 'next/link';
export default function LegalLinks() {
  return <footer style={{ fontSize: 12, textAlign: 'center', padding: '20px 12px', opacity: 0.8 }}>
    <Link href="/privacy">Privacidade / Privacy</Link>{' · '}<Link href="/terms">Termos / Terms</Link>
    <p>A AURA apoia o bem-estar. Não substitui cuidados de saúde nem é um serviço de emergência.<br />
      AURA supports wellbeing. It does not replace healthcare or provide emergency services.</p>
  </footer>;
}
