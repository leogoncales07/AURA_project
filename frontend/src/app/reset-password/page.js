'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ResetPassword() {
  const handledLink = useRef(false);
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (handledLink.current) return;
    handledLink.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get('type') === 'recovery' && params.get('access_token')) setToken(params.get('access_token'));
    else setMessage(params.get('error_description') || 'Link inválido ou expirado. Solicite um novo link. / Invalid or expired link. Request a new one.');
    window.history.replaceState(null, '', window.location.pathname);
  }, []);
  async function submit(event) {
    event.preventDefault();
    if (password !== confirmation) { setMessage('As palavras-passe não coincidem. / Passwords do not match.'); return; }
    setBusy(true);
    const result = await api.resetPassword(password, token);
    setBusy(false);
    if (result.error) setMessage(result.error);
    else { setDone(true); setToken(''); setMessage('Palavra-passe alterada. Pode iniciar sessão. / Password updated. You can sign in.'); }
  }
  return <main style={{ maxWidth: 440, margin: '10vh auto', padding: 24 }}>
    <h1>Nova palavra-passe / New password</h1>
    {!done && <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
      <label>Palavra-passe / Password<input style={{ width: '100%' }} type="password" autoComplete="new-password" minLength={8} maxLength={200} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label>Confirmar / Confirm<input style={{ width: '100%' }} type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      <button disabled={!token || busy}>{busy ? 'A guardar… / Saving…' : 'Guardar / Save'}</button>
    </form>}
    <p role="status">{message}</p><Link href="/login">Iniciar sessão / Sign in</Link>
  </main>;
}
