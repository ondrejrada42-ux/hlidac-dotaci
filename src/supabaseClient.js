import { SUPABASE_URL, SUPABASE_ANON_KEY, DEMO_MODE } from './config.js';

let clientPromise = null;

export function getSupabase() {
  if (DEMO_MODE) return null;
  if (!clientPromise) {
    clientPromise = import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    );
  }
  return clientPromise;
}
