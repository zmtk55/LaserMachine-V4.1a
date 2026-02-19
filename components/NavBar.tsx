
import React, { useState } from 'react';
import { ShoppingBag, Sun, Moon, UserCircle, LogOut, LayoutDashboard, Package, Type, Menu, X } from 'lucide-react';
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
}

export const NavBar: React.FC<NavBarProps> = ({ user, cartCount, onNavigate, onLogin, onLogout, isDarkMode, toggleTheme, storeConfig }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNav = (view: ViewState) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <nav className="h-24 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl sticky top-0 z-[150] px-6 md:px-12 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-6 md:gap-16">
        <div onClick={() => handleNav('LANDING')} className="cursor-pointer flex items-center gap-4 group">
           {storeConfig.logoUrl ? (
               <img src={storeConfig.logoUrl} className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" alt="Logo" />
           ) : (
               <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-400 flex items-center justify-center font-black text-black text-sm md:text-base rounded-xl shadow-lg shadow-amber-400/20 transition-transform group-hover:rotate-3">LM</div>
           )}
           <span 
             className={`text-xl md:text-2xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase ${storeConfig.logoFont || 'nike-title'}`}
             style={{ fontFamily: storeConfig.logoFont ? undefined : 'Montserrat, sans-serif' }}
           >
             {storeConfig.businessName}
           </span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-100/50 dark:bg-zinc-800/50 p-1.5 rounded-full border border-zinc-200 dark:border-zinc-700">
           <button onClick={() => handleNav('SHOP')} className="px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:bg-white dark:hover:text-white dark:hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md">Catálogo</button>
           <button onClick={() => handleNav('FONTS_SHOWCASE')} className="px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:bg-white dark:hover:text-white dark:hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md">Fuentes</button>
           <button onClick={() => handleNav('CART')} className="px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:bg-white dark:hover:text-white dark:hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md">Carrito</button>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {/* Mobile Menu Toggle */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-3 text-zinc-500 hover:text-black dark:hover:text-white z-[160] relative transition-transform active:scale-95">
            {isMenuOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>

        <button onClick={toggleTheme} className="hidden md:flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-amber-400 transition-colors w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <button onClick={() => handleNav('CART')} className="relative w-12 h-12 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-90 group">
           <ShoppingBag size={22} className="group-hover:fill-current transition-all"/>
           {cartCount > 0 && (
             <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-black shadow-sm transform scale-100 animate-in zoom-in">
               {cartCount}
             </span>
           )}
        </button>

        {user ? (
           <div className="hidden md:flex items-center gap-4 pl-6 border-l border-zinc-200 dark:border-zinc-700">
             {user.role === UserRole.ADMIN ? (
                <button 
                  onClick={() => handleNav('ADMIN_DASHBOARD')} 
                  className="bg-amber-500 text-white border border-transparent px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <LayoutDashboard size={14}/> Admin
                </button>
             ) : (
                <button 
                  onClick={() => handleNav('CLIENT_DASHBOARD')} 
                  className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 hover:scale-105"
                >
                  <Package size={14}/> Mis Pedidos
                </button>
             )}
             <div className="flex items-center gap-2 cursor-pointer group relative">
                <img src={user.avatarUrl} className="w-11 h-11 rounded-full border-2 border-zinc-200 dark:border-zinc-700 group-hover:border-amber-400 transition-colors object-cover" alt="Avatar"/>
                <button onClick={onLogout} className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-red-500 p-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 transition-colors shadow-sm hover:scale-110" title="Cerrar Sesión"><LogOut size={12}/></button>
             </div>
           </div>
        ) : (
           <button onClick={onLogin} className="hidden md:flex text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 items-center gap-2 transition-all px-6 py-3 hover:bg-amber-500 hover:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-transparent">
             <UserCircle size={18} /> Login
           </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
          <div className="fixed inset-0 top-0 w-full h-screen bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl z-[150] flex flex-col p-10 pt-32 gap-8 animate-in slide-in-from-right duration-300 md:hidden">
              <button onClick={() => handleNav('SHOP')} className="text-left text-4xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white border-b-2 border-zinc-200 dark:border-zinc-800 pb-6 hover:pl-4 hover:text-amber-500 transition-all">Catálogo</button>
              <button onClick={() => handleNav('FONTS_SHOWCASE')} className="text-left text-4xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white border-b-2 border-zinc-200 dark:border-zinc-800 pb-6 hover:pl-4 hover:text-amber-500 transition-all">Fuentes</button>
              
              {user ? (
                  <>
                    <button onClick={() => handleNav(user.role === UserRole.ADMIN ? 'ADMIN_DASHBOARD' : 'CLIENT_DASHBOARD')} className="text-left text-4xl font-black uppercase tracking-tighter text-amber-500 border-b-2 border-zinc-200 dark:border-zinc-800 pb-6 hover:pl-4 transition-all">
                        {user.role === UserRole.ADMIN ? 'Panel Admin' : 'Mis Pedidos'}
                    </button>
                    <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="text-left font-bold uppercase tracking-widest text-red-500 py-4 text-sm hover:pl-2 transition-all">Cerrar Sesión</button>
                  </>
              ) : (
                  <button onClick={() => { onLogin(); setIsMenuOpen(false); }} className="text-left text-4xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white border-b-2 border-zinc-200 dark:border-zinc-800 pb-6 hover:pl-4 hover:text-amber-500 transition-all">Iniciar Sesión</button>
              )}
              <div className="mt-auto flex justify-center">
                  <button onClick={toggleTheme} className="p-6 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:scale-110 transition-transform shadow-lg">{isDarkMode ? <Sun size={32}/> : <Moon size={32}/>}</button>
              </div>
          </div>
      )}
    </nav>
  );
};
