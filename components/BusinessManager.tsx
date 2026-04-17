import React, { useState, useMemo } from 'react';
import {
  Building2, Search, CheckCircle2, XCircle, Clock, Mail, Phone,
  User, Crown, CreditCard, Package, ChevronDown, ChevronUp,
  MoreHorizontal, Edit2, Trash2, Save, X, Plus, Download,
  MessageCircle, ExternalLink, Filter
} from 'lucide-react';
import { BusinessAccount, BusinessStatus, BusinessUser } from '../types';
import '../src/styles/business-portal-theme.css';

interface BusinessManagerProps {
  accounts: BusinessAccount[];
  onUpdateAccounts: (accounts: BusinessAccount[]) => void;
}

const STATUS_CONFIG: Record<BusinessStatus, { label: string; cls: string; icon: React.ElementType }> = {
  [BusinessStatus.PENDING]: { label: 'Pendiente', cls: 'bp-badge-accent', icon: Clock },
  [BusinessStatus.APPROVED]: { label: 'Aprobado', cls: 'bp-badge-success', icon: CheckCircle2 },
  [BusinessStatus.REJECTED]: { label: 'Rechazado', cls: 'bp-badge-error', icon: XCircle },
  [BusinessStatus.SUSPENDED]: { label: 'Suspendido', cls: 'bp-badge-muted', icon: XCircle },
};

const TIER_OPTIONS = [
  { value: 'NONE', label: 'Ninguno', percent: 0 },
  { value: 'BRONZE', label: 'Bronce', percent: 5 },
  { value: 'SILVER', label: 'Plata', percent: 10 },
  { value: 'GOLD', label: 'Oro', percent: 15 },
  { value: 'PLATINUM', label: 'Platino', percent: 20 },
];

const PAYMENT_TERMS = ['CONTADO', '15_DIAS', '30_DIAS', '60_DIAS'];

