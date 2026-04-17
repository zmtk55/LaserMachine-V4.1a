
import React, { useState } from 'react';
import { ShoppingBag, Sun, Moon, UserCircle, LogOut, LayoutDashboard, Package, Type, Menu, X, Bell, Sparkles, Palette, ShoppingCart, Shield, Settings, Users, Calendar, DollarSign, Home, List, PenTool, Building2 } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useCartPanel } from '../contexts/CartContext';
import { User, ViewState, StoreConfig, UserRole } from '../types';

interface NavBarProps {
  user: User | null;
  cartCount: number;
  onNavigate: (view: ViewState) => void;
  onLogin: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  storeConfig: StoreConfig;
  currentView?: ViewState;
  adminActiveTab?: string;
}

export const NavBar: React.FC<NavBarProps> = ({ user, cartCount, onNavigate, onLogin, onLogout, isDarkMode, toggleTheme, storeConfig, currentView, adminActiveTab }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setIsCartOpen } = useCartPanel();
  
  // Get page title based on current view
  const getPageTitle = (): string => {
    // If in admin dashboard, show the active tab name
    if (currentView === 'ADMIN_DASHBOARD' && adminActiveTab) {
      switch (adminActiveTab) {
        case 'DASHBOARD': return 'Dashboard';
        case 'ORDERS': return 'Órdenes';
        case 'CALENDAR': return 'Calendario';
        case 'INVENTORY': return 'Inventario';
        case 'CLIENTS': return 'CRM Clientes';
        case 'FONTS': return 'Fuentes';
        case 'GALERIA': return 'Galería';
        case 'FINANCE': return 'Finanzas';
        case 'SETTINGS': return 'Configuración';
        case 'CONTENT': return 'Contenido';
        case 'PRODUCTION': return 'Producción';
        default: return 'Dashboard';
      }
    }
    
    switch (currentView) {
      case 'LANDING': return '';
      case 'SHOP': return 'Catálogo';
      case 'CART': return 'Carrito';
      case 'CUSTOMIZER': return 'Diseñar';
      case 'FONTS_SHOWCASE': return 'Fuentes';
      case 'ADMIN_DASHBOARD': return 'Dashboard';
      case 'CLIENT_DASHBOARD': return 'Mis Pedidos';
      case 'PUBLIC_TRACKING': return 'Rastrear';
      default: return '';
    }
  };
  const { unreadCount, setIsPanelOpen } = useNotifications();

  const handleNav = (view: ViewState) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <nav className="h-16 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl sticky top-0 z-[150] px-4 md:px-8 flex items-center justify-between transition-all duration-300" aria-label="Navegación principal">
      <div className="flex items-center gap-4 md:gap-8">
        <button type="button" onClick={() => handleNav('LANDING')} aria-label="Ir al inicio" className="cursor-pointer flex items-center gap-4 group bg-transparent border-0 p-0 text-left">
           {storeConfig.logoUrl ? (
               <img src={storeConfig.logoUrl} className="h-10 md:h-12 w-auto object-contain" alt="Logo" />
           ) : (
               <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500 flex items-center justify-center font-black text-black text-sm md:text-base rounded-xl shadow-lg">LM</div>
           )}
           <span 
             className={`text-xl md:text-2xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase ${storeConfig.logoFont || 'nike-title'}`}
             style={{ fontFamily: storeConfig.logoFont ? undefined : 'Plus Jakarta Sans, sans-serif' }}
           >
             {storeConfig.businessName}
           </span>
        </button>
        
        {/* Page Title - Between logo and menu - BIGGER & AMBER */}
        {getPageTitle() && (
          <div className="hidden md:flex items-center">
            <div className="h-8 w-px bg-zinc-300 dark:bg-zinc-700 mx-5" />
            <span className="text-xl md:text-2xl font-black text-amber-500 uppercase tracking-tight">
              {getPageTitle()}
            </span>
          </div>
        )}
        
        {/* Desktop Menu - Solo visible con login */}
        {user && (
          <div className="hidden md:flex items-center gap-2 bg-zinc-100/50 dark:bg-zinc-800/50 p-1.5 rounded-full border border-zinc-200 dark:border-zinc-700">
             <button type="button" onClick={() => handleNav('SHOP')} aria-label="Ir al catálogo" className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:bg-white dark:hover:text-white dark:hover:bg-zinc-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95">
               <List size={14} /> Catálogo
             </button>
             <button type="button" onClick={() => handleNav('FONTS_SHOWCASE')} aria-label="Ver fuentes" className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:bg-white dark:hover:text-white dark:hover:bg-zinc-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95">
               <Palette size={16} /> Fuentes
             </button>
             <button type="button" onClick={() => handleNav('CUSTOMIZER')} aria-label="Abrir personalizador" className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-400 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95">
               <PenTool size={14} /> Personalizar
             </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {/* Mobile Menu Toggle */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"} className="md:hidden p-3 text-zinc-500 hover:text-black dark:hover:text-white z-[160] relative transition-all duration-200 active:scale-95">
          {isMenuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>

        <button onClick={toggleTheme} aria-label="Cambiar tema" className="hidden md:flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-amber-400 transition-all duration-200 w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {/* Notification Bell */}
        <button
          onClick={() => setIsPanelOpen(true)}
          aria-label="Notificaciones"
          className="relative flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all duration-200 w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 animate-in zoom-in">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        
        {/* Cart Button - Opens slide panel */}
        <button
          onClick={() => setIsCartOpen(true)}
          aria-label="Carrito de compras"
          className="relative flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all duration-200 w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95"
        >
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 animate-in zoom-in">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </button>

        {user ? (
           <div className="hidden md:flex items-center gap-4 pl-6 border-l border-zinc-200 dark:border-zinc-700">
             {user.role === UserRole.ADMIN ? (
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => handleNav('ADMIN_DASHBOARD')} 
                    aria-label="Abrir panel de administración"
                    className="bg-amber-500 text-white border border-transparent px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 hover:shadow-lg transition-all duration-200 flex items-center gap-2 active:scale-95"
                  >
                    <Home size={14}/> Admin
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleNav('CLIENT_DASHBOARD')} 
                    aria-label="Abrir vista portal cliente"
                    className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200 flex items-center gap-2 active:scale-95"
                  >
                    <Shield size={14}/> Vista Cliente
                  </button>
                </div>
             ) : user.role === UserRole.BUSINESS ? (
                <button 
                  type="button"
                  onClick={() => handleNav('BUSINESS_PORTAL')} 
                  aria-label="Abrir portal empresarial"
                  className="bg-violet-500 text-white border border-transparent px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-400 hover:shadow-lg transition-all duration-200 flex items-center gap-2 active:scale-95"
                >
                  <Building2 size={14}/> Portal Empresa
                </button>
             ) : (
                <button 
                  type="button"
                  onClick={() => handleNav('CLIENT_DASHBOARD')} 
                  aria-label="Abrir mis pedidos"
                  className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200 flex items-center gap-2 active:scale-95"
                >
                  <Shield size={14}/> Mis Pedidos
                </button>
             )}
             <div className="flex items-center gap-2 cursor-pointer group relative">
                 <img src={user.avatarUrl} className="w-11 h-11 rounded-full border-2 border-zinc-200 dark:border-zinc-700 group-hover:border-amber-400 transition-colors object-cover" alt={`Avatar de ${user.name}`}/>
                <button onClick={onLogout} className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-red-500 p-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 transition-all duration-200 shadow-sm active:scale-95" title="Cerrar Sesión"><LogOut size={12}/></button>
             </div>
           </div>
        ) : (
           <button onClick={onLogin} aria-label="Iniciar sesión" className="hidden md:flex text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 items-center gap-2 transition-all duration-200 px-6 py-3 hover:bg-amber-500 hover:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-transparent active:scale-95">
             <UserCircle size={18} /> Login
           </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
          <div className="fixed inset-0 top-0 w-full h-screen bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl z-[150] flex flex-col p-10 pt-32 gap-8 animate-in slide-in-from-right duration-300 md:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
              {user ? (
                  <>
                    <button onClick={() => handleNav('SHOP')} className="text-left text-4xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white border-b-2 border-zinc-200 dark:border-zinc-800 pb-6 hover:pl-4 hover:text-amber-500 transition-all flex items-center gap-4">
                      <List size={24} /> Catálogo
                    </button>
                    <button onClick={() => handleNav('FONTS_SHOWCASE')} className="text-left text-4xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white border-b-2 border-zinc-200 dark:border-zinc-800 pb-6 hover:pl-4 hover:text-amber-500 transition-all flex items-center gap-4">
                      <Palette size={32} /> Fuentes
                    </button>
                    <button onClick={() => handleNav('CUSTOMIZER')} className="text-left text-4xl font-black uppercase tracking-tighter text-amber-500 border-b-2 border-zinc-200 dark:border-zinc-800 pb-6 hover:pl-4 transition-all flex items-center gap-4">
                      <PenTool size={24} /> Personalizar
                    </button>
                    {user.role === UserRole.ADMIN ? (
                      <>
                        <button onClick={() => handleNav('ADMIN_DASHBOARD')} className="text-left text-4xl font-black uppercase tracking-tighter text-amber-500 border-b-2 border-zinc-200 dark:border-zinc-800 pb-6 hover:pl-4 transition-all flex items-center gap-4">
                          <Home size={32} /> Panel Admin
                        </button>
                        <button onClick={() => handleNav('CLIENT_DASHBOARD')} className="text-left text-4xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white border-b-2 border-zinc-200 dark:border-zinc-800 pb-6 hover:pl-4 hover:text-amber-500 transition-all flex items-center gap-4">
                          <Shield size={32} /> Vista Cliente
                        </button>
                      </>
                    ) : user.role === UserRole.BUSINESS ? (
                      <button onClick={() => handleNav('BUSINESS_PORTAL')} className="text-left text-4xl font-black uppercase tracking-tighter text-violet-500 border-b-2 border-zinc-200 dark:border-zinc-800 pb-6 hover:pl-4 transition-all flex items-center gap-4">
                        <Building2 size={32} /> Portal Empresa
                      </button>
                    ) : (
                      <button onClick={() => handleNav('CLIENT_DASHBOARD')} className="text-left text-4xl font-black uppercase tracking-tighter text-amber-500 border-b-2 border-zinc-200 dark:border-zinc-800 pb-6 hover:pl-4 transition-all flex items-center gap-4">
                        <Shield size={32} /> Mis Pedidos
                      </button>
                    )}
                    <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="text-left text-[10px] font-black uppercase tracking-widest text-red-500 py-4 hover:pl-2 transition-all duration-200 flex items-center gap-4 active:scale-95">
                      <LogOut size={24} /> Cerrar Sesión
                    </button>
                  </>
              ) : (
                  <button onClick={() => { onLogin(); setIsMenuOpen(false); }} className="text-left text-4xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white border-b-2 border-zinc-200 dark:border-zinc-800 pb-6 hover:pl-4 hover:text-amber-500 transition-all flex items-center gap-4">
                    <UserCircle size={32} /> Iniciar Sesión
                  </button>
              )}
              <div className="mt-auto flex justify-center">
                  <button onClick={toggleTheme} className="p-6 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:scale-110 transition-all duration-200 shadow-lg active:scale-95">{isDarkMode ? <Sun size={32}/> : <Moon size={32}/>}</button>
              </div>
          </div>
      )}
    </nav>
  );
};
