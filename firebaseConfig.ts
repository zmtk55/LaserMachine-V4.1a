
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from 'firebase/storage';

// --- IMPORTANTE: CONFIGURACIÓN DE FIREBASE ---
// 1. Intenta leer desde el almacenamiento local (Configurado desde el Modal de Login)
// 2. Si no existe, usa la configuración hardcodeada (que debes editar si vas a desplegar en producción)

const defaultFirebaseConfig = {
  apiKey: "API_KEY_REAL_AQUI", // <--- EDITA ESTO SI PREFIERES CÓDIGO DIRECTO
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abcdef"
};

const getConfiguration = () => {
    try {
        const localConfig = localStorage.getItem('lm_firebase_config_v1');
        if (localConfig) {
            return JSON.parse(localConfig);
        }
    } catch (e) {
        console.error("Error leyendo config local", e);
    }
    return defaultFirebaseConfig;
};

const finalConfig = getConfiguration();

// Variables para exportar
let app;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  // Verificación: Si tiene la llave placeholder y NO hay config local, es inválido.
  const isConfigValid = finalConfig.apiKey && finalConfig.apiKey !== "API_KEY_REAL_AQUI";

  if (isConfigValid) {
      app = initializeApp(finalConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      googleProvider = new GoogleAuthProvider();
  } else {
      console.warn("⚠️ Firebase no configurado. Se requiere configuración manual o edición de archivo.");
  }
} catch (e) {
  console.error("⚠️ Error crítico inicializando Firebase. La app continuará en modo limitado.", e);
  // Si la configuración local estaba corrupta, limpiarla para permitir reintento
  if(localStorage.getItem('lm_firebase_config_v1')) {
      console.warn("Configuración local corrupta detectada. Limpiando...");
      localStorage.removeItem('lm_firebase_config_v1');
  }
}

export { auth, googleProvider, db, storage };