export const BusinessManager: React.FC<BusinessManagerProps> = ({ accounts, onUpdateAccounts }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BusinessStatus | 'ALL'>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<BusinessAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<BusinessAccount>>({});

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter(a => statusFilter === 'ALL' || a.status === statusFilter)
      .filter(a =>
        a.companyName.toLowerCase().includes(search.toLowerCase()) ||
        a.representativeName.toLowerCase().includes(search.toLowerCase()) ||
        a.representativeEmail.toLowerCase().includes(search.toLowerCase()) ||
        a.taxId.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [accounts, statusFilter, search]);

  const stats = useMemo(() => ({
    total: accounts.length,
    pending: accounts.filter(a => a.status === BusinessStatus.PENDING).length,
    approved: accounts.filter(a => a.status === BusinessStatus.APPROVED).length,
    totalSpent: accounts.filter(a => a.status === BusinessStatus.APPROVED).reduce((sum, a) => sum + (a.totalSpent || 0), 0),
  }), [accounts]);

  const updateAccount = (updated: BusinessAccount) => {
    onUpdateAccounts(accounts.map(a => a.id === updated.id ? updated : a));
    setSelectedAccount(updated);
  };

  const deleteAccount = (id: string) => {
    if (confirm('¿Eliminar esta empresa permanentemente?')) {
      onUpdateAccounts(accounts.filter(a => a.id !== id));
      setSelectedAccount(null);
    }
  };

  const startEdit = (account: BusinessAccount) => {
    setEditForm({ ...account });
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!selectedAccount || !editForm) return;
    const updated = { ...selectedAccount, ...editForm, updatedAt: new Date().toISOString() } as BusinessAccount;
    updateAccount(updated);
    setIsEditing(false);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

  // Detail view
  if (selectedAccount) {
    const statusCfg = STATUS_CONFIG[selectedAccount.status];
    const StatusIcon = statusCfg.icon;

    return (
      <div className="business-portal h-full overflow-y-auto bp-scrollbar p-6 md:p-10 bg-[var(--bp-bg)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => { setSelectedAccount(null); setIsEditing(false); }}
            className="flex items-center gap-2 text-sm font-semibold text-[var(--bp-text-secondary)] hover:text-[var(--bp-text-primary)] transition-colors"
          >
            ← Volver a empresas
          </button>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button onClick={() => startEdit(selectedAccount)} className="bp-btn bp-btn-secondary px-4 py-2">
                  <Edit2 size={16} /> Editar
                </button>
                <button onClick={() => deleteAccount(selectedAccount.id)} className="bp-btn px-4 py-2 bg-[var(--bp-error-bg)] text-[var(--bp-error)] border border-[var(--bp-error)]/30 hover:bg-[var(--bp-error)] hover:text-white transition-colors">
                  <Trash2 size={16} /> Eliminar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="bp-btn bp-btn-secondary px-4 py-2">
                  Cancelar
                </button>
                <button onClick={saveEdit} className="bp-btn bp-btn-primary px-4 py-2">
                  <Save size={16} /> Guardar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Company Header Card */}
        <div className="bp-card p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bp-accent-bg)] flex items-center justify-center">
                <Building2 size={32} className="text-[var(--bp-accent)]" />
              </div>
              <div>
                {isEditing ? (
                  <input
                    value={editForm.companyName || ''}
                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    className="bp-input text-lg font-bold"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>{selectedAccount.companyName}</h1>
                )}
                <p className="text-sm text-[var(--bp-text-tertiary)] font-medium">RFC: {selectedAccount.taxId}</p>
              </div>
            </div>
            <div className={`bp-badge px-4 py-2 text-xs ${statusCfg.cls}`}>
              <StatusIcon size={16} />
              {statusCfg.label}
            </div>
          </div>

          {/* Status Actions */}
          {!isEditing && (
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-[var(--bp-border)]">
              {selectedAccount.status === BusinessStatus.PENDING && (
                <>
                  <button onClick={() => updateAccount({ ...selectedAccount, status: BusinessStatus.APPROVED, updatedAt: new Date().toISOString() })} className="bp-btn bp-btn-primary px-4 py-2">
                    <CheckCircle2 size={16} /> Aprobar solicitud
                  </button>
                  <button onClick={() => updateAccount({ ...selectedAccount, status: BusinessStatus.REJECTED, updatedAt: new Date().toISOString() })} className="bp-btn px-4 py-2 bg-[var(--bp-error-bg)] text-[var(--bp-error)] border border-[var(--bp-error)]/30 hover:bg-[var(--bp-error)] hover:text-white transition-colors">
                    <XCircle size={16} /> Rechazar
                  </button>
                </>
              )}
              {selectedAccount.status === BusinessStatus.APPROVED && (
                <button onClick={() => updateAccount({ ...selectedAccount, status: BusinessStatus.SUSPENDED, updatedAt: new Date().toISOString() })} className="bp-btn bp-btn-secondary px-4 py-2">
                  Suspender cuenta
                </button>
              )}
              {selectedAccount.status === BusinessStatus.SUSPENDED && (
                <button onClick={() => updateAccount({ ...selectedAccount, status: BusinessStatus.APPROVED, updatedAt: new Date().toISOString() })} className="bp-btn bp-btn-primary px-4 py-2">
                  <CheckCircle2 size={16} /> Reactivar cuenta
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Representative Info */}
          <div className="bp-card p-6">
            <h3 className="font-bold text-[var(--bp-text-primary)] mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>
              <User size={18} className="text-[var(--bp-accent)]" /> Representante
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Nombre', key: 'representativeName' },
                { label: 'Teléfono', key: 'representativePhone' },
                { label: 'Email', key: 'representativeEmail' },
              ].map((field) => (
                <div key={field.key}>
                  <p className="text-xs text-[var(--bp-text-tertiary)] font-semibold uppercase">{field.label}</p>
                  {isEditing ? (
                    <input
                      value={(editForm as any)[field.key] || ''}
                      onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                      className="bp-input mt-1"
                    />
                  ) : (
                    <p className="font-semibold text-[var(--bp-text-primary)]">{(selectedAccount as any)[field.key]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Commercial Terms */}
          <div className="bp-card p-6">
            <h3 className="font-bold text-[var(--bp-text-primary)] mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>
              <Crown size={18} className="text-[var(--bp-accent)]" /> Términos comerciales
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[var(--bp-text-tertiary)] font-semibold uppercase">Tier de descuento</p>
                {isEditing ? (
                  <select
                    value={editForm.discountTier || selectedAccount.discountTier}
                    onChange={(e) => setEditForm({ ...editForm, discountTier: e.target.value as any })}
                    className="bp-input mt-1"
                  >
                    {TIER_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label} ({t.percent}%)</option>
                    ))}
                  </select>
                ) : (
                  <p className="font-semibold text-[var(--bp-text-primary)]">
                    {TIER_OPTIONS.find(t => t.value === selectedAccount.discountTier)?.label || selectedAccount.discountTier} ({TIER_OPTIONS.find(t => t.value === selectedAccount.discountTier)?.percent || 0}%)
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-[var(--bp-text-tertiary)] font-semibold uppercase">Términos de pago</p>
                {isEditing ? (
                  <select
                    value={editForm.paymentTerms || selectedAccount.paymentTerms}
                    onChange={(e) => setEditForm({ ...editForm, paymentTerms: e.target.value as any })}
                    className="bp-input mt-1"
                  >
                    {PAYMENT_TERMS.map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                ) : (
                  <p className="font-semibold text-[var(--bp-text-primary)]">{selectedAccount.paymentTerms.replace('_', ' ')}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-[var(--bp-text-tertiary)] font-semibold uppercase">Límite de crédito</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.creditLimit ?? selectedAccount.creditLimit}
                    onChange={(e) => setEditForm({ ...editForm, creditLimit: Number(e.target.value) })}
                    className="bp-input mt-1"
                  />
                ) : (
                  <p className="font-semibold text-[var(--bp-text-primary)]">{formatCurrency(selectedAccount.creditLimit)}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-[var(--bp-text-tertiary)] font-semibold uppercase">Crédito usado</p>
                <p className="font-semibold text-[var(--bp-text-primary)]">{formatCurrency(selectedAccount.creditUsed)}</p>
                <div className="mt-2 h-2 bg-[var(--bp-bg-elevated)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--bp-accent)] rounded-full" style={{ width: `${Math.min(100, (selectedAccount.creditUsed / Math.max(1, selectedAccount.creditLimit)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Notes */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bp-card p-6 text-center">
            <p className="text-xs text-[var(--bp-text-tertiary)] font-semibold uppercase">Total pedidos</p>
            <p className="text-3xl font-bold text-[var(--bp-text-primary)] mt-1" style={{ fontFamily: 'var(--bp-font-heading)' }}>{selectedAccount.totalOrders || 0}</p>
          </div>
          <div className="bp-card p-6 text-center">
            <p className="text-xs text-[var(--bp-text-tertiary)] font-semibold uppercase">Total comprado</p>
            <p className="text-3xl font-bold text-[var(--bp-text-primary)] mt-1" style={{ fontFamily: 'var(--bp-font-heading)' }}>{formatCurrency(selectedAccount.totalSpent || 0)}</p>
          </div>
          <div className="bp-card p-6 text-center">
            <p className="text-xs text-[var(--bp-text-tertiary)] font-semibold uppercase">Miembro desde</p>
            <p className="text-lg font-bold text-[var(--bp-text-primary)] mt-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>{formatDate(selectedAccount.createdAt)}</p>
          </div>
        </div>

        {/* Notes */}
        <div className="bp-card p-6 mt-6">
          <h3 className="font-bold text-[var(--bp-text-primary)] mb-3" style={{ fontFamily: 'var(--bp-font-heading)' }}>Notas internas</h3>
          {isEditing ? (
            <textarea
              value={editForm.notes ?? selectedAccount.notes ?? ''}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows={4}
              className="bp-input"
            />
          ) : (
            <p className="text-sm text-[var(--bp-text-secondary)] whitespace-pre-line">
              {selectedAccount.notes || 'Sin notas internas.'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="business-portal dark h-full overflow-y-auto bp-scrollbar p-6 md:p-10 bg-[var(--bp-bg)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>Empresas</h1>
          <p className="text-sm text-[var(--bp-text-secondary)]">Gestiona cuentas corporativas, solicitudes y términos comerciales</p>
        </div>
        <button
          onClick={() => {
            const newAccount: BusinessAccount = {
              id: `BUS-${Date.now()}`,
              companyName: 'Nueva Empresa',
              taxId: '',
              representativeName: '',
              representativePhone: '',
              representativeEmail: '',
              discountTier: 'NONE',
              creditLimit: 0,
              creditUsed: 0,
              paymentTerms: 'CONTADO',
              brandKit: { logoUrl: '', approvedFonts: [], approvedColors: [] },
              assignedRepId: '',
              users: [],
              status: BusinessStatus.PENDING,
              notes: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              totalOrders: 0,
              totalSpent: 0,
            };
            onUpdateAccounts([newAccount, ...accounts]);
            setSelectedAccount(newAccount);
            setIsEditing(true);
          }}
          className="bp-btn bp-btn-primary px-4 py-2.5"
        >
          <Plus size={18} /> Nueva empresa
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total empresas', value: stats.total, icon: Building2 },
          { label: 'Pendientes', value: stats.pending, icon: Clock },
          { label: 'Aprobadas', value: stats.approved, icon: CheckCircle2 },
          { label: 'Volumen total', value: formatCurrency(stats.totalSpent), icon: CreditCard },
        ].map((s) => (
          <div key={s.label} className="bp-card p-4 bp-card-hover">
            <div className="w-10 h-10 bg-[var(--bp-accent-bg)] text-[var(--bp-accent)] rounded-xl flex items-center justify-center mb-2">
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>{s.value}</p>
            <p className="text-[10px] text-[var(--bp-text-tertiary)] font-semibold uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--bp-text-muted)]" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por empresa, representante, RFC..."
            className="bp-input pl-11"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', BusinessStatus.PENDING, BusinessStatus.APPROVED, BusinessStatus.SUSPENDED, BusinessStatus.REJECTED] as const).map((status) => {
            const isActive = statusFilter === status;
            const label = status === 'ALL' ? 'Todas' : STATUS_CONFIG[status].label;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[var(--bp-accent)] text-black'
                    : 'bg-[var(--bp-surface)] border border-[var(--bp-border)] text-[var(--bp-text-secondary)] hover:border-[var(--bp-border-strong)]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-16 bp-card">
            <Building2 size={40} className="text-[var(--bp-text-muted)] mx-auto mb-4" />
            <p className="font-bold text-[var(--bp-text-primary)]">No se encontraron empresas</p>
            <p className="text-sm text-[var(--bp-text-secondary)]">Intenta con otra búsqueda o filtro</p>
          </div>
        ) : (
          filteredAccounts.map((account) => {
            const cfg = STATUS_CONFIG[account.status];
            const StatusIcon = cfg.icon;
            return (
              <button
                key={account.id}
                onClick={() => setSelectedAccount(account)}
                className="w-full text-left bp-card p-5 hover:border-[var(--bp-border-strong)] transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bp-accent-bg)] flex items-center justify-center">
                      <Building2 size={22} className="text-[var(--bp-accent)]" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--bp-text-primary)]">{account.companyName}</p>
                      <p className="text-xs text-[var(--bp-text-tertiary)] font-medium">{account.representativeName} • {account.representativeEmail}</p>
                    </div>
                  </div>
                  <div className={`bp-badge ${cfg.cls}`}>
                    <StatusIcon size={14} />
                    {cfg.label}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[var(--bp-border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--bp-text-tertiary)]">
                    <Crown size={14} />
                    <span className="font-semibold text-[var(--bp-text-secondary)]">
                      {TIER_OPTIONS.find(t => t.value === account.discountTier)?.label || account.discountTier}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--bp-text-tertiary)]">
                    <CreditCard size={14} />
                    <span className="font-semibold text-[var(--bp-text-secondary)]">
                      {formatCurrency(account.creditLimit)} límite
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--bp-text-tertiary)]">
                    <Package size={14} />
                    <span className="font-semibold text-[var(--bp-text-secondary)]">
                      {account.totalOrders || 0} pedidos
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--bp-text-tertiary)] ml-auto">
                    <Clock size={14} />
                    <span>Solicitud: {formatDate(account.createdAt)}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BusinessManager;
