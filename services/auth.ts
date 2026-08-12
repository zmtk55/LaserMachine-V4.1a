import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  User as FirebaseUser,
  signInAnonymously
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebaseConfig';
import { User, UserRole, BusinessAccount, BusinessStatus } from '../types';

// Admin emails hardcoded (fallback)
const ADMIN_EMAILS = [
  'info.lasermachine@gmail.com',
  'julian.insignia@gmail.com',
  'admin@lasermachine.com'
];

// Rate limiting storage (in-memory, resets on page refresh)
const attemptTracker: Record<string, { count: number; lastAttempt: number }> = {};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return auth !== null && db !== null;
};

// Check if email is admin
const isAdminEmail = (email: string): boolean => {
  const lowerEmail = email.toLowerCase().trim();
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(lowerEmail);
};

// Get admin emails from store config (localStorage)
const getDynamicAdminEmails = (): string[] => {
  try {
    const saved = localStorage.getItem('lm_store_v10');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.adminEmails || [];
    }
  } catch (e) {
    console.error('Error reading admin emails:', e);
  }
  return [];
};

// Check if user is admin (combines hardcoded + dynamic)
export const checkIsAdmin = (email: string): boolean => {
  const lowerEmail = email.toLowerCase().trim();
  const allAdminEmails = [
    ...ADMIN_EMAILS,
    ...getDynamicAdminEmails()
  ].map(e => e.toLowerCase());
  return allAdminEmails.includes(lowerEmail);
};

// Check if user belongs to an approved business account
export const getBusinessAccountForUser = async (email: string): Promise<BusinessAccount | null> => {
  if (!db) return null;
  try {
    const businessesRef = collection(db, 'businessAccounts');
    const q = query(
      businessesRef,
      where('users', 'array-contains-any', [{ email: email.toLowerCase() }]),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data() as BusinessAccount;
      if (data.status === BusinessStatus.APPROVED) return data;
    }
  } catch (e) {
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('lm_business_accounts_v1');
      if (saved) {
        const accounts: BusinessAccount[] = JSON.parse(saved);
        const found = accounts.find(a => 
          a.status === BusinessStatus.APPROVED && 
          a.users.some(u => u.email.toLowerCase() === email.toLowerCase())
        );
        return found || null;
      }
    } catch {}
  }
  return null;
};

export const isBusinessUser = async (email: string): Promise<boolean> => {
  const account = await getBusinessAccountForUser(email);
  return !!account;
};

// Rate limiting - Check if user can make another attempt
export const checkRateLimit = (action: string, maxAttempts: number = 5, windowMs: number = 60000): boolean => {
  const key = `${action}_${getClientIdentifier()}`;
  const now = Date.now();
  const tracker = attemptTracker[key];
  
  if (!tracker) {
    return true;
  }
  
  // Reset if window has passed
  if (now - tracker.lastAttempt > windowMs) {
    delete attemptTracker[key];
    return true;
  }
  
  return tracker.count < maxAttempts;
};

// Record an attempt for rate limiting
export const recordAttempt = (action: string): void => {
  const key = `${action}_${getClientIdentifier()}`;
  const now = Date.now();
  
  if (!attemptTracker[key]) {
    attemptTracker[key] = { count: 1, lastAttempt: now };
  } else {
    attemptTracker[key].count++;
    attemptTracker[key].lastAttempt = now;
  }
};

// Get a unique identifier for the client (simple fingerprint)
const getClientIdentifier = (): string => {
  try {
    const existing = sessionStorage.getItem('lm_client_id');
    if (existing) return existing;
    
    const id = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('lm_client_id', id);
    return id;
  } catch {
    return 'unknown';
  }
};

// Verify reCAPTCHA (placeholder - implement with actual reCAPTCHA if needed)
export const verifyRecaptcha = async (token: string): Promise<boolean> => {
  // For now, we use math captcha client-side
  // If you want real reCAPTCHA, add the library and implement here
  return true;
};

