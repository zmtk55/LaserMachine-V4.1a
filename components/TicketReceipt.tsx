import React, { useRef } from 'react';
import { Order, OrderItem } from '../types';
import { StoreConfig } from '../types';

interface TicketReceiptProps {
  order: Order;
  storeConfig: StoreConfig;
  onClose: () => void;
}

const TicketReceipt: React.FC<TicketReceiptProps> = ({ order, storeConfig, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orden #${order.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .slogan { font-size: 10px; color: #666; margin-bottom: 15px; }
            .divider { border-bottom: 1px dashed #333; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .label { font-weight: bold; }
            .items { margin: 15px 0; }
            .item { margin-bottom: 10px; }
            .item-header { display: flex; justify-content: space-between; font-weight: bold; }
            .item-details { font-size: 10px; color: #666; margin-left: 10px; }
            .totals { margin-top: 15px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total-final { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #666; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Comprobante de Orden</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div ref={receiptRef} className="bg-white dark:bg-zinc-900 p-4 text-sm">
            <div className="text-center mb-6">
              <div className="text-2xl font-bold mb-1">{storeConfig.businessName || 'LaserMachine'}</div>
              {storeConfig.slogan && <div className="text-xs text-zinc-500 mb-2">{storeConfig.slogan}</div>}
              {storeConfig.address && <div className="text-xs text-zinc-500">{storeConfig.address}</div>}
              {storeConfig.contactPhone && <div className="text-xs text-zinc-500">Tel: {storeConfig.contactPhone}</div>}
            </div>

            <div className="border-t border-b border-dashed border-zinc-300 dark:border-zinc-700 py-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-bold">Orden:</span>
                <span className="font-bold">#{order.id}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Fecha:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Cliente:</span>
                <span>{order.customerName}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Teléfono:</span>
                <span>{order.customerPhone}</span>
              </div>
              {order.customerEmail && (
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Email:</span>
                  <span>{order.customerEmail}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-zinc-500 mt-2">
                <span>Estado:</span>
                <span className="font-bold">{order.status}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="font-bold mb-2">Productos:</div>
              {order.items.map((item, idx) => (
                <div key={idx} className="mb-3 pl-2 border-l-2 border-amber-500">
                  <div className="flex justify-between font-medium">
                    <span>{item.productId}</span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                  <div className="text-xs text-zinc-500 ml-2">
                    {item.colorName} x{item.quantity}
                  </div>
                  {item.frontText && (
                    <div className="text-xs text-zinc-500 ml-2">
                      Frente: {item.frontText}
                    </div>
                  )}
                  {item.backText && (
                    <div className="text-xs text-zinc-500 ml-2">
                      Dorso: {item.backText}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700 pt-4">
              <div className="flex justify-between mb-1">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.total + (order.discountAmount || 0) - (order.pointsRedeemed || 0))}</span>
              </div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between mb-1 text-green-600">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              {order.pointsRedeemed && order.pointsRedeemed > 0 && (
                <div className="flex justify-between mb-1 text-green-600">
                  <span>Puntos canjeados:</span>
                  <span>-{order.pointsRedeemed}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-zinc-300">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Método de pago:</span>
                <span>{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Estado pago:</span>
                <span>{order.paymentStatus}</span>
              </div>
              {order.deliveryMethod && (
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Entrega:</span>
                  <span>{order.deliveryMethod.replace('_', ' ')}</span>
                </div>
              )}
            </div>

            <div className="text-center mt-6 text-xs text-zinc-500">
              <p>¡Gracias por tu preferencia!</p>
              <p className="mt-1">Guarda este comprobante</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <span>🖨️</span> Imprimir
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-3 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketReceipt;
