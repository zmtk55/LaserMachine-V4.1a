import React, { useState, useMemo } from 'react';
import { X, Sparkles } from 'lucide-react';

export type TemplateOccasion = 
  | 'fathers-day' 
  | 'mothers-day' 
  | 'teachers-day'
  | 'birthday'
  | 'graduation'
  | 'general';

export interface DesignTemplate {
  id: string;
  name: string;
  occasion: TemplateOccasion;
  preview: string;
  texts: string[];
  fontFamily: string;
}

const OCCASIONS: Record<TemplateOccasion, { label: string; color: string }> = {
  'fathers-day': { label: 'Día del Padre', color: '#3B82F6' },
  'mothers-day': { label: 'Día de la Madre', color: '#EC4899' },
  'teachers-day': { label: 'Día del Maestro', color: '#F59E0B' },
  'birthday': { label: 'Cumpleaños', color: '#8B5CF6' },
  'graduation': { label: 'Graduación', color: '#10B981' },
  'general': { label: 'General', color: '#6B7280' }
};

const TEMPLATES: DesignTemplate[] = [
  // Día del Padre
  { id: 'dad-1', name: 'El Rey', occasion: 'fathers-day', preview: '👑', texts: ['REY', 'PAPÁ'], fontFamily: 'Bebas Neue' },
  { id: 'dad-2', name: 'The Boss', occasion: 'fathers-day', preview: '💼', texts: ['THE BOSS'], fontFamily: 'Anton' },
  { id: 'dad-3', name: 'Super Dad', occasion: 'fathers-day', preview: '🦸', texts: ['SUPER', 'DAD'], fontFamily: 'Anton' },
  
  // Día de la Madre
  { id: 'mom-1', name: 'La Reina', occasion: 'mothers-day', preview: '👑', texts: ['QUEEN', 'MOM'], fontFamily: 'Playfair Display' },
  { id: 'mom-2', name: 'Best Mom', occasion: 'mothers-day', preview: '🏆', texts: ['WORLD\'S', 'BEST', 'MOM'], fontFamily: 'Bebas Neue' },
  { id: 'mom-3', name: 'Mi Ángel', occasion: 'mothers-day', preview: '💕', texts: ['MY ANGEL', 'MOM'], fontFamily: 'Plus Jakarta Sans' },
  
  // Día del Maestro
  { id: 'teacher-1', name: 'Best Teacher', occasion: 'teachers-day', preview: '📚', texts: ['BEST', 'TEACHER'], fontFamily: 'Anton' },
  { id: 'teacher-2', name: 'Gracias Profe', occasion: 'teachers-day', preview: '🙏', texts: ['GRACIAS', 'PROFE'], fontFamily: 'Permanent Marker' },
  
  // Cumpleaños
  { id: 'bday-1', name: 'Birthday King', occasion: 'birthday', preview: '🎂', texts: ['BIRTHDAY', 'KING'], fontFamily: 'Bebas Neue' },
  { id: 'bday-2', name: 'Birthday Queen', occasion: 'birthday', preview: '👸', texts: ['BIRTHDAY', 'QUEEN'], fontFamily: 'Playfair Display' },
  
  // Graduación
  { id: 'grad-1', name: 'Class Of', occasion: 'graduation', preview: '🎓', texts: ['CLASS', 'OF', '2024'], fontFamily: 'Anton' },
  
  // General
  { id: 'gen-1', name: 'Nombre', occasion: 'general', preview: 'Aa', texts: ['TU NOMBRE'], fontFamily: 'Plus Jakarta Sans' },
  { id: 'gen-2', name: 'Iniciales', occasion: 'general', preview: 'AB', texts: ['INITIALS'], fontFamily: 'JetBrains Mono' },
];

interface DesignTemplatesProps {
  onSelectTemplate: (template: DesignTemplate) => void;
  onClose: () => void;
}

export const DesignTemplates: React.FC<DesignTemplatesProps> = ({ onSelectTemplate, onClose }) => {
  const [selectedOccasion, setSelectedOccasion] = useState<TemplateOccasion | null>(null);
  
  const filteredTemplates = useMemo(() => {
    if (!selectedOccasion) return TEMPLATES;
    return TEMPLATES.filter(t => t.occasion === selectedOccasion);
  }, [selectedOccasion]);

  const occasions = Object.entries(OCCASIONS) as [TemplateOccasion, typeof OCCASIONS['fathers-day']][];

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase">
              Plantillas
            </h2>
            <p className="text-sm text-zinc-500">
              Elige un diseño para comenzar
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto p-4 space-y-2">
            <button
              onClick={() => setSelectedOccasion(null)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                !selectedOccasion ? 'bg-yellow-500 text-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Sparkles size={20} />
              <span className="font-bold text-sm">Todas</span>
            </button>
            
            {occasions.map(([key, config]) => {
              const count = TEMPLATES.filter(t => t.occasion === key).length;
              if (count === 0) return null;
              
              return (
                <button
                  key={key}
                  onClick={() => setSelectedOccasion(key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedOccasion === key ? 'bg-yellow-500 text-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: selectedOccasion === key ? 'rgba(0,0,0,0.1)' : `${config.color}20` }}
                  >
                    {config.label.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">{config.label}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {filteredTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => onSelectTemplate(template)}
                  className="group bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-yellow-500 hover:shadow-lg transition-all overflow-hidden text-left"
                >
                  <div 
                    className="aspect-square flex items-center justify-center text-4xl"
                    style={{ backgroundColor: `${OCCASIONS[template.occasion].color}10` }}
                  >
                    {template.preview}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">
                      {template.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignTemplates;
