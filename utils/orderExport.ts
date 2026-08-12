import type { Order } from '../types';

/** Escape CSV field */
function cell(v: string | number | undefined | null): string {
  const s = v === undefined || v === null ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Export orders to CSV (UTF-8 BOM for Excel). Uses filtered list from the UI.
 */
export function exportOrdersToCsv(orders: Order[], filename = 'pedidos-lasermachine.csv'): void {
  const headers = [
    'id',
    'creado',
    'cliente',
    'telefono',
    'email',
    'estado',
    'pago',
    'metodo_pago',
    'total',
    'items',
    'notas_lineas'
  ];

  const rows = orders.map((o) => {
    const lineNotes = o.items
      .map((it, i) => (it.notes ? `#${i + 1}: ${it.notes}` : ''))
      .filter(Boolean)
      .join(' | ');
    return [
      cell(o.id),
      cell(o.createdAt),
      cell(o.customerName),
      cell(o.customerPhone),
      cell(o.customerEmail),
      cell(o.status),
      cell(o.paymentStatus),
      cell(o.paymentMethod),
      cell(o.total),
      cell(o.items.length),
      cell(lineNotes)
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
