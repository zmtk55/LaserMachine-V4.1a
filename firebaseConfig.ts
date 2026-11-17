// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from 'firebase/storage';

// --- CONFIGURACIÓN DE FIREBASE ---
// Toda la configuración viene de variables de entorno (Vercel / .env.local).
// NUNCA hardcodear credenciales aquí y NUNCA permitir sobrescribir la
// configuración desde localStorage: cualquiera en el navegador podría
// apuntar la app a otro proyecto de Firebase.
// Ver .env.example para la lista completa (VITE_FIREBASE_API_KEY, etc.).

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Variables para exportar
let app;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  // Verificar que la configuración tenga valores válidos
  const isConfigValid = firebaseConfig.apiKey &&
                        firebaseConfig.apiKey.startsWith("AIza") &&
                        firebaseConfig.projectId;

  if (isConfigValid) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      googleProvider = new GoogleAuthProvider();
  } else {
      console.warn("⚠️ Configuración de Firebase inválida.");
  }
} catch (e) {
  console.error("⚠️ Error crítico inicializando Firebase.", e);
}

export { auth, googleProvider, db, storage };
