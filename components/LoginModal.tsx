
import React, { useState, useEffect } from 'react';
import { X, Lock, Chrome, ShieldCheck, AlertCircle, ServerOff, WifiOff, Settings, Save, Trash2, LogIn } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Form State for Config
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');

  // Detectar si Firebase está configurado al abrir el modal
  useEffect(() => {
      if (!auth || !googleProvider) {
          setIsOfflineMode(true);
      } else {
          setIsOfflineMode(false);
      }
      
      // Load existing config if present
      const saved = localStorage.getItem('lm_firebase_config_v1');
      if (saved) {
          const p = JSON.parse(saved);
          setApiKey(p.apiKey || '');
          setAuthDomain(p.authDomain || '');
          setProjectId(p.projectId || '');
      }
  }, [isOpen]);

  const handleSaveConfig = () => {
      if (!apiKey || !authDomain || !projectId) {
          alert("Todos los campos son requeridos");
          return;
      }
      const config = {
          apiKey,
          authDomain,
          projectId,
          storageBucket: `${projectId}.appspot.com`, // Inferencia común
          messagingSenderId: "123456789", // Dummy seguro
          appId: "1:123456:web:abcdef" // Dummy seguro
      };
      localStorage.setItem('lm_firebase_config_v1', JSON.stringify(config));
      alert("Configuración guardada. Recargando sistema...");
      window.location.reload();
  };

  const handleClearConfig = () => {
      if(confirm("¿Borrar credenciales guardadas?")) {
          localStorage.removeItem('lm_firebase_config_v1');
          window.location.reload();
      }
  };

  if (!isOpen) return null;

  const handleLogin = async () => {
    setIsLoading(true);

    // --- MODO DE SEGURIDAD (FALLBACK) ---
    if (isOfflineMode) {
        setTimeout(() => {
            console.warn("Firebase no detectado. Iniciando en modo local.");
            onLogin({
                uid: 'local-admin',
                email: 'admin@lasermachine.com',
                displayName: 'Admin Local (Demo)',
                photoURL: ''
            });
            setIsLoading(false);
            onClose();
        }, 800);
        return;
    }

    // --- MODO REAL CON GOOGLE ---
    try {
        if (auth && googleProvider) {
            const result = await signInWithPopup(auth, googleProvider);
            onLogin(result.user);
            onClose();
        }
    } catch (err: any) {
        console.error("Error login:", err);
        let msg = "Error de conexión con Google.";
        if (err.code === 'auth/configuration-not-found') msg = "Dominio no autorizado en Firebase Console.";
        if (err.code === 'auth/api-key-not-valid') msg = "API Key inválida.";
        alert(msg + " Revisa la configuración.");
        setIsLoading(false);
    }
  };

  if (showConfig) {
      return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#09090b] w-full max-w-md rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase">Configurar Firebase</h3>
                    <button onClick={() => setShowConfig(false)}><X size={20} className="text-zinc-500 hover:text-white"/></button>
                </div>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">API Key</label>
                        <input value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-xs font-mono" placeholder="AIzaSy..."/>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Auth Domain</label>
                        <input value={authDomain} onChange={e => setAuthDomain(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-xs font-mono" placeholder="proyecto.firebaseapp.com"/>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Project ID</label>
                        <input value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-xs font-mono" placeholder="mi-proyecto-id"/>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={handleClearConfig} className="p-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200"><Trash2 size={16}/></button>
                    <button onClick={handleSaveConfig} className="flex-1 py-3 bg-yellow-400 text-black font-black uppercase text-xs rounded-xl hover:bg-yellow-300 flex items-center justify-center gap-2">Guardar y Recargar <Save size={16}/></button>
                </div>
                
                <p className="text-[9px] text-zinc-400 mt-4 text-center">
                    Estos datos se guardan en tu navegador localmente.
                </p>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#09090b] w-full max-w-md rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative">
        
        <div className={`h-2 w-full bg-gradient-to-r ${isOfflineMode ? 'from-zinc-400 to-zinc-600' : 'from-yellow-400 via-yellow-500 to-yellow-600'}`}></div>
        
        <div className="absolute top-4 right-4 flex gap-2 z-20">
            <button onClick={() => setShowConfig(true)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-black dark:hover:text-white transition-colors" title="Configurar Firebase">
                <Settings size={16} />
            </button>
            <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                <X size={16} />
            </button>
        </div>

        <div className="p-8">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-inner">
                    {isOfflineMode ? <ServerOff size={32} className="text-zinc-400" /> : <ShieldCheck size={32} className="text-yellow-500" />}
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                    {isOfflineMode ? 'Modo Demo' : 'Bienvenido'}
                </h2>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-2">
                    {isOfflineMode ? 'Sin conexión a servicios en la nube' : 'Sistema de Gestión Lasermachine'}
                </p>
            </div>

            {isOfflineMode && (
                <div className="mb-6 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col gap-2 text-[10px]">
                    <div className="flex items-center gap-2 font-bold text-zinc-700 dark:text-zinc-300">
                        <AlertCircle size={14}/> FALTAN CREDENCIALES
                    </div>
                    <p className="text-zinc-500">
                        No se detectó configuración de Firebase.
                    </p>
                    <button onClick={() => setShowConfig(true)} className="text-blue-500 underline font-bold text-left">
                        Haz clic aquí para pegar tus llaves (API Key) ahora.
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="py-4 flex flex-col items-center justify-center space-y-4">
                    <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${isOfflineMode ? 'border-zinc-400' : 'border-yellow-400'}`}></div>
                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Accediendo...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <button 
                        onClick={handleLogin}
                        className={`w-full border py-4 rounded-xl font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group shadow-lg ${
                            isOfflineMode 
                            ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700' 
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                    >
                        {isOfflineMode ? <WifiOff size={20} className="text-zinc-500"/> : <Chrome size={20} className="text-blue-500" />}
                        <span>{isOfflineMode ? 'Entrar como Admin Local' : 'Continuar con Google'}</span>
                    </button>
                </div>
            )}
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-[9px] text-zinc-400 flex items-center justify-center gap-2">
                <Lock size={10} /> {isOfflineMode ? 'Entorno de pruebas activo' : 'Autenticación segura activa'}
            </p>
        </div>
      </div>
    </div>
  );
};
