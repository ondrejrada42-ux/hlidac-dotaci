import { SEED_USERS, SEED_CALLS } from './seed.js';
import { DEMO_MODE } from './config.js';
import { getSupabase } from './supabaseClient.js';

const DB_KEY = 'dotace_db_v1';
const SESSION_KEY = 'dotace_session_v1';

function loadRaw() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRaw(dbState) {
  localStorage.setItem(DB_KEY, JSON.stringify(dbState));
}

function initLocal() {
  let dbState = loadRaw();
  if (!dbState) {
    dbState = {
      users: structuredClone(SEED_USERS),
      calls: structuredClone(SEED_CALLS),
      saved_calls: [],
      excluded: [],
    };
    saveRaw(dbState);
  }
  return dbState;
}

let local = DEMO_MODE ? initLocal() : null;

function persistLocal() {
  saveRaw(local);
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

async function sb() {
  return getSupabase();
}

export const db = {
  resetLocal() {
    if (!DEMO_MODE) return;
    local = {
      users: structuredClone(SEED_USERS),
      calls: structuredClone(SEED_CALLS),
      saved_calls: [],
      excluded: [],
    };
    persistLocal();
  },

  // ---- Uživatelé / profily -------------------------------------------------

  async getUsers() {
    if (DEMO_MODE) return local.users;
    const supabase = await sb();
    const { data, error } = await supabase.from('profiles').select('*').order('created_at');
    if (error) throw error;
    return data;
  },

  async getUserById(id) {
    if (DEMO_MODE) return local.users.find((u) => u.id === id) || null;
    const supabase = await sb();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },

  // Pouze pro demo-režim (přihlašování bez Supabase Auth).
  getUserByEmail(email) {
    if (!DEMO_MODE) return null;
    return local.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  // Pouze pro demo-režim. V Supabase režimu vzniká profil automaticky triggerem po supabase.auth.signUp().
  createLocalUser(user) {
    const newUser = {
      id: uid('u'),
      role: 'user',
      plan: 'FREE',
      obor: null,
      kraj: null,
      velikost_firmy: null,
      onboarding_complete: false,
      notification_prefs: {
        frequency: 'tydenni',
        poskytovatele: { EU: true, MPO: true, MMR: true, Kraj: true, SFŽP: true, MZe: true, MPSV: true, ČMZRB: true },
      },
      created_at: new Date().toISOString().slice(0, 10),
      ...user,
    };
    local.users.push(newUser);
    persistLocal();
    return newUser;
  },

  async updateUser(id, patch) {
    if (DEMO_MODE) {
      const user = local.users.find((u) => u.id === id);
      if (!user) return null;
      Object.assign(user, patch);
      persistLocal();
      return user;
    }
    const supabase = await sb();
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data;
  },

  // ---- Výzvy ----------------------------------------------------------------

  async getCalls() {
    if (DEMO_MODE) return local.calls;
    const supabase = await sb();
    const { data, error } = await supabase.from('calls').select('*').order('deadline');
    if (error) throw error;
    return data;
  },

  async getCallById(id) {
    if (DEMO_MODE) return local.calls.find((c) => c.id === id) || null;
    const supabase = await sb();
    const { data, error } = await supabase.from('calls').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async createCall(call) {
    if (DEMO_MODE) {
      const newCall = { id: uid('c'), stav: 'aktivni', created_at: new Date().toISOString().slice(0, 10), ...call };
      local.calls.push(newCall);
      persistLocal();
      return newCall;
    }
    const supabase = await sb();
    const { data, error } = await supabase.from('calls').insert(call).select().single();
    if (error) throw error;
    return data;
  },

  async updateCall(id, patch) {
    if (DEMO_MODE) {
      const call = local.calls.find((c) => c.id === id);
      if (!call) return null;
      Object.assign(call, patch);
      persistLocal();
      return call;
    }
    const supabase = await sb();
    const { data, error } = await supabase.from('calls').update(patch).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data;
  },

  async deleteCall(id) {
    if (DEMO_MODE) {
      local.calls = local.calls.filter((c) => c.id !== id);
      persistLocal();
      return;
    }
    const supabase = await sb();
    const { error } = await supabase.from('calls').delete().eq('id', id);
    if (error) throw error;
  },

  // ---- Uložené výzvy ----------------------------------------------------------

  async getSavedCallsByUser(userId) {
    if (DEMO_MODE) return local.saved_calls.filter((s) => s.user_id === userId);
    const supabase = await sb();
    const { data, error } = await supabase.from('saved_calls').select('*').eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async isSaved(userId, callId) {
    if (DEMO_MODE) return local.saved_calls.some((s) => s.user_id === userId && s.call_id === callId);
    const supabase = await sb();
    const { data, error } = await supabase
      .from('saved_calls')
      .select('id')
      .eq('user_id', userId)
      .eq('call_id', callId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async saveCall(userId, callId, poznamka = '') {
    if (DEMO_MODE) {
      if (local.saved_calls.some((s) => s.user_id === userId && s.call_id === callId)) return;
      const entry = { id: uid('s'), user_id: userId, call_id: callId, poznamka, saved_at: new Date().toISOString() };
      local.saved_calls.push(entry);
      persistLocal();
      return entry;
    }
    const supabase = await sb();
    const { data, error } = await supabase
      .from('saved_calls')
      .upsert({ user_id: userId, call_id: callId, poznamka }, { onConflict: 'user_id,call_id', ignoreDuplicates: true })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateSavedNote(id, poznamka) {
    if (DEMO_MODE) {
      const entry = local.saved_calls.find((s) => s.id === id);
      if (!entry) return null;
      entry.poznamka = poznamka;
      persistLocal();
      return entry;
    }
    const supabase = await sb();
    const { data, error } = await supabase.from('saved_calls').update({ poznamka }).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data;
  },

  async removeSavedCall(id) {
    if (DEMO_MODE) {
      local.saved_calls = local.saved_calls.filter((s) => s.id !== id);
      persistLocal();
      return;
    }
    const supabase = await sb();
    const { error } = await supabase.from('saved_calls').delete().eq('id', id);
    if (error) throw error;
  },

  // ---- Vyloučené výzvy (pro učení relevance) -----------------------------------

  async getExcludedByUser(userId) {
    if (DEMO_MODE) return local.excluded.filter((e) => e.user_id === userId);
    const supabase = await sb();
    const { data, error } = await supabase.from('excluded').select('*').eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async addExcluded(userId, call) {
    if (DEMO_MODE) {
      if (local.excluded.some((e) => e.user_id === userId && e.call_id === call.id)) return;
      local.excluded.push({
        id: uid('x'),
        user_id: userId,
        call_id: call.id,
        poskytovatel: call.poskytovatel,
        obory: call.obory,
        excluded_at: new Date().toISOString(),
      });
      persistLocal();
      return;
    }
    const supabase = await sb();
    const { error } = await supabase
      .from('excluded')
      .upsert(
        { user_id: userId, call_id: call.id, poskytovatel: call.poskytovatel, obory: call.obory },
        { onConflict: 'user_id,call_id', ignoreDuplicates: true }
      );
    if (error) throw error;
  },

  // ---- Demo-režim: lokální session (Supabase režim řeší supabase.auth sám) ------

  getLocalSession() {
    return localStorage.getItem(SESSION_KEY);
  },
  setLocalSession(userId) {
    localStorage.setItem(SESSION_KEY, userId);
  },
  clearLocalSession() {
    localStorage.removeItem(SESSION_KEY);
  },
};
