// Helper para normalizar fechas a formato YYYY-MM-DD (para comparación correcta en calendario)
export const normalizeDate = (date: Date | string | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// CAMBIOS A REALIZAR EN EL CALENDARIO:
// 
// 1. En la línea que tiene:
//    const hasOrders = orders.some(o => o.deliveryDate === dateStr);
// 
//    Cambiar a:
//    const hasOrders = orders.some(o => normalizeDate(o.deliveryDate) === dateStr);
//
// 2. En las líneas que tienen:
//    orders.filter(o => o.deliveryDate === selectedCalendarDate)
//
//    Cambiar a:
//    orders.filter(o => normalizeDate(o.deliveryDate) === selectedCalendarDate)
