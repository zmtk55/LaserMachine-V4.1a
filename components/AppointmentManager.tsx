import React, { useState, useMemo } from 'react';
import { Appointment, AppointmentStatus, AppointmentSlot } from '../types';
import { 
  Calendar, Clock, User, Phone, Mail, Plus, X, 
  Check, AlertCircle, MapPin, Package, ChevronLeft, ChevronRight,
  Edit, Trash2, Video, MessageSquare
} from 'lucide-react';

interface AppointmentManagerProps {
  appointments: Appointment[];
  onAddAppointment: (appointment: Appointment) => void;
  onUpdateAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  isDarkMode?: boolean;
}

const APPOINTMENT_TYPES = [
  { id: 'PICKUP', label: 'Retiro', icon: Package, color: 'bg-amber-500' },
  { id: 'CONSULTATION', label: 'Consulta', icon: MessageSquare, color: 'bg-blue-500' },
  { id: 'MEASUREMENT', label: 'Medición', icon: MapPin, color: 'bg-green-500' },
  { id: 'DELIVERY', label: 'Entrega', icon: Package, color: 'bg-purple-500' },
  { id: 'OTHER', label: 'Otro', icon: Clock, color: 'bg-zinc-500' },
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30'
];

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  CONFIRMED: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  COMPLETED: 'bg-green-500/20 text-green-600 border-green-500/30',
  CANCELLED: 'bg-red-500/20 text-red-600 border-red-500/30',
  NO_SHOW: 'bg-zinc-500/20 text-zinc-600 border-zinc-500/30',
};

