import React, { useState } from 'react';
import { X, Building2, User, Phone, Mail, Briefcase, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { BusinessAccount, BusinessStatus, BusinessUser } from '../types';
import '../src/styles/business-portal-theme.css';

interface BusinessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (account: BusinessAccount) => void;
}

export const BusinessRequestModal: React.FC<BusinessRequestModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form');
  const [formData, setFormData] = useState({
    companyName: '',
    taxId: '',
    industry: '',
    representativeName: '',
    representativePhone: '',
    representativeEmail: '',
    estimatedVolume: '',
    message: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('submitting');

    const newAccount: BusinessAccount = {
      id: `BUS-${Date.now()}`,
      companyName: formData.companyName.trim(),
      taxId: formData.taxId.trim(),
      industry: formData.industry.trim(),
      representativeName: formData.representativeName.trim(),
      representativePhone: formData.representativePhone.trim(),
      representativeEmail: formData.representativeEmail.trim().toLowerCase(),
      discountTier: 'NONE',
      creditLimit: 0,
      creditUsed: 0,
      paymentTerms: 'CONTADO',
      brandKit: {
        logoUrl: '',
        approvedFonts: [],
        approvedColors: [],
      },
      assignedRepId: '',
      users: [
        {
          id: `USR-${Date.now()}`,
          name: formData.representativeName.trim(),
          email: formData.representativeEmail.trim().toLowerCase(),
          phone: formData.representativePhone.trim(),
          role: 'ADMIN',
          isActive: true,
        } as BusinessUser,
      ],
      status: BusinessStatus.PENDING,
      notes: `Volumen estimado: ${formData.estimatedVolume}\n\nMensaje: ${formData.message}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalOrders: 0,
      totalSpent: 0,
    };

    try {
      const existing = localStorage.getItem('lm_business_accounts_v1');
      const accounts: BusinessAccount[] = existing ? JSON.parse(existing) : [];
      accounts.push(newAccount);
      localStorage.setItem('lm_business_accounts_v1', JSON.stringify(accounts));
    } catch {}

    await new Promise((r) => setTimeout(r, 1200));
    onSubmit?.(newAccount);
    setStep('success');
  };

  const resetAndClose = () => {
    setStep('form');
    setFormData({
      companyName: '',
      taxId: '',
      industry: '',
      representativeName: '',
      representativePhone: '',
      representativeEmail: '',
      estimatedVolume: '',
      message: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 flex items-center justify-center p-4 business-portal">
      <div
        className="bg-[var(--bp-surface)] w-full max-w-lg rounded-2xl border border-[var(--bp-border)] p-6 relative shadow-2xl bp-animate-scale max-h-[90vh] overflow-y-auto bp-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 p-2.5 bg-[var(--bp-bg-elevated)] border border-[var(--bp-border)] rounded-lg hover:bg-[var(--bp-bg-sunken)] transition-colors active:scale-95"
        >
          <X size={20} className="text-[var(--bp-text-secondary)]" />
        </button>

        {step === 'success' ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-[var(--bp-success-bg)] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-[var(--bp-success)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--bp-text-primary)] mb-2" style={{ fontFamily: 'var(--bp-font-heading)' }}>¡Solicitud enviada!</h2>
            <p className="text-sm text-[var(--bp-text-secondary)] mb-6 max-w-xs mx-auto">
              Hemos recibido tu información. Nuestro equipo revisará tu solicitud y te contactará en menos de 24 horas.
            </p>
            <button onClick={resetAndClose} className="bp-btn bp-btn-primary px-8 py-3">
              Entendido
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-12 h-12 bg-[var(--bp-accent)] rounded-xl flex items-center justify-center mb-4 shadow-sm">
                <Building2 size={24} className="text-black" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--bp-text-primary)]" style={{ fontFamily: 'var(--bp-font-heading)' }}>Solicitar acceso empresarial</h2>
              <p className="text-sm text-[var(--bp-text-secondary)] mt-1">
                Completa el formulario para obtener precios especiales, crédito y un representante asignado.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide block mb-1.5">Nombre de la empresa *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--bp-text-muted)]" size={18} />
                  <input
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Ej. Constructora del Norte"
                    className="bp-input pl-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide block mb-1.5">RFC *</label>
                  <input
                    required
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="RFC"
                    className="bp-input uppercase"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide block mb-1.5">Industria</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--bp-text-muted)]" size={18} />
                    <input
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="Ej. Construcción"
                      className="bp-input pl-11"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide block mb-1.5">Nombre del representante *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--bp-text-muted)]" size={18} />
                  <input
                    required
                    value={formData.representativeName}
                    onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                    placeholder="Nombre completo"
                    className="bp-input pl-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide block mb-1.5">Teléfono *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--bp-text-muted)]" size={18} />
                    <input
                      required
                      type="tel"
                      value={formData.representativePhone}
                      onChange={(e) => setFormData({ ...formData, representativePhone: e.target.value })}
                      placeholder="10 dígitos"
                      className="bp-input pl-11"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide block mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--bp-text-muted)]" size={18} />
                    <input
                      required
                      type="email"
                      value={formData.representativeEmail}
                      onChange={(e) => setFormData({ ...formData, representativeEmail: e.target.value })}
                      placeholder="correo@empresa.com"
                      className="bp-input pl-11"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide block mb-1.5">Volumen estimado mensual</label>
                <select
                  value={formData.estimatedVolume}
                  onChange={(e) => setFormData({ ...formData, estimatedVolume: e.target.value })}
                  className="bp-input appearance-none"
                >
                  <option value="">Selecciona...</option>
                  <option value="10-50 piezas">10 - 50 piezas</option>
                  <option value="50-100 piezas">50 - 100 piezas</option>
                  <option value="100-500 piezas">100 - 500 piezas</option>
                  <option value="500+ piezas">500+ piezas</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[var(--bp-text-tertiary)] uppercase tracking-wide block mb-1.5">Mensaje adicional</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Cuéntanos qué tipo de productos personalizados necesitas..."
                  rows={3}
                  className="bp-input resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={step === 'submitting'}
                className="bp-btn bp-btn-primary w-full py-4 mt-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[var(--bp-accent)]/20"
              >
                {step === 'submitting' ? (
                  <><Loader2 size={18} className="animate-spin" /> Enviando solicitud...</>
                ) : (
                  <><Send size={18} /> Enviar solicitud</>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessRequestModal;