// Create or update user in Firestore
export const syncUserWithFirestore = async (firebaseUser: FirebaseUser, role?: UserRole, additionalData?: any): Promise<void> => {
  if (!db) throw new Error('Firestore not initialized');
  
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);
  
  const isAdmin = checkIsAdmin(firebaseUser.email || '');
  const isBusiness = await isBusinessUser(firebaseUser.email || '');
  const userRole = role || (isAdmin ? UserRole.ADMIN : isBusiness ? UserRole.BUSINESS : UserRole.CLIENT);
  
  if (!userSnap.exists()) {
    // New user - create in Firestore
    await setDoc(userRef, {
      id: firebaseUser.uid,
      email: firebaseUser.email?.toLowerCase() || additionalData?.phone || '',
      phone: additionalData?.phone || '',
      name: firebaseUser.displayName || additionalData?.name || firebaseUser.email?.split('@')[0] || 'Invitado',
      role: userRole,
      avatarUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(additionalData?.name || 'Guest')}&background=facc15&color=000000`,
      laserPoints: isAdmin || isBusiness ? 0 : 150, // Welcome points for clients
      pointsHistory: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      address: additionalData?.address || '',
      isActive: true,
      isGuest: userRole === UserRole.GUEST,
      businessId: additionalData?.businessId || '',
      ...additionalData
    });
  } else {
    // Existing user - update last login
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...additionalData
    });
  }
};

// Get user from Firestore
export const getUserFromFirestore = async (uid: string): Promise<User | null> => {
  if (!db) return null;
  
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: data.id,
        email: data.email || '',
        name: data.name,
        role: data.role as UserRole,
        avatarUrl: data.avatarUrl,
        laserPoints: data.laserPoints || 0,
        pointsHistory: data.pointsHistory || [],
        phone: data.phone || '',
        isGuest: data.isGuest || false,
        businessId: data.businessId || ''
      } as User;
    }
  } catch (error) {
    console.error('Error fetching user from Firestore:', error);
  }
  return null;
};

// Convert Firebase user to App User
export const convertToAppUser = async (firebaseUser: FirebaseUser, firestoreUser?: User | null): Promise<User> => {
  const isAdmin = checkIsAdmin(firebaseUser.email || '');
  const isBusiness = await isBusinessUser(firebaseUser.email || '');
  
  return {
    id: firebaseUser.uid,
    email: firestoreUser?.email || firebaseUser.email?.toLowerCase() || '',
    name: firestoreUser?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Invitado',
    role: firestoreUser?.role || (isAdmin ? UserRole.ADMIN : isBusiness ? UserRole.BUSINESS : UserRole.CLIENT),
    avatarUrl: firestoreUser?.avatarUrl || firebaseUser.photoURL || `https://ui-avatars.com/api/?name=Guest&background=facc15&color=000000`,
    laserPoints: firestoreUser?.laserPoints || (isAdmin || isBusiness ? 0 : 150),
    pointsHistory: firestoreUser?.pointsHistory || [],
    phone: firestoreUser?.phone || '',
    isGuest: firestoreUser?.isGuest || false
  };
};

