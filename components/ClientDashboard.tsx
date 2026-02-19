
import React, { useState } from 'react';
import { Order, User, OrderStatus, Coupon, Product, FontOption } from '../types';
import { Package, Clock, Truck, CheckCircle, AlertTriangle, Search, ThumbsUp, RefreshCcw, Star, ExternalLink, X, Gift, Copy, Share2, Wallet, Award, ArrowRight, History, Eye, Download } from 'lucide-react';
import { TechnicalPreview } from './TechnicalPreview';

interface ClientDashboardProps {
  user: User;
  orders: Order[];
  products: Product[];
  fonts: FontOption[];
  coupons?: Coupon[];
  onReorder?: (order: Order) => void;
  onApproveMockup?: (orderId: string, approved: boolean) => void;
  onCreateReferral?: (code: string) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, orders, products, fonts, coupons = [], onReorder, onApproveMockup, onCreateReferral }) => {
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const myOrders = orders.filter(o => o.customerEmail?.toLowerCase() === user.email.toLowerCase()).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Identificar si el usuario ya tiene un código de referido
  const myReferralCoupon = coupons.find(c => c.referrerUserId === user.id);

  const getStatusColor = (status: OrderStatus) => {
      switch(status) {
          case OrderStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200';
          case OrderStatus.READY: return 'bg-blue-100 text-blue-700 border-blue-200';
          case OrderStatus.IN_PRODUCTION: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
          case OrderStatus.WAITING_APPROVAL: return 'bg-purple-100 text-purple-700 border-purple-200 animate-pulse'; 
          case OrderStatus.RECEIVED: return 'bg-zinc-100 text-zinc-600 border-zinc-200';
          default: return 'bg-red-100 text-red-700 border-red-200';
      }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const handleCreateCode = () => {
      if (!referralCodeInput || referralCodeInput.length < 4) {
          alert("El código debe tener al menos 4 caracteres.");
          return;
      }
      if (onCreateReferral) onCreateReferral(referralCodeInput);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Código copiado al portapapeles");
  };

  const shareViaWhatsapp = (code: string) => {
      const text = `¡Hola! Usa mi código *${code}* en LaserMachine para obtener 10% de descuento en tu primer pedido personalizado.`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="h-full w-full p-4 md:p-10 overflow-y-auto relative bg-white/60 dark:bg-zinc-950/70 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4">
            
            {/* HEADER WELCOME */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">Hola, {user.name.split(' ')[0]}</h1>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Bienvenido a tu panel de control y recompensas.</p>
                </div>
            </div>

            {/* WALLET & REFERRAL GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. LASERPOINTS WALLET CARD */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-zinc-800 shadow-2xl p-8 min-h-[240px] flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] group-hover:bg-yellow-500/20 transition-all duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px]"></div>
                    
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <Wallet className="text-yellow-500" size={24}/>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Billetera LaserPoints</span>
                        </div>
                        <button onClick={() => setShowPointsHistory(true)} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors" title="Ver Historial">
                            <History size={18}/>
                        </button>
                    </div>

                    <div className="relative z-10 py-6">
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">{user.laserPoints || 0}</span>
                            <span className="text-sm font-bold text-yellow-500 uppercase tracking-wider">PTS</span>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono mt-1">Valor canjeable: {formatCurrency((user.laserPoints || 0) * 1)} MXN</p>
                        <p className="text-[10px] text-zinc-600 mt-2 italic font-bold">* Usar al finalizar compra</p>
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                            <span>Nivel: Iniciado</span>
                            <span>Siguiente: Pro (500 pts)</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400" style={{width: `${Math.min(100, ((user.laserPoints || 0) / 500) * 100)}%`}}></div>
                        </div>
                    </div>
                </div>

                {/* 2. REFERRAL PROGRAM */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Gift size={120} />
                    </div>

                    {myReferralCoupon ? (
                        <>
                            <h3 className="text-xl font-black uppercase text-zinc-900 dark:text-white mb-2">Tu Código de Afiliado</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 max-w-xs">
                                Comparte este código. Tus amigos reciben <span className="text-green-500 font-bold">10% OFF</span> y tú ganas <span className="text-yellow-500 font-bold">50 LaserPoints</span> por cada compra.
                            </p>
                            
                            <div className="bg-zinc-100 dark:bg-black border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-4 rounded-xl flex items-center justify-between mb-6 group hover:border-yellow-400 transition-colors">
                                <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-widest">{myReferralCoupon.code}</span>
                                <button onClick={() => copyToClipboard(myReferralCoupon.code)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors" title="Copiar">
                                    <Copy size={20}/>
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => shareViaWhatsapp(myReferralCoupon.code)} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-transform active:scale-95">
                                    <Share2 size={16}/> Enviar por WhatsApp
                                </button>
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-400 uppercase">
                                <Award size={12}/> {myReferralCoupon.usedCount || 0} personas lo han usado
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-black uppercase text-zinc-900 dark:text-white mb-2">Programa de Embajadores</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                                Crea tu código personalizado único. Gana puntos por cada amigo que compre usando tu código.
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Crea tu código (Ej. TU-NOMBRE)</label>
                                    <input 
                                        value={referralCodeInput}
                                        onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                                        placeholder="EJ. JUANVIP"
                                        className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl font-black text-lg uppercase outline-none focus:border-yellow-400 transition-colors"
                                        maxLength={10}
                                    />
                                </div>
                                <button onClick={handleCreateCode} className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs tracking-widest rounded-xl shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2 transition-transform active:scale-95">
                                    Generar Código <ArrowRight size={16}/>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ORDERS SECTION */}
            <div>
                <h3 className="text-xl font-black uppercase text-zinc-900 dark:text-white mb-6 flex items-center gap-3">
                    <Package size={20}/> Historial de Pedidos
                </h3>
                
                {myOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                        <Package size={48} className="mx-auto text-zinc-300 mb-4"/>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Aún no tienes pedidos</h3>
                        <p className="text-zinc-500 text-sm mb-6">¡Explora nuestro catálogo y crea algo único!</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {myOrders.map(order => (
                            <div 
                                key={order.id} 
                                onClick={() => setSelectedOrder(order)}
                                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-yellow-400 dark:hover:border-yellow-400 transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className="absolute top-4 right-4 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full text-zinc-400 group-hover:text-yellow-500 group-hover:bg-yellow-400/10 transition-colors">
                                    <Eye size={16}/>
                                </div>

                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-lg font-black text-zinc-900 dark:text-white">Orden #{order.id}</span>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(order.status)}`}>{order.status.replace('_', ' ')}</span>
                                        </div>
                                        <span className="text-xs text-zinc-500 font-mono flex items-center gap-2"><Clock size={12}/> {formatDate(order.createdAt)}</span>
                                    </div>
                                    <div className="text-right pr-12 md:pr-0">
                                        <span className="block text-[10px] font-bold text-zinc-400 uppercase">Total</span>
                                        <span className="text-xl font-black text-zinc-900 dark:text-white">{formatCurrency(order.total)}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-4">
                                            <div className="w-16 h-16 bg-zinc-100 dark:bg-black rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-xs overflow-hidden">
                                                {(() => {
                                                    const prod = products.find(p => p.id === item.productId);
                                                    const colorImg = prod?.colors.find(c => c.name === item.colorName)?.imageUrl;
                                                    const mainImg = prod?.imageUrl;
                                                    return (colorImg || mainImg) ? <img src={colorImg || mainImg} className="w-full h-full object-cover"/> : <Package size={20}/>
                                                })()}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase">{item.productId}</h4>
                                                <p className="text-xs text-zinc-500 mb-1">{item.colorName} • x{item.quantity}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.frontText && <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">Frente: {item.frontText}</span>}
                                                    {item.backText && <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">Dorso: {item.backText}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {order.status === OrderStatus.WAITING_APPROVAL && (
                                    <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-xl relative z-20" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="text-purple-600 dark:text-purple-400 shrink-0" size={20}/>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-purple-800 dark:text-purple-300">¡Tu aprobación es requerida!</p>
                                                <p className="text-xs text-purple-700 dark:text-purple-400 mb-3">Hemos preparado el diseño final. Por favor revísalo antes de grabar.</p>
                                                {order.mockupUrl ? (
                                                    <a href={order.mockupUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold underline mb-3 text-purple-600 hover:text-purple-800">Ver Diseño Digital <ExternalLink size={10}/></a>
                                                ) : (
                                                    <div className="w-full h-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-3 flex items-center justify-center text-xs text-zinc-500 font-mono">SIMULACIÓN MOCKUP VISUAL</div>
                                                )}
                                                
                                                <div className="flex gap-2">
                                                    <button onClick={() => onApproveMockup && onApproveMockup(order.id, true)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2"><ThumbsUp size={14}/> Aprobar Diseño</button>
                                                    <button onClick={() => onApproveMockup && onApproveMockup(order.id, false)} className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:text-red-500 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2"><X size={14}/> Solicitar Cambios</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {order.status === OrderStatus.READY && (
                                    <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-4 rounded-xl flex items-center gap-3">
                                        <AlertTriangle className="text-yellow-600 dark:text-yellow-500" size={20}/>
                                        <div>
                                            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-500">¡Tu pedido está listo!</p>
                                            <p className="text-xs text-yellow-700 dark:text-yellow-600">Puedes pasar a recogerlo en tienda o esperar el envío según tu método de entrega.</p>
                                        </div>
                                    </div>
                                )}

                                {order.status === OrderStatus.COMPLETED && (
                                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end" onClick={e => e.stopPropagation()}>
                                        <button 
                                            onClick={() => onReorder && onReorder(order)}
                                            className="text-xs font-bold text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-2 transition-colors uppercase tracking-wider"
                                        >
                                            <RefreshCcw size={14}/> Volver a pedir lo mismo
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* ORDER DETAILS MODAL (TECHNICAL PREVIEW) */}
        {selectedOrder && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95">
                <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 relative shadow-2xl custom-scrollbar">
                    <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors z-20"><X size={20}/></button>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-6 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Detalles #{selectedOrder.id}</h2>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                            </div>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wide flex items-center gap-2"><Clock size={14}/> {formatDate(selectedOrder.createdAt)}</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="space-y-4 pb-8 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                <div className="flex items-center justify-between">
                                    <h5 className="font-bold text-lg text-zinc-900 dark:text-white uppercase">{item.productId} - {item.colorName} (x{item.quantity})</h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <TechnicalPreview 
                                        imageUrl={products.find(p => p.id === item.productId)?.colors.find(c => c.name === item.colorName)?.imageUrl || products.find(p => p.id === item.productId)?.imageUrl} 
                                        text={item.frontText} text2={item.frontText2} 
                                        fontName={item.frontFontName} fontCss={fonts.find(f => f.id === item.frontFontId)?.cssFamily || ''} 
                                        logos={item.frontLogos} 
                                        designState={item.frontDesignState} designState2={item.frontDesignState2} 
                                        sideLabel="FRENTE"
                                    />
                                    <TechnicalPreview 
                                        imageUrl={products.find(p => p.id === item.productId)?.colors.find(c => c.name === item.colorName)?.imageUrl || products.find(p => p.id === item.productId)?.imageUrl} 
                                        text={item.backText} text2={item.backText2} 
                                        fontName={item.backFontName} fontCss={fonts.find(f => f.id === item.backFontId)?.cssFamily || ''} 
                                        logos={item.backLogos} 
                                        designState={item.backDesignState} designState2={item.backDesignState2} 
                                        sideLabel="DORSO"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* POINTS HISTORY MODAL */}
        {showPointsHistory && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl relative max-h-[80vh] flex flex-col">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50">
                        <h3 className="text-lg font-black uppercase text-zinc-900 dark:text-white">Historial LaserPoints</h3>
                        <button onClick={() => setShowPointsHistory(false)}><X className="text-zinc-500 hover:text-black dark:hover:text-white" size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0">
                        {!user.pointsHistory || user.pointsHistory.length === 0 ? (
                            <div className="p-10 text-center text-zinc-400 text-sm">No hay movimientos registrados aún.</div>
                        ) : (
                            user.pointsHistory.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(h => (
                                <div key={h.id} className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div>
                                        <p className="font-bold text-sm text-zinc-900 dark:text-white uppercase">{h.description}</p>
                                        <p className="text-xs text-zinc-500">{new Date(h.date).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`font-black text-sm ${h.type === 'EARNED' ? 'text-green-500' : 'text-red-500'}`}>
                                        {h.type === 'EARNED' ? '+' : '-'}{h.amount}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
