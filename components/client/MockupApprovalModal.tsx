import React, { useState } from 'react';
import { X, CheckCircle, XCircle, MessageCircle, ExternalLink, ZoomIn } from 'lucide-react';
import { Order, Product, FontOption } from '../../types';
import { TechnicalPreview } from '../TechnicalPreview';
import { 
  approveMockup, 
  rejectMockup, 
  generateWhatsAppApprovalMessage,
  getWhatsAppLink 
} from '../../services/mockupApprovalService';

interface MockupApprovalModalProps {
  order: Order;
  products: Product[];
  fonts: FontOption[];
  whatsappNumber: string;
  onClose: () => void;
  onApproved?: () => void;
  onRejected?: (reason: string) => void;
}

export const MockupApprovalModal: React.FC<MockupApprovalModalProps> = ({
  order,
  products,
  fonts,
  whatsappNumber,
  onClose,
  onApproved,
  onRejected
}) => {
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [zoomedItem, setZoomedItem] = useState<number | null>(null);
  const [actionTaken, setActionTaken] = useState<'APPROVED' | 'REJECTED' | null>(null);

  const handleApprove = () => {
    approveMockup(order.id, order.customerEmail || order.customerPhone || 'client');
    setActionTaken('APPROVED');
    onApproved?.();
    
    // Auto close after showing success
    setTimeout(onClose, 2000);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    
    rejectMockup(order.id, rejectionReason, revisionNotes);
    setActionTaken('REJECTED');
    onRejected?.(rejectionReason);
    
    setTimeout(onClose, 2000);
  };

  const openWhatsApp = (action: 'APPROVE' | 'REJECT' | 'QUESTION') => {
    const message = generateWhatsAppApprovalMessage(order, action, revisionNotes);
    const link = getWhatsAppLink(whatsappNumber, message);
    window.open(link, '_blank');
  };

  if (actionTaken === 'APPROVED') {
    return (
      <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-3xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
            ¡Mockup Aprobado!
          </h2>
          <p className="text-zinc-500 mb-4">
            Tu pedido #${order.id.slice(-6)} pasará a producción
          </p>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (actionTaken === 'REJECTED') {
    return (
      <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-3xl p-8 text-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={40} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
            Cambios Solicitados
          </h2>
          <p className="text-zinc-500 mb-4">
            Te contactaremos pronto para revisar los cambios
          </p>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="min-h-full p-4 flex items-start justify-center">
        <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 relative my-4">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors z-10"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="mb-6 pr-12">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-full">
                Esperando tu aprobación
              </span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
              Revisa tu diseño
            </h2>
            <p className="text-zinc-500">
              Pedido #{order.id.slice(-6)} • {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Mockups Grid */}
          <div className="space-y-6 mb-8">
            {order.items.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              const color = product?.colors.find(c => c.name === item.colorName);
              const font = fonts.find(f => f.id === item.frontFontId);
              
              return (
                <div 
                  key={index}
                  className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
                >
                  {/* Item Header */}
                  <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white">
                        {product?.name || item.productId}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Color: {item.colorName} • Cantidad: {item.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => setZoomedItem(zoomedItem === index ? null : index)}
                      className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <ZoomIn size={18} />
                    </button>
                  </div>

                  {/* Previews */}
                  <div className={`p-4 grid gap-4 ${zoomedItem === index ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {/* Front */}
                    {(item.frontText || item.frontText2 || (item.frontLogos && item.frontLogos.length > 0)) && (
                      <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Frente</p>
                        <TechnicalPreview
                          imageUrl={color?.imageUrl || product?.imageUrl}
                          text={item.frontText}
                          text2={item.frontText2}
                          fontName={item.frontFontName}
                          fontCss={font?.cssFamily}
                          logos={item.frontLogos}
                          designState={item.frontDesignState}
                          designState2={item.frontDesignState2}
                          sideLabel="FRENTE"
                          className={zoomedItem === index ? 'max-w-xl mx-auto' : ''}
                        />
                      </div>
                    )}

                    {/* Back */}
                    {(item.backText || (item.backLogos && item.backLogos.length > 0)) && (
                      <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Reverso</p>
                        <TechnicalPreview
                          imageUrl={color?.imageUrl || product?.imageUrl}
                          text={item.backText}
                          fontName={item.backFontName}
                          fontCss={fonts.find(f => f.id === item.backFontId)?.cssFamily}
                          logos={item.backLogos}
                          designState={item.backDesignState}
                          sideLabel="REVERSO"
                          className={zoomedItem === index ? 'max-w-xl mx-auto' : ''}
                        />
                      </div>
                    )}
                  </div>

                  {/* Design Details */}
                  <div className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {item.frontFontName && (
                        <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                          Fuente: {item.frontFontName}
                        </span>
                      )}
                      {item.frontText && (
                        <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                          Texto: "{item.frontText}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          {!showRejectionForm ? (
            <div className="space-y-4">
              {/* Approval Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleApprove}
                  className="flex items-center justify-center gap-2 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
                >
                  <CheckCircle size={20} />
                  Aprobar diseño
                </button>
                <button
                  onClick={() => setShowRejectionForm(true)}
                  className="flex items-center justify-center gap-2 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-colors"
                >
                  <XCircle size={20} />
                  Solicitar cambios
                </button>
              </div>

              {/* WhatsApp Options */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-500 text-center mb-3">
                  ¿Prefieres comunicarte por WhatsApp?
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => openWhatsApp('APPROVE')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-bold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <MessageCircle size={16} />
                    Aprobar por WA
                  </button>
                  <button
                    onClick={() => openWhatsApp('QUESTION')}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                  >
                    <ExternalLink size={16} />
                    Preguntar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Rejection Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                  ¿Qué necesitas cambiar?
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Cambio de texto">Cambio de texto</option>
                  <option value="Cambio de fuente">Cambio de fuente</option>
                  <option value="Cambio de color">Cambio de color</option>
                  <option value="Cambio de posición">Cambio de posición</option>
                  <option value="Error en el diseño">Error en el diseño</option>
                  <option value="Otro">Otro (especificar)</option>
                </select>
              </div>

              {rejectionReason === 'Otro' && (
                <div>
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                    Especifica los cambios necesarios
                  </label>
                  <textarea
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Describe los cambios que necesitas..."
                    rows={4}
                    className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectionForm(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                >
                  Enviar solicitud
                </button>
              </div>

              {/* WhatsApp option for rejection */}
              <button
                onClick={() => openWhatsApp('REJECT')}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-green-500 text-green-600 dark:text-green-400 font-bold rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <MessageCircle size={18} />
                Explicar por WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
