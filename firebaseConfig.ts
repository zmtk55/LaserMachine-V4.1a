
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from 'firebase/storage';

// --- CONFIGURACIÓN DE FIREBASE ---
// Las credenciales están hardcodeadas para producción
// Opcional: Se puede sobrescribir desde localStorage para desarrollo

const productionFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const getConfiguration = () => {
    try {
        const localConfig = localStorage.getItem('lm_firebase_config_v1');
        if (localConfig) {
            console.log('[Firebase Debug] Usando configuración localStorage');
            console.log('[Firebase Debug] Dominio actual:', window.location.hostname);
            return JSON.parse(localConfig);
        }
    } catch (e) {
        console.error("Error leyendo config local", e);
    }
    console.log('[Firebase Debug] Usando configuración de producción');
    console.log('[Firebase Debug] Dominio actual:', window.location.hostname);
    return productionFirebaseConfig;
};

const finalConfig = getConfiguration();

// Variables para exportar
let app;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  // Verificar que la configuración tenga valores válidos
  const isConfigValid = finalConfig.apiKey && 
                        finalConfig.apiKey.startsWith("AIza") && 
                        finalConfig.projectId;

  if (isConfigValid) {
      app = initializeApp(finalConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      googleProvider = new GoogleAuthProvider();
      console.log("✅ Firebase inicializado correctamente");
      console.log("[Firebase Debug] authDomain configurado:", finalConfig.authDomain);
      console.log("[Firebase Debug] Dominio actual de la app:", window.location.hostname);
  } else {
      console.warn("⚠️ Configuración de Firebase inválida.");
  }
} catch (e) {
  console.error("⚠️ Error crítico inicializando Firebase.", e);
  // Si la configuración local estaba corrupta, limpiarla y usar la de producción
  if(localStorage.getItem('lm_firebase_config_v1')) {
      console.warn("Configuración local corrupta detectada. Limpiando...");
      localStorage.removeItem('lm_firebase_config_v1');
      // Recargar para intentar con la configuración de producción
      window.location.reload();
  }
}

export { auth, googleProvider, db, storage };
