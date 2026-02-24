import React, { useState, useEffect } from 'react';
import { 
  X, Lock, Chrome, ShieldCheck, AlertCircle, ServerOff, Settings, Save, Trash2, 
  Mail, Eye, EyeOff, UserPlus, ArrowLeft, CheckCircle, Loader2 
} from 'lucide-react';
import { 
  isFirebaseConfigured, 
  loginWithEmail, 
  loginWithGoogle, 
  registerWithEmail, 
  resetPassword,
  createDemoUser 
} from '../services/auth';
import { UserRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // Config State
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');

  // Detectar si Firebase está configurado al abrir el modal
  useEffect(() => {
    if (!isOpen) {
      // Reset form when closing
      setTimeout(() => {
        setAuthMode('login');
        setError('');
        setSuccess('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
      }, 300);
      return;
    }
    
    setIsOfflineMode(!isFirebaseConfigured());
    
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
      setError('Todos los campos son requeridos');
      return;
    }
    const config = {
      apiKey,
      authDomain,
      projectId,
      storageBucket: `${projectId}.appspot.com`,
      messagingSenderId: "123456789",
      appId: "1:123456:web:abcdef"
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

  // Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email || !password) {
      setError('Por favor ingresa correo y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      onLogin(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!name || !email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const user = await registerWithEmail(email, password, name);
      onLogin(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    // --- MODO DE SEGURIDAD (FALLBACK) ---
    if (isOfflineMode) {
      setTimeout(() => {
        const demoUser = createDemoUser();
        onLogin(demoUser);
        setIsLoading(false);
        onClose();
      }, 800);
      return;
    }

    // --- MODO REAL CON GOOGLE ---
    try {
      const user = await loginWithGoogle();
      onLogin(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google');
      setIsLoading(false);
    }
  };

  // Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setSuccess('Te hemos enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo mode login
  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const demoUser = createDemoUser();
      onLogin(demoUser);
      setIsLoading(false);
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  // Config View
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
              <input 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)} 
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-xs font-mono" 
                placeholder="AIzaSy..."
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Auth Domain</label>
              <input 
                value={authDomain} 
                onChange={e => setAuthDomain(e.target.value)} 
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-xs font-mono" 
                placeholder="proyecto.firebaseapp.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Project ID</label>
              <input 
                value={projectId} 
                onChange={e => setProjectId(e.target.value)} 
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 rounded text-xs font-mono" 
                placeholder="mi-proyecto-id"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleClearConfig} className="p-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200">
              <Trash2 size={16}/>
            </button>
            <button 
              onClick={handleSaveConfig} 
              className="flex-1 py-3 bg-yellow-400 text-black font-black uppercase text-xs rounded-xl hover:bg-yellow-300 flex items-center justify-center gap-2"
            >
              Guardar y Recargar <Save size={16}/>
            </button>
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
          <button 
            onClick={() => setShowConfig(true)} 
            className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-black dark:hover:text-white transition-colors" 
            title="Configurar Firebase"
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={onClose} 
            className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-inner">
              {isOfflineMode ? <ServerOff size={32} className="text-zinc-400" /> : <ShieldCheck size={32} className="text-yellow-500" />}
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
              {authMode === 'login' && 'Iniciar Sesión'}
              {authMode === 'register' && 'Crear Cuenta'}
              {authMode === 'forgot' && 'Recuperar Contraseña'}
            </h2>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-2">
              {isOfflineMode ? 'Sin conexión a servicios en la nube' : 'Sistema de Gestión Lasermachine'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Offline Mode Warning */}
          {isOfflineMode && (
            <div className="mb-4 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2 font-bold text-zinc-700 dark:text-zinc-300 text-xs mb-2">
                <ServerOff size={14}/> MODO DEMO ACTIVO
              </div>
              <p className="text-[10px] text-zinc-500 mb-2">
                No se detectó configuración de Firebase. Puedes usar el modo demo o configurar Firebase.
              </p>
              <button 
                onClick={() => setShowConfig(true)} 
                className="text-yellow-600 dark:text-yellow-400 underline font-bold text-[10px]"
              >
                Configurar Firebase ahora
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <Loader2 className={`w-8 h-8 animate-spin ${isOfflineMode ? 'text-zinc-400' : 'text-yellow-400'}`} />
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Procesando...</p>
            </div>
          ) : (
            <>
              {/* LOGIN FORM */}
              {authMode === 'login' && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Correo Electrónico</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Contraseña</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-10 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setError('');
                      }}
                      className="text-[10px] text-zinc-500 hover:text-yellow-500 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-sm py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Lock size={18} />
                    Iniciar Sesión
                  </button>

                  {/* Google Login */}
                  {!isOfflineMode && (
                    <>
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                          <span className="px-2 bg-white dark:bg-[#09090b] text-zinc-500">O continúa con</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-sm py-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <Chrome size={18} className="text-blue-500" />
                        Google
                      </button>
                    </>
                  )}

                  {/* Demo Mode Button */}
                  {isOfflineMode && (
                    <button
                      type="button"
                      onClick={handleDemoLogin}
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-sm py-4 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ServerOff size={18} />
                      Entrar en Modo Demo
                    </button>
                  )}

                  <div className="text-center pt-2">
                    <p className="text-xs text-zinc-500">
                      ¿No tienes cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setError('');
                        }}
                        className="text-yellow-500 hover:text-yellow-400 font-bold"
                      >
                        Regístrate aquí
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* REGISTER FORM */}
              {authMode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-[10px] text-zinc-500 hover:text-yellow-500 flex items-center gap-1 mb-2"
                  >
                    <ArrowLeft size={12} /> Volver al login
                  </button>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Nombre Completo</label>
                    <div className="relative">
                      <UserPlus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Correo Electrónico</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Contraseña</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-10 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Confirmar Contraseña</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-sm py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus size={18} />
                    Crear Cuenta
                  </button>

                  <p className="text-[10px] text-zinc-500 text-center">
                    Al registrarte, aceptas nuestros términos y condiciones.
                  </p>
                </form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {authMode === 'forgot' && (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-[10px] text-zinc-500 hover:text-yellow-500 flex items-center gap-1 mb-2"
                  >
                    <ArrowLeft size={12} /> Volver al login
                  </button>

                  <p className="text-xs text-zinc-500 mb-4">
                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                  </p>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1 block">Correo Electrónico</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !!success}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-sm py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Mail size={18} />
                    Enviar Enlace de Recuperación
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-[9px] text-zinc-400 flex items-center justify-center gap-2">
            <Lock size={10} /> 
            {isOfflineMode ? 'Entorno de pruebas activo' : 'Autenticación segura con Firebase'}
          </p>
        </div>
      </div>
    </div>
  );
};
