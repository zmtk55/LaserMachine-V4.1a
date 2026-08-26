// Supabase Auth Service for LaserMachine
// Replaces the Firebase implementation — SAME public API, so components
// (App.tsx, AuthModal.tsx) need no changes.
// User profile data lives in the `customers` table (was: Firestore `users`).

import { User, UserRole, BusinessAccount, BusinessStatus } from '../types';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let authClient: SupabaseClient | null = null;

const getAuthClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!authClient) {
    authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return authClient;
};

// Admin emails hardcoded (fallback)
const ADMIN_EMAILS = [
  'info.lasermachine@gmail.com',
  'julian.insignia@gmail.com',
  'admin@lasermachine.com'
];

// Rate limiting storage (in-memory)
const attemptTracker: Record<string, { count: number; lastAttempt: number }> = {};

export const isFirebaseConfigured = (): boolean => getAuthClient() !== null;

export const checkIsAdmin = (email: string): boolean => {
  const lowerEmail = email.toLowerCase().trim();
  const allAdminEmails = [...ADMIN_EMAILS, ...getDynamicAdminEmails()].map(e => e.toLowerCase());
  return allAdminEmails.includes(lowerEmail);
};

const getDynamicAdminEmails = (): string[] => {
  try {
    const saved = localStorage.getItem('lm_store_v10');
    if (saved) return JSON.parse(saved).adminEmails || [];
  } catch (e) { console.error('Error reading admin emails:', e); }
  return [];
};

// ---------- Business accounts (localStorage fallback kept; table optional) ----------
export const getBusinessAccountForUser = async (email: string): Promise<BusinessAccount | null> => {
  try {
    const saved = localStorage.getItem('lm_business_accounts_v1');
    if (saved) {
      const accounts: BusinessAccount[] = JSON.parse(saved);
      const found = accounts.find(a =>
        a.status === BusinessStatus.APPROVED &&
        a.users.some(u => u.email.toLowerCase() === email.toLowerCase())
      );
      if (found) return found;
    }
  } catch {}
  return null;
};

export const isBusinessUser = async (email: string): Promise<boolean> => {
  const account = await getBusinessAccountForUser(email);
  return !!account;
};

// ---------- Rate limiting (unchanged API) ----------
export const checkRateLimit = (action: string, maxAttempts: number = 5, windowMs: number = 60000): boolean => {
  const key = `${action}_${getClientIdentifier()}`;
  const now = Date.now();
  const tracker = attemptTracker[key];
  if (!tracker) return true;
  if (now - tracker.lastAttempt > windowMs) { delete attemptTracker[key]; return true; }
  return tracker.count < maxAttempts;
};

export const recordAttempt = (action: string): void => {
  const key = `${action}_${getClientIdentifier()}`;
  const now = Date.now();
  if (!attemptTracker[key]) attemptTracker[key] = { count: 1, lastAttempt: now };
  else attemptTracker[key].count++;
};

const getClientIdentifier = (): string => {
  try {
    const existing = sessionStorage.getItem('lm_client_id');
    if (existing) return existing;
    const id = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('lm_client_id', id);
    return id;
  } catch { return 'unknown'; }
};

export const verifyRecaptcha = async (_token: string): Promise<boolean> => true;

