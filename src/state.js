import { db } from './db.js';
import { DEMO_MODE } from './config.js';
import { getSupabase } from './supabaseClient.js';

const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function getCurrentUser() {
  if (DEMO_MODE) {
    const id = db.getLocalSession();
    if (!id) return null;
    return db.getUserById(id);
  }
  const supabase = await getSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  return db.getUserById(session.user.id);
}

export async function login(email, password) {
  if (DEMO_MODE) {
    const user = db.getUserByEmail(email);
    if (!user || user.password !== password) {
      return { ok: false, error: 'Nesprávný e-mail nebo heslo.' };
    }
    db.setLocalSession(user.id);
    notify();
    return { ok: true, user };
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, error: 'Nesprávný e-mail nebo heslo.' };
  }
  const user = await db.getUserById(data.user.id);
  notify();
  return { ok: true, user };
}

export async function register(email, password) {
  if (!email || !password || password.length < 6) {
    return { ok: false, error: 'Zadejte e-mail a heslo o délce alespoň 6 znaků.' };
  }

  if (DEMO_MODE) {
    if (db.getUserByEmail(email)) {
      return { ok: false, error: 'Uživatel s tímto e-mailem už existuje.' };
    }
    const user = db.createLocalUser({ email, password });
    db.setLocalSession(user.id);
    notify();
    return { ok: true, user };
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { ok: false, error: error.message === 'User already registered' ? 'Uživatel s tímto e-mailem už existuje.' : error.message };
  }
  if (!data.session) {
    return { ok: true, needsConfirmation: true };
  }
  const user = await db.getUserById(data.user.id);
  notify();
  return { ok: true, user };
}

export async function requestPasswordReset(email) {
  if (DEMO_MODE) {
    if (!db.getUserByEmail(email)) {
      return { ok: false, error: 'Uživatel s tímto e-mailem neexistuje.' };
    }
    return { ok: true };
  }
  const supabase = await getSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/#/nove-heslo`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updatePassword(newPassword) {
  if (DEMO_MODE) return { ok: true };
  const supabase = await getSupabase();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function logout() {
  if (DEMO_MODE) {
    db.clearLocalSession();
    notify();
    return;
  }
  const supabase = await getSupabase();
  await supabase.auth.signOut();
  notify();
}
