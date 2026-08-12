import React, { useState, useMemo } from 'react';
import { 
  Ticket, Plus, Search, Trash2, Copy, ToggleLeft, ToggleRight, 
  Users, Globe, User, Gift, Star, TrendingUp, Calendar, Filter,
  CheckCircle, XCircle, RefreshCcw
} from 'lucide-react';
import { Coupon, StoreConfig } from '../types';

interface CouponManagerProps {
  coupons: Coupon[];
  onUpdateStoreConfig: (config: Partial<StoreConfig>) => void;
  clients?: any[];
}

type CouponFilter = 'TODOS' | 'GLOBALES' | 'PERSONALES' | 'REFERIDOS';

export const CouponManager: React.FC<CouponManagerProps> = ({ 
  coupons, 
  onUpdateStoreConfig,
  clients = []
}) => {
  const [filter, setFilter] = useState<CouponFilter>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [newCoupon, setNewCoupon] = useState({ 
    code: '', 
    discountPercent: 10, 
    maxUses: 100, 
    expiryDate: '', 
    assignedToPhone: '',
    type: 'GLOBAL' as 'GLOBAL' | 'PERSONAL'
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const global = coupons.filter(c => !c.assignedToPhone && !c.referrerUserId);
    const personal = coupons.filter(c => c.assignedToPhone && !c.referrerUserId);
    const referrals = coupons.filter(c => c.referrerUserId);
    const active = coupons.filter(c => c.active && (!c.expiryDate || new Date(c.expiryDate) > now));
    const expired = coupons.filter(c => c.expiryDate && new Date(c.expiryDate) <= now);
    const totalUses = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    
    return {
      total: coupons.length,
      global: global.length,
      personal: personal.length,
      referrals: referrals.length,
      active: active.length,
      expired: expired.length,
      totalUses,
      utilization: coupons.length > 0 ? Math.round((totalUses / coupons.reduce((sum, c) => sum + (c.maxUses === -1 ? 100 : c.maxUses), 0)) * 100) : 0
    };
  }, [coupons]);

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      // Search filter
      if (searchQuery && !c.code.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Type filter
      switch (filter) {
        case 'GLOBALES':
          return !c.assignedToPhone && !c.referrerUserId;
        case 'PERSONALES':
          return c.assignedToPhone && !c.referrerUserId;
        case 'REFERIDOS':
          return !!c.referrerUserId;
        default:
          return true;
      }
    });
  }, [coupons, filter, searchQuery]);

  const handleCreateCoupon = () => {
    if (!newCoupon.code.trim()) return;
    
    const coupon: Coupon = {
      code: newCoupon.code.toUpperCase(),
      discountPercent: newCoupon.discountPercent,
      active: true,
      maxUses: newCoupon.maxUses,
      expiryDate: newCoupon.expiryDate || undefined,
      assignedToPhone: newCoupon.type === 'PERSONAL' ? newCoupon.assignedToPhone : undefined,
      createdAt: new Date().toISOString(),
      usedCount: 0
    };

    onUpdateStoreConfig({ coupons: [...coupons, coupon] });
    setNewCoupon({ 
      code: '', 
      discountPercent: 10, 
      maxUses: 100, 
      expiryDate: '', 
      assignedToPhone: '',
      type: 'GLOBAL'
    });
    setShowCreateForm(false);
  };

  const handleToggleActive = (code: string) => {
    onUpdateStoreConfig({
      coupons: coupons.map(c => 
        c.code === code ? { ...c, active: !c.active } : c
      )
    });
  };

  const handleDelete = (code: string) => {
    if (confirm('¿Eliminar este cupón?')) {
      onUpdateStoreConfig({
        coupons: coupons.filter(c => c.code !== code)
      });
    }
  };

  const handleDuplicate = (coupon: Coupon) => {
    const newCode = `${coupon.code}-COPY`;
    onUpdateStoreConfig({
      coupons: [...coupons, { 
        ...coupon, 
        code: newCode, 
        active: true, 
        usedCount: 0,
        createdAt: new Date().toISOString()
      }]
    });
  };

  const getClientName = (phone: string) => {
    const client = clients?.find(c => c.phone === phone);
    return client?.name || phone;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) <= new Date();
  };

  const isActive = (coupon: Coupon) => {
    if (!coupon.active) return false;
    if (isExpired(coupon.expiryDate)) return false;
    if (coupon.maxUses !== -1 && (coupon.usedCount || 0) >= coupon.maxUses) return false;
    return true;
  };

  const filterButtons: { key: CouponFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'TODOS', label: 'Todos', icon: <Ticket size={14} /> },
    { key: 'GLOBALES', label: 'Globales', icon: <Globe size={14} /> },
    { key: 'PERSONALES', label: 'Personales', icon: <User size={14} /> },
    { key: 'REFERIDOS', label: 'Referidos', icon: <Gift size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 dark:from-amber-500/10 dark:to-amber-600/5 p-4 rounded-xl border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Ticket size={14} className="text-amber-500" />
            <span className="text-[10px] font-bold uppercase text-amber-500">Total Cupones</span>
          </div>
          <p className="text-2xl font-black text-amber-500">{stats.total}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 dark:from-green-500/10 dark:to-green-600/5 p-4 rounded-xl border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={14} className="text-green-500" />
            <span className="text-[10px] font-bold uppercase text-green-500">Activos</span>
          </div>
          <p className="text-2xl font-black text-green-500">{stats.active}</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 dark:from-red-500/10 dark:to-red-600/5 p-4 rounded-xl border border-red-500/20">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={14} className="text-red-500" />
            <span className="text-[10px] font-bold uppercase text-red-500">Expirados</span>
          </div>
          <p className="text-2xl font-black text-red-500">{stats.expired}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 dark:from-blue-500/10 dark:to-blue-600/5 p-4 rounded-xl border border-blue-500/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-blue-500" />
            <span className="text-[10px] font-bold uppercase text-blue-500">Usos Totales</span>
          </div>
          <p className="text-2xl font-black text-blue-500">{stats.totalUses}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 dark:from-purple-500/10 dark:to-purple-600/5 p-4 rounded-xl border border-purple-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Star size={14} className="text-purple-500" />
            <span className="text-[10px] font-bold uppercase text-purple-500">Utilización</span>
          </div>
          <p className="text-2xl font-black text-purple-500">{stats.utilization}%</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-2 rounded-md text-xs font-bold uppercase flex items-center gap-1.5 transition-all ${
                filter === btn.key 
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {btn.icon}
              {btn.label}
              {btn.key === 'TODOS' && <span className="ml-1 opacity-60">({stats.total})</span>}
              {btn.key === 'GLOBALES' && <span className="ml-1 opacity-60">({stats.global})</span>}
              {btn.key === 'PERSONALES' && <span className="ml-1 opacity-60">({stats.personal})</span>}
              {btn.key === 'REFERIDOS' && <span className="ml-1 opacity-60">({stats.referrals})</span>}
            </button>
          ))}
        </div>
        
        <div className="flex-1" />
        
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar cupón..."
            className="pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold outline-none focus:border-amber-500 w-48"
          />
        </div>
        
        {/* Create Button */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-system btn-system-primary px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors"
        >
          <Plus size={14} />
          Nuevo Cupón
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-zinc-100 dark:bg-zinc-800/50 p-5 rounded-xl border-2 border-dashed border-amber-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Plus size={16} className="text-amber-500" />
            <span className="text-sm font-bold text-zinc-900 dark:text-white">Crear Nuevo Cupón</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            {/* Type Selection */}
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Tipo</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewCoupon({ ...newCoupon, type: 'GLOBAL', assignedToPhone: '' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all ${
                    newCoupon.type === 'GLOBAL'
                      ? 'bg-amber-500 text-zinc-900'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'
                  }`}
                >
                  <Globe size={12} /> Global
                </button>
                <button
                  type="button"
                  onClick={() => setNewCoupon({ ...newCoupon, type: 'PERSONAL' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all ${
                    newCoupon.type === 'PERSONAL'
                      ? 'bg-amber-500 text-zinc-900'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'
                  }`}
                >
                  <User size={12} /> Personal
                </button>
              </div>
            </div>
            
            {/* Code */}
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Código</label>
              <input
                value={newCoupon.code}
                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 p-2.5 rounded-lg text-sm font-bold uppercase outline-none focus:border-amber-500 dark:text-white"
                placeholder="CODIGO2024"
              />
            </div>
            
            {/* Discount */}
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">% Desc.</label>
              <input
                type="number"
                value={newCoupon.discountPercent}
                onChange={e => setNewCoupon({ ...newCoupon, discountPercent: Number(e.target.value) })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-amber-500 dark:text-white"
                min={1}
                max={100}
              />
            </div>
            
            {/* Max Uses */}
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Usos Máx.</label>
              <input
                type="number"
                value={newCoupon.maxUses}
                onChange={e => setNewCoupon({ ...newCoupon, maxUses: Number(e.target.value) })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-amber-500 dark:text-white"
                min={-1}
              />
            </div>
            
            {/* Phone (only for personal) */}
            {newCoupon.type === 'PERSONAL' && (
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Teléfono</label>
                <input
                  value={newCoupon.assignedToPhone}
                  onChange={e => setNewCoupon({ ...newCoupon, assignedToPhone: e.target.value })}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 p-2.5 rounded-lg text-sm font-mono outline-none focus:border-amber-500 dark:text-white"
                  placeholder="+52..."
                />
              </div>
            )}
            
            {/* Expiry Date */}
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Expiración</label>
              <input
                type="date"
                value={newCoupon.expiryDate}
                onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 p-2.5 rounded-lg text-sm font-bold outline-none focus:border-amber-500 dark:text-white"
              />
            </div>
            
            {/* Submit */}
            <div className="md:col-span-6 flex justify-end gap-3 mt-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCoupon}
                disabled={!newCoupon.code.trim()}
                className="bg-green-500 hover:bg-green-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors"
              >
                <CheckCircle size={14} />
                Crear Cupón
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon List */}
      <div className="space-y-3">
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <Ticket size={48} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
            <p className="text-zinc-500 font-bold text-sm">No se encontraron cupones</p>
            <p className="text-zinc-400 text-xs mt-1">Crea un nuevo cupón para empezar</p>
          </div>
        ) : (
          filteredCoupons.map(coupon => {
            const active = isActive(coupon);
            const expired = isExpired(coupon.expiryDate);
            const isPersonal = !!coupon.assignedToPhone;
            const isReferral = !!coupon.referrerUserId;
            
            return (
              <div
                key={coupon.code}
                className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                  active 
                    ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700' 
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Code & Type */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isReferral 
                        ? 'bg-purple-100 dark:bg-purple-500/20' 
                        : isPersonal 
                          ? 'bg-blue-100 dark:bg-blue-500/20' 
                          : 'bg-amber-100 dark:bg-amber-500/20'
                    }`}>
                      {isReferral ? (
                        <Gift size={20} className="text-purple-500" />
                      ) : isPersonal ? (
                        <User size={20} className="text-blue-500" />
                      ) : (
                        <Globe size={20} className="text-amber-500" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-zinc-900 dark:text-white tracking-wider">
                          {coupon.code}
                        </span>
                        {active && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-[10px] font-bold uppercase rounded-full">
                            Activo
                          </span>
                        )}
                        {expired && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[10px] font-bold uppercase rounded-full">
                            Expirado
                          </span>
                        )}
                        {!active && !expired && (
                          <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 text-[10px] font-bold uppercase rounded-full">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                          {coupon.discountPercent}% DESC
                        </span>
                        {isPersonal && (
                          <span className="text-xs text-blue-500 flex items-center gap-1">
                            <User size={10} /> {getClientName(coupon.assignedToPhone!)}
                          </span>
                        )}
                        {isReferral && (
                          <span className="text-xs text-purple-500 flex items-center gap-1">
                            <Gift size={10} /> Programa de Referidos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Center: Stats */}
                  <div className="hidden md:flex items-center gap-6 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Usos</p>
                      <p className="font-black text-zinc-900 dark:text-white">
                        {coupon.usedCount || 0}
                        <span className="text-zinc-400 font-normal"> / {coupon.maxUses === -1 ? '∞' : coupon.maxUses}</span>
                      </p>
                    </div>
                    {coupon.expiryDate && (
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Expira</p>
                        <p className={`font-bold text-xs ${expired ? 'text-red-500' : 'text-zinc-600 dark:text-zinc-300'}`}>
                          {new Date(coupon.expiryDate).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(coupon.code)}
                      className={`p-2 rounded-lg transition-colors ${
                        coupon.active 
                          ? 'text-system-success hover:bg-system-success/10' 
                          : 'text-zinc-300 dark:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                      title={coupon.active ? 'Desactivar' : 'Activar'}
                    >
                      {coupon.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    
                    <button
                      onClick={() => handleDuplicate(coupon)}
                      className="p-2 text-zinc-400 hover:text-system-info hover:bg-system-info/10 rounded-lg transition-colors"
                      title="Duplicar"
                    >
                      <Copy size={18} />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(coupon.code)}
                      className="p-2 text-zinc-400 hover:text-system-danger hover:bg-system-error/10 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Mobile Stats */}
                <div className="md:hidden flex items-center justify-between mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-zinc-500">
                      Usos: <span className="font-bold text-zinc-900 dark:text-white">{coupon.usedCount || 0}</span>
                      {coupon.maxUses !== -1 && <span className="text-zinc-400"> / {coupon.maxUses}</span>}
                    </span>
                    {coupon.expiryDate && (
                      <span className="text-xs text-zinc-500">
                        Expira: <span className={`font-bold ${expired ? 'text-red-500' : ''}`}>
                          {new Date(coupon.expiryDate).toLocaleDateString('es-MX')}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      {coupons.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            Mostrando <span className="font-bold text-zinc-700 dark:text-zinc-300">{filteredCoupons.length}</span> de{' '}
            <span className="font-bold text-zinc-700 dark:text-zinc-300">{stats.total}</span> cupones
          </p>
          <p className="text-xs text-zinc-400">
            {stats.global} globales • {stats.personal} personales • {stats.referrals} referidos
          </p>
        </div>
      )}
    </div>
  );
};

export default CouponManager;