// ---------- customers-table profile helpers ----------
const profileFromCustomer = (
  customerId: string,
  email: string,
  meta: Record<string, any> | undefined,
  customer: Record<string, any> | null,
  roleOverride?: UserRole
): User => {
  const isAdmin = checkIsAdmin(email);
  return {
    id: customerId,
    email,
    name: customer?.name || meta?.['full_name'] || email.split('@')[0] || 'Invitado',
    role: roleOverride || customer?.role as UserRole || (isAdmin ? UserRole.ADMIN : UserRole.CLIENT),
    avatarUrl: customer?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(meta?.['full_name'] || 'Guest')}&background=facc15&color=000000`,
    laserPoints: customer?.laser_points ?? 0,
    pointsHistory: [],
    phone: customer?.phone || meta?.['phone'] || '',
    isGuest: false
  } as User;
};

const upsertCustomerProfile = async (sb: SupabaseClient, userId: string, email: string, name?: string, phone?: string) => {
  const isAdmin = checkIsAdmin(email);
  const row = {
    auth_user_id: userId,
    email: email.toLowerCase(),
    name: name || email.split('@')[0],
    phone: phone || '',
    laser_points: isAdmin ? 0 : 150,
  };
  // upsert keyed on auth_user_id if column exists; fallback to phone-keyed
  await sb.from('customers').upsert(row, { onConflict: 'auth_user_id' });
};

const getUserProfileByAuthId = async (sb: SupabaseClient, userId: string) => {
  let res = await sb.from('customers').select('*').eq('auth_user_id', userId).maybeSingle();
  if (res.error && /column .* does not exist/i.test(res.error.message)) {
    // schema without auth_user_id column — match by email instead
    const { data: { user } } = await sb.auth.getUser();
    res = await sb.from('customers').select('*').eq('email', user?.email ?? '').maybeSingle();
  }
  return res.data ?? null;
};

// ---------- Registration ----------
export const registerWithEmail = async (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  const sb = getAuthClient();
  if (!sb) throw new Error('Supabase Auth no inicializado');
  try {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Registro falló');
    await upsertCustomerProfile(sb, data.user.id, data.user.email || email, name);
    const customer = await getUserProfileByAuthId(sb, data.user.id);
    return profileFromCustomer(data.user.id, data.user.email || email, data.user.user_metadata, customer);
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(supabaseErrorMessage(error.message));
  }
};

// ---------- Login email/password ----------
export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  const sb = getAuthClient();
  if (!sb) throw new Error('Supabase Auth no inicializado');
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await upsertCustomerProfile(sb, data.user.id, data.user.email || email);
    const customer = await getUserProfileByAuthId(sb, data.user.id);
    return profileFromCustomer(data.user.id, data.user.email || email, data.user.user_metadata, customer);
  } catch (error: any) {
    console.error('Login error:', error);
    recordAttempt('login');
    throw new Error(supabaseErrorMessage(error.message));
  }
};

// ---------- Google OAuth ----------
// NOTE: Google sign-in with Supabase is a redirect flow (not popup).
// The session arrives via onAuthChange after redirect back to the app.
export const loginWithGoogle = async (): Promise<User> => {
  const sb = getAuthClient();
  if (!sb) throw new Error('Supabase Auth no inicializado');
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new Error(supabaseErrorMessage(error.message));
  // Redirect happens; caller should not expect an immediate User.
  throw new Error('REDIRECTING');
};

// ---------- Guest users (phone-based, no password) ----------
export const createGuestUser = async (phone: string, name: string): Promise<User> => {
  const sb = getAuthClient();
  if (!sb) throw new Error('Supabase no está configurado. Contacta al administrador.');
  try {
    // Look for an existing customer with this phone
    const { data: existing } = await sb.from('customers').select('*').eq('phone', phone).maybeSingle();
    if (existing) {
      return {
        id: String(existing.id),
        email: existing.email || '',
        name: existing.name,
        role: UserRole.GUEST,
        avatarUrl: existing.avatar_url,
        laserPoints: existing.laser_points || 0,
        pointsHistory: [],
        phone: existing.phone || phone,
        isGuest: true
      } as User;
    }
    // Anonymous auth so RLS INSERT policies accept the order writes
    const { data: anonData, error: anonError } = await sb.auth.signInAnonymously();
    if (anonError) throw anonError;
    const uid = anonData.user?.id ?? crypto.randomUUID();
    const { data: created, error } = await sb.from('customers')
      .insert({ auth_user_id: uid, phone, name, laser_points: 150 })
      .select()
      .single();
    if (error) throw error;
    return {
      id: String(created.id),
      email: '',
      name: created.name,
      role: UserRole.GUEST,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=facc15&color=000000`,
      laserPoints: created.laser_points || 150,
      pointsHistory: [],
      phone,
      isGuest: true
    } as User;
  } catch (error: any) {
    console.error('Guest user error:', error);
    throw new Error(supabaseErrorMessage(error.message));
  }
};

// ---------- Password reset ----------
export const resetPassword = async (email: string): Promise<void> => {
  const sb = getAuthClient();
  if (!sb) throw new Error('Supabase Auth no inicializado');
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw new Error(supabaseErrorMessage(error.message));
};

// ---------- Logout ----------
export const logoutUser = async (): Promise<void> => {
  const sb = getAuthClient();
  if (!sb) return;
  await sb.auth.signOut();
};

// ---------- Auth state listener (same contract as Firebase version) ----------
export const onAuthChange = (callback: (user: User | null) => void) => {
  const sb = getAuthClient();
  if (!sb) { callback(null); return () => {}; }

  let unsub: (() => void) | null = null;

  // Initial session check (handles Google-redirect return too)
  sb.auth.getSession().then(async ({ data }) => {
    const session = data.session;
    if (!session?.user) { callback(null); return; }
    const u = session.user;
    await upsertCustomerProfile(sb, u.id, u.email || '');
    const customer = await getUserProfileByAuthId(sb, u.id);
    callback(profileFromCustomer(u.id, u.email || '', u.user_metadata, customer));
  }).catch(() => callback(null));

  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) { callback(null); return; }
    // async resolve profile then notify
    (async () => {
      const u = session.user;
      const customer = await getUserProfileByAuthId(sb, u.id);
      callback(profileFromCustomer(u.id, u.email || '', u.user_metadata, customer));
    })();
  });
  unsub = () => data.subscription.unsubscribe();
  return unsub;
};

// ---------- Friendly errors ----------
const supabaseErrorMessage = (msg: string): string => {
  const m = msg.toLowerCase();
  if (m.includes('already registered') || m.includes('user already exists'))
    return 'Este correo ya está registrado. Intenta iniciar sesión.';
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed'))
    return 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja.';
  if (m.includes('password should be at least'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Demasiados intentos. Intenta más tarde.';
  if (m.includes('anonymous sign-ins are disabled'))
    return 'Acceso como invitado no habilitado. Contacta al administrador.';
  return msg || 'Error de autenticación. Intenta de nuevo.';
};

// ---------- Demo mode ----------
export const createDemoUser = (): User => ({
  id: 'demo-admin',
  email: 'admin@lasermachine.com',
  name: 'Admin Demo',
  role: UserRole.ADMIN,
  avatarUrl: 'https://ui-avatars.com/api/?name=Admin+Demo&background=facc15&color=000000',
  laserPoints: 0,
  pointsHistory: [],
  phone: '',
  isGuest: false
});
