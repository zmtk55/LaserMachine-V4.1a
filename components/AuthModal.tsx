import {AccountAccessForm} from './AccountAccessForm';
import {changeRecoveredPassword} from '../services/accountAccess';
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Phone, User, ArrowRight, AlertCircle, CheckCircle, 
  Loader2, Shield, Lock, Eye, EyeOff, Mail
} from 'lucide-react';
import { 
  createGuestUser,
  checkRateLimit,
  recordAttempt
} from '../services/supabaseAuth';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
  initialView?: AuthView;
}

type AuthView = 'client-welcome' | 'guest-phone' | 'admin-login' | 'account-access' | 'reset-password';

// Simple math captcha for bot protection
const generateMathCaptcha = () => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `${a} + ${b} = ?`, answer: (a + b).toString() };
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, initialView }) => {
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
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetDone, setResetDone] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && initialView) {
      setView(initialView);
      setError('');
      setResetDone(false);
      setResetPassword('');
      setResetConfirm('');
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
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
      return () => clearTimeout(t);
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

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = document.querySelector<HTMLElement>('.lm-auth-overlay [role="dialog"]');
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]') || []);
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusable(), first = items[0], last = items[items.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, view, resetDone, isLoading]);

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
      const { loginWithEmail } = await import('../services/supabaseAuth');
      const user = await loginWithEmail(adminEmail, adminPassword);
      
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

  if (view === 'reset-password') return (
    <div className="lm-auth-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
      <div role="dialog" aria-modal="true" aria-label="Nueva contraseña" className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white p-6 space-y-4">
        <h2 className="font-bold">Define tu nueva contraseña</h2>
        {resetDone ? (
          <>
            <p className="text-xs">Contraseña actualizada. Ya puedes iniciar sesión con ella.</p>
            <button onClick={() => setView('client-welcome')} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg dark:shadow-none disabled:opacity-50">Ir a iniciar sesión</button>
          </>
        ) : (
          <form className="space-y-3" onSubmit={async e => {
            e.preventDefault(); setError('');
            if (resetPassword !== resetConfirm) { setError('Las contraseñas no coinciden'); return; }
            setIsLoading(true);
            try { await changeRecoveredPassword(resetPassword); setResetDone(true); setResetPassword(''); setResetConfirm(''); }
            catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña'); }
            finally { setIsLoading(false); }
          }}>
            <label className="block text-sm">Nueva contraseña
              <input required type="password" minLength={12} value={resetPassword} onChange={e => setResetPassword(e.target.value)} autoComplete="new-password" className="mt-1 block w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"/>
            </label>
            <label className="block text-sm">Confirmar contraseña
              <input required type="password" minLength={12} value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} autoComplete="new-password" className="mt-1 block w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 px-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"/>
            </label>
            {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
            <button disabled={isLoading} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg dark:shadow-none disabled:opacity-50">{isLoading ? 'Guardando...' : 'Guardar contraseña'}</button>
          </form>
        )}
        <button onClick={onClose} className="w-full text-sm text-zinc-500 dark:text-zinc-400 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cerrar</button>
      </div>
    </div>
  );

  if(view==='account-access')return <div className="lm-auth-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"><div role="dialog" aria-modal="true" aria-label="Crear cuenta o recuperar acceso" className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"><button aria-label="Cerrar acceso" onClick={onClose} className="lm-auth-account-close"><X size={18}/></button><AccountAccessForm onBack={()=>setView('client-welcome')}/></div></div>;

  // CLIENT WELCOME VIEW
  if (view === 'client-welcome') {
    return (
      <div className="lm-auth-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div 
          ref={modalRef} role="dialog" aria-modal="true" aria-label="Bienvenido"
          className="bg-white dark:bg-[#09090b] w-full max-w-sm rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>
          
          <button 
            onClick={onClose} aria-label="Cerrar acceso"
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
                <p role="alert" className="text-[11px] text-red-700 dark:text-red-400">{error}</p>
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


              </div>
            )}
          </div>

          <div className="lm-auth-footer bg-zinc-50 dark:bg-zinc-900/50 p-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-zinc-400">
                Pago en el taller o por transferencia
              </p>
              <button
                onClick={() => setView('admin-login')}
                className="p-1.5 text-zinc-300 hover:text-zinc-400 transition-colors"
              >
                <Shield size={12} /> <span className="text-xs">Entrar con correo</span>
              </button>
              <button onClick={()=>setView('account-access')} className="block text-xs underline mt-2">Crear cuenta o recuperar acceso</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GUEST PHONE VIEW
  if (view === 'guest-phone') {
    return (
      <div className="lm-auth-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div 
          ref={modalRef} role="dialog" aria-modal="true" aria-label="Datos de contacto"
          className="bg-white dark:bg-[#09090b] w-full max-w-sm rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>
          
          <button 
            onClick={() => setView('client-welcome')} aria-label="Volver a bienvenida"
            className="absolute top-3 left-3 p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowRight size={16} className="rotate-180" />
          </button>
          
          <button 
            onClick={onClose} aria-label="Cerrar acceso"
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
                <p role="alert" className="text-[11px] text-red-700 dark:text-red-400">{error}</p>
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
                  <label htmlFor="auth-first-name" className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 block">
                    Nombre
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input id="auth-first-name"
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
                  <label htmlFor="auth-last-name" className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 block">
                    Apellido
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input id="auth-last-name"
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
                  <label htmlFor="auth-phone" className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 block">
                    Número de celular
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input id="auth-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="123-456-7890"
                      className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-yellow-400 transition-colors"
                      maxLength={12}
                    />
                  </div>
                  <p className="text-[9px] text-zinc-400 mt-1">
                    Usaremos este número para coordinar tu solicitud.
                  </p>
                </div>

                {/* Bot Protection - Math Captcha (only after 2 attempts) */}
                {attempts >= 2 && (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <label htmlFor="auth-verification" className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 block">
                      Verificación de seguridad
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono bg-zinc-200 dark:bg-zinc-800 px-3 py-2 rounded-lg">
                        {captcha.question}
                      </span>
                      <input id="auth-verification"
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
      <div className="lm-auth-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div 
          ref={modalRef} role="dialog" aria-modal="true" aria-label="Acceso con correo"
          className="lm-auth-email bg-white dark:bg-[#09090b] w-full max-w-xs rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative"
        >
          <div className="h-1 w-full bg-zinc-600"></div>
          
          <button 
            onClick={() => setView('client-welcome')} aria-label="Volver a bienvenida"
            className="absolute top-3 left-3 p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowRight size={16} className="rotate-180" />
          </button>

          <button onClick={onClose} aria-label="Cerrar acceso" className="absolute top-3 right-3 p-2 text-zinc-500"><X size={16}/></button>
          <div className="p-6 pt-10">
            <div className="text-center mb-6">
              <div className="w-10 h-10 bg-zinc-800 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Lock size={16} className="text-zinc-400" />
              </div>
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                Acceso con correo
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-900/20 border border-red-800 rounded-lg">
                <p role="alert" className="text-[10px] text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label htmlFor="auth-email" className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">
                  Correo
                </label>
                <input id="auth-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-zinc-500"
                  placeholder="correo@ejemplo.com" autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">
                  Contraseña
                </label>
                <div className="relative">
                  <input id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-2.5 px-3 pr-10 text-xs text-white focus:outline-none focus:border-zinc-500"
                    placeholder="••••••••" autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)} aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'} aria-pressed={showPassword}
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