export const AppointmentManager: React.FC<AppointmentManagerProps> = ({
  appointments,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  isDarkMode = false
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'DAY' | 'WEEK'>('DAY');

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: selectedDate,
    time: '10:00',
    duration: 30,
    type: 'PICKUP' as const,
    notes: ''
  });

  // Filter appointments by selected date
  const dayAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  // Get appointments for the week view
  const weekAppointments = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const weekDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push(d.toISOString().split('T')[0]);
    }
    
    return weekDays.map(date => ({
      date,
      appointments: appointments
        .filter(apt => apt.date === date)
        .sort((a, b) => a.time.localeCompare(b.time))
    }));
  }, [appointments, selectedDate]);

  // Get available slots for a specific date
  const getAvailableSlots = (date: string): AppointmentSlot[] => {
    const bookedSlots = appointments
      .filter(apt => apt.date === date && apt.status !== 'CANCELLED')
      .map(apt => apt.time);
    
    return TIME_SLOTS.map(time => ({
      time,
      available: !bookedSlots.includes(time)
    }));
  };

  const availableSlots = getAvailableSlots(selectedDate);

  const handleOpenModal = (appointment?: Appointment) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData({
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        customerEmail: appointment.customerEmail || '',
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        type: appointment.type,
        notes: appointment.notes || ''
      });
    } else {
      setEditingAppointment(null);
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        date: selectedDate,
        time: '10:00',
        duration: 30,
        type: 'PICKUP',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    
    if (editingAppointment) {
      onUpdateAppointment({
        ...editingAppointment,
        ...formData,
        updatedAt: now
      });
    } else {
      const newAppointment: Appointment = {
        id: `APT-${Date.now()}`,
        ...formData,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now
      };
      onAddAppointment(newAppointment);
    }
    
    setShowModal(false);
  };

  const handleStatusChange = (appointment: Appointment, status: AppointmentStatus) => {
    onUpdateAppointment({
      ...appointment,
      status,
      updatedAt: new Date().toISOString()
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate);
    if (viewMode === 'DAY') {
      current.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    }
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const getTypeInfo = (type: string) => APPOINTMENT_TYPES.find(t => t.id === type) || APPOINTMENT_TYPES[4];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold text-sm hover:bg-amber-600 transition-colors"
            >
              Hoy
            </button>
            <button 
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase">
              {new Date(selectedDate).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <p className="text-sm text-zinc-500">{dayAppointments.length} citas programadas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('DAY')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                viewMode === 'DAY' 
                  ? 'bg-white dark:bg-zinc-700 shadow-sm' 
                  : 'text-zinc-500'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode('WEEK')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                viewMode === 'WEEK' 
                  ? 'bg-white dark:bg-zinc-700 shadow-sm' 
                  : 'text-zinc-500'
              }`}
            >
              Semana
            </button>
          </div>
          
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-bold text-sm hover:bg-amber-600 transition-colors"
          >
            <Plus size={18} /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'DAY' ? (
          <div className="space-y-4">
            {dayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Calendar size={64} className="mb-4 opacity-20" />
                <p className="text-lg font-bold">No hay citas para este día</p>
                <button 
                  onClick={() => handleOpenModal()}
                  className="mt-4 text-amber-500 font-bold"
                >
                  Agendar una cita
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {dayAppointments.map(appointment => {
                  const typeInfo = getTypeInfo(appointment.type);
                  return (
                    <div 
                      key={appointment.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${typeInfo.color} rounded-xl flex items-center justify-center text-white`}>
                          <typeInfo.icon size={24} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-black text-zinc-900 dark:text-white">
                              {appointment.time}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[appointment.status]}`}>
                              {appointment.status}
                            </span>
                            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold text-zinc-600 dark:text-zinc-400">
                              {typeInfo.label}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                            {appointment.customerName}
                          </h3>
                          
                          <div className="flex items-center gap-4 text-sm text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Phone size={14} /> {appointment.customerPhone}
                            </span>
                            {appointment.customerEmail && (
                              <span className="flex items-center gap-1">
                                <Mail size={14} /> {appointment.customerEmail}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock size={14} /> {appointment.duration} min
                            </span>
                          </div>
                          
                          {appointment.notes && (
                            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            {appointment.status === 'PENDING' && (
                              <button
                                onClick={() => handleStatusChange(appointment, 'CONFIRMED')}
                                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                title="Confirmar"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            {appointment.status === 'CONFIRMED' && (
                              <button
                                onClick={() => handleStatusChange(appointment, 'COMPLETED')}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                title="Completar"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenModal(appointment)}
                              className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('¿Cancelar esta cita?')) {
                                  handleStatusChange(appointment, 'CANCELLED');
                                }
                              }}
                              className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                              title="Cancelar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekAppointments.map(({ date, appointments: dayAppts }) => {
              const isSelected = date === selectedDate;
              const isToday = date === new Date().toISOString().split('T')[0];
              
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    isSelected 
                      ? 'bg-amber-500 text-white' 
                      : isToday
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="text-xs font-bold uppercase mb-2">
                    {new Date(date).toLocaleDateString('es-MX', { weekday: 'short' })}
                  </div>
                  <div className="text-2xl font-black mb-2">
                    {new Date(date).getDate()}
                  </div>
                  <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-zinc-500'}`}>
                    {dayAppts.length} {dayAppts.length === 1 ? 'cita' : 'citas'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase">
                {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-500 uppercase mb-2">Nombre del Cliente</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-500 uppercase mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                    placeholder="4771234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-500 uppercase mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                    placeholder="juan@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-500 uppercase mb-2">Fecha</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-500 uppercase mb-2">Hora</label>
                  <select
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                  >
                    {availableSlots.map(slot => (
                      <option 
                        key={slot.time} 
                        value={slot.time}
                        disabled={!slot.available && formData.time !== slot.time}
                      >
                        {slot.time} {!slot.available && '(ocupado)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-500 uppercase mb-2">Tipo de Cita</label>
                <div className="grid grid-cols-3 gap-2">
                  {APPOINTMENT_TYPES.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.id as typeof formData.type })}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        formData.type === type.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <type.icon size={20} className={formData.type === type.id ? 'text-amber-500' : 'text-zinc-400'} />
                      <span className={`text-xs font-bold ${formData.type === type.id ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-500 uppercase mb-2">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold resize-none"
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.customerName || !formData.customerPhone}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingAppointment ? 'Guardar Cambios' : 'Crear Cita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
