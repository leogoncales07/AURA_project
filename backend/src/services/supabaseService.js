import { createClient } from '@supabase/supabase-js';

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
// Never share an authenticated session between requests on the server.
export const createAuthClient = () => createClient(process.env.S_URL, process.env.S_ANON, options);
export const createUserClient = (token) => createClient(process.env.S_URL, process.env.S_ANON, {
  ...options, global: { headers: { Authorization: `Bearer ${token}` } },
});
export async function updateAuthUser(token, attributes) {
  const response = await fetch(`${process.env.S_URL}/auth/v1/user`, {
    method: 'PUT',
    headers: { apikey: process.env.S_ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(attributes),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  return response.ok ? { data: { user: data }, error: null } : {
    data: {}, error: { message: data.msg || data.message || 'Unable to update account', status: response.status },
  };
}
const supabase = createClient(process.env.S_URL, process.env.S_SERV || process.env.S_ANON, options);

export default supabase;