// Create guest user with phone number
export const createGuestUser = async (phone: string, name: string): Promise<User> => {
  if (!auth || !db) {
    throw new Error('Firebase no está configurado. Contacta al administrador.');
  }
  
  try {
    // Check if phone already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phone), limit(1));
    const querySnap = await getDocs(q);
    
    if (!querySnap.empty) {
      // Return existing user with this phone
      const existingData = querySnap.docs[0].data();
      const existingUser: User = {
        id: existingData.id,
        email: existingData.email || '',
        name: existingData.name,
        role: existingData.role as UserRole,
        avatarUrl: existingData.avatarUrl,
        laserPoints: existingData.laserPoints || 0,
        pointsHistory: existingData.pointsHistory || [],
        phone: existingData.phone || '',
        isGuest: existingData.isGuest || false
      };
      
      // Update last login
      await updateDoc(doc(db, 'users', existingUser.id), {
        lastLoginAt: serverTimestamp()
      });
      
      return existingUser;
    }
    
    // Create anonymous auth user for guest
    let userCredential;
    try {
      userCredential = await signInAnonymously(auth);
    } catch (authError: any) {
      console.error('Anonymous auth error:', authError);
      if (authError.code === 'auth/operation-not-allowed') {
        throw new Error('La autenticación anónima no está habilitada. El administrador debe activarla en Firebase Console > Authentication > Sign-in method > Anonymous.');
      }
      throw new Error('Error al crear sesión de invitado. Intenta con Google.');
    }
    
    const firebaseUser = userCredential.user;
    
    // Create guest user data
    const guestData = {
      phone,
      name: name.trim(),
      isGuest: true,
      guestCreatedAt: new Date().toISOString()
    };
    
    // Sync with Firestore
    await syncUserWithFirestore(firebaseUser, UserRole.GUEST, guestData);
    
    // Return guest user
    return {
      id: firebaseUser.uid,
      email: '',
      name: name.trim(),
      role: UserRole.GUEST,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=facc15&color=000000`,
      laserPoints: 0,
      pointsHistory: [],
      phone,
      isGuest: true
    };
  } catch (error: any) {
    console.error('Guest login error:', error);
    throw new Error(getAuthErrorMessage(error.code) || error.message || 'Error al crear sesión de invitado');
  }
};

// Register with email/password
export const registerWithEmail = async (
  email: string, 
  password: string, 
  name: string
): Promise<User> => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Update profile with display name
    await updateProfile(firebaseUser, { displayName: name });
    
    // Sync with Firestore
    await syncUserWithFirestore(firebaseUser, UserRole.CLIENT);
    
    // Get user from Firestore
    const firestoreUser = await getUserFromFirestore(firebaseUser.uid);
    
    return await convertToAppUser(firebaseUser, firestoreUser);
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Login with email/password
export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Sync with Firestore (update last login)
    await syncUserWithFirestore(firebaseUser);
    
    // Get user from Firestore
    const firestoreUser = await getUserFromFirestore(firebaseUser.uid);
    
    return await convertToAppUser(firebaseUser, firestoreUser);
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Login with Google
export const loginWithGoogle = async (): Promise<User> => {
  if (!auth || !googleProvider) throw new Error('Firebase Auth not initialized');
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    // Sync with Firestore
    await syncUserWithFirestore(firebaseUser);
    
    // Get user from Firestore
    const firestoreUser = await getUserFromFirestore(firebaseUser.uid);
    
    return await convertToAppUser(firebaseUser, firestoreUser);
  } catch (error: any) {
    console.error('Google login error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  if (!auth) throw new Error('Firebase Auth not initialized');
  
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Logout
export const logoutUser = async (): Promise<void> => {
  if (!auth) return;
  await signOut(auth);
};

// Auth state listener
export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const firestoreUser = await getUserFromFirestore(firebaseUser.uid);
      callback(await convertToAppUser(firebaseUser, firestoreUser));
    } else {
      callback(null);
    }
  });
};

// Get friendly error messages
const getAuthErrorMessage = (code: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Este correo ya está registrado. Intenta iniciar sesión.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/user-disabled': 'Esta cuenta ha sido desactivada.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
    'auth/popup-closed-by-user': 'Inicio de sesión cancelado.',
    'auth/configuration-not-found': 'Dominio no autorizado en Firebase Console.',
    'auth/api-key-not-valid': 'API Key inválida. Verifica la configuración.',
    'auth/invalid-api-key': 'API Key inválida. Verifica la configuración.',
    'auth/unauthorized-domain': 'Dominio no autorizado para operaciones de autenticación.',
    'auth/operation-not-allowed': 'Autenticación anónima no habilitada en Firebase. El administrador debe activarla en Firebase Console > Authentication > Sign-in method > Anonymous.'
  };
  
  return errorMessages[code] || 'Error de autenticación. Intenta de nuevo.';
};

// Demo mode for when Firebase is not configured
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
