import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.S_URL,
  process.env.S_SERV || process.env.S_ANON
);

export default supabase;
