import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Chrome, Phone, User, ArrowRight, AlertCircle, CheckCircle, 
  Loader2, Shield, Lock, Eye, EyeOff, Mail
} from 'lucide-react';
import { 
  isFirebaseConfigured, 
  loginWithGoogle, 
  loginWithEmail,
  createGuestUser,
  checkRateLimit,
  recordAttempt
} from '../services/auth';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

type AuthView = 'client-welcome' | 'guest-phone' | 'admin-login';

// Simple math captcha for bot protection
const generateMathCaptcha = () => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `${a} + ${b} = ?`, answer: (a + b).toString() };
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [view, setView] = useState<AuthView>('client-welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Guest phone state
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [captcha, setCaptcha] = useState(generateMathCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  
  // Admin state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('client-welcome');
        setError('');
        setPhone('');
        setFirstName('');
        setLastName('');
        setCaptchaInput('');
        setCaptcha(generateMathCaptcha());
        setAttempts(0);
        setAdminEmail('');
        setAdminPassword('');
        setAdminClickCount(0);
      }, 300);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        if (!isLoading) onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, isLoading, onClose]);

  // Format phone number as user types
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  // Handle guest login with phone
  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check rate limiting
    const canProceed = checkRateLimit('guest-login');
    if (!canProceed) {
      setError('Demasiados intentos. Espera un momento e intenta de nuevo.');
      return;
    }
    
    // Validate inputs
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length !== 10) {
      setError('Ingresa un número de celular válido (10 dígitos)');
      return;
    }
    
    if (!firstName.trim() || firstName.trim().length < 2) {
      setError('Ingresa tu nombre');
      return;
    }
    
    if (!lastName.trim() || lastName.trim().length < 2) {
      setError('Ingresa tu apellido');
      return;
    }
    
    // Only verify captcha if attempts >= 2 (captcha is visible)
    if (attempts >= 2 && captchaInput !== captcha.answer) {
      setError('Respuesta de verificación incorrecta. Intenta de nuevo.');
      setCaptcha(generateMathCaptcha());
      setCaptchaInput('');
      setAttempts(prev => prev + 1);
      return;
    }
    
    setIsLoading(true);
    recordAttempt('guest-login');
    
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const user = await createGuestUser(phoneClean, fullName);
      onLogin(user);
      onClose();
    } catch (err: any) {
      console.error('Guest login error:', err);
      const errorMsg = err.message || 'Error al continuar. Intenta de nuevo.';
      setError(errorMsg);
      
      // Increment attempts on error
      setAttempts(prev => prev + 1);
      
      // Generate new captcha if showing
      if (attempts >= 1) {
        setCaptcha(generateMathCaptcha());
        setCaptchaInput('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setError('');
    
    if (!isFirebaseConfigured()) {
      setError('Servicio no disponible en este momento.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const user = await loginWithGoogle();
      onLogin(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle admin login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!adminEmail || !adminPassword) {
      setError('Ingresa correo y contraseña');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const user = await loginWithEmail(adminEmail, adminPassword);
      
      if (user.role !== UserRole.ADMIN) {
        setError('Acceso denegado. Solo administradores.');
        setIsLoading(false);
        return;
      }
      
      onLogin(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Hidden admin access (click 3 times on the icon)
  const handleAdminTrigger = () => {
    const newCount = adminClickCount + 1;
    setAdminClickCount(newCount);
    
    if (newCount >= 3) {
      setView('admin-login');
      setAdminClickCount(0);
    }
  };

  if (!isOpen) return null;

  // CLIENT WELCOME VIEW
  if (view === 'client-welcome') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div 
          ref={modalRef}
          className="bg-white dark:bg-[#09090b] w-full max-w-sm rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-black dark:hover:text-white transition-colors z-10"
          >
            <X size={16} />
          </button>

          <div className="p-6 pt-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-black text-black">LM</span>
              </div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                Bienvenido
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Personaliza tu producto favorito
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
                <p className="text-xs text-zinc-500">Cargando...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setView('guest-phone')}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg dark:shadow-none"
                >
                  <User size={18} />
                  Continuar como invitado
                  <ArrowRight size={16} />
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-white dark:bg-[#09090b] text-[10px] text-zinc-400 uppercase">O</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={!isFirebaseConfigured()}
                  className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-sm py-3.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Chrome size={18} className="text-blue-500" />
                  Iniciar con Google
                </button>
              </div>
            )}
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-zinc-400">
                Pedidos seguros • Pagos protegidos
              </p>
              <button
                onClick={handleAdminTrigger}
                className="p-1.5 text-zinc-300 hover:text-zinc-400 transition-colors"
              >
                <Shield size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GUEST PHONE VIEW
  if (view === 'guest-phone') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div 
          ref={modalRef}
          className="bg-white dark:bg-[#09090b] w-full max-w-sm rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>
          
          <button 
            onClick={() => setView('client-welcome')}
            className="absolute top-3 left-3 p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowRight size={16} className="rotate-180" />
          </button>
          
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          <div className="p-6 pt-10">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <Phone size={20} className="text-yellow-500" />
              </div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase">
                Datos de contacto
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1">
                Necesitamos tu número para coordinar la entrega
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
                <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
                <p className="text-xs text-zinc-500">Verificando...</p>
              </div>
            ) : (
              <form onSubmit={handleGuestLogin} className="space-y-3">
                {/* First Name */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 block">
                    Nombre
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ej: Juan"
                      className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"
                      maxLength={30}
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 block">
                    Apellido
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ej: Pérez García"
                      className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"
                      maxLength={40}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 block">
                    Número de celular
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="123-456-7890"
                      className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"
                      maxLength={12}
                    />
                  </div>
                  <p className="text-[9px] text-zinc-400 mt-1">
                    Te enviaremos actualizaciones de tu pedido por WhatsApp
                  </p>
                </div>

                {/* Bot Protection - Math Captcha (only after 2 attempts) */}
                {attempts >= 2 && (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 block">
                      Verificación de seguridad
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono bg-zinc-200 dark:bg-zinc-800 px-3 py-2 rounded-lg">
                        {captcha.question}
                      </span>
                      <input
                        type="text"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="?"
                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2 px-3 text-sm text-center text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400"
                        maxLength={2}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg dark:shadow-none disabled:opacity-50 mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="text-[9px] text-zinc-400 text-center">
                  Al continuar, aceptas recibir mensajes sobre tu pedido
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ADMIN LOGIN VIEW
  if (view === 'admin-login') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div 
          ref={modalRef}
          className="bg-white dark:bg-[#09090b] w-full max-w-xs rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative"
        >
          <div className="h-1 w-full bg-zinc-600"></div>
          
          <button 
            onClick={() => setView('client-welcome')}
            className="absolute top-3 left-3 p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowRight size={16} className="rotate-180" />
          </button>

          <div className="p-6 pt-10">
            <div className="text-center mb-6">
              <div className="w-10 h-10 bg-zinc-800 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Lock size={16} className="text-zinc-400" />
              </div>
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                Acceso Administrativo
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-[10px] text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">
                  Correo
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-zinc-500"
                  placeholder="admin@ejemplo.com"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-2.5 px-3 pr-10 text-xs text-white focus:outline-none focus:border-zinc-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs py-2.5 rounded-lg transition-colors mt-2"
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin mx-auto" />
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthModal;
