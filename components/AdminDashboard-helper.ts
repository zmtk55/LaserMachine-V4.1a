// Agregar después de formatDateSimple en AdminDashboard.tsx:

// Helper para normalizar fechas a formato YYYY-MM-DD (para comparación correcta en calendario)
const normalizeDate = (date: Date | string | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// PASO 1: Agregar la función normalizeDate arriba en el archivo (después de formatDateSimple)

// PASO 2: Reemplazar todas las comparaciones de deliveryDate en el calendario:
// Cambiar: o.deliveryDate === dateStr
// Por: normalizeDate(o.deliveryDate) === dateStr

// Ubicaciones a cambiar:
// 1. const hasOrders = orders.some(o => o.deliveryDate === dateStr);
// 2. orders.filter(o => o.deliveryDate === selectedCalendarDate)
// 3. orders.filter(o => o.deliveryDate === selectedCalendarDate).length