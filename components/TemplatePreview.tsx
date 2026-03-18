import React, { useMemo } from 'react';
import { DesignTemplate, DesignTemplateText } from '../types';

interface TemplatePreviewProps {
  template: DesignTemplate;
  productImage?: string;
  width?: number;
  height?: number;
  showGuides?: boolean;
}

// Mapeo de fuentes a clases CSS
const FONT_MAP: Record<string, string> = {
  'Plus Jakarta Sans': 'font-google',
  'Bebas Neue': 'font-bold1',
  'Anton': 'font-industrial',
  'Playfair Display': 'font-serif1',
  'Permanent Marker': 'font-script1',
  'JetBrains Mono': 'font-mono'
};

// Mapeo de fuentes a estilos
const FONT_STYLES: Record<string, React.CSSProperties> = {
  'Plus Jakarta Sans': { fontFamily: '"Plus Jakarta Sans", sans-serif' },
  'Bebas Neue': { fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.05em' },
  'Anton': { fontFamily: 'Anton, sans-serif', letterSpacing: '0.05em' },
  'Playfair Display': { fontFamily: '"Playfair Display", serif' },
  'Permanent Marker': { fontFamily: '"Permanent Marker", cursive' },
  'JetBrains Mono': { fontFamily: '"JetBrains Mono", monospace' }
};

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  productImage = '/images/products/yeti/YETI_Rambler_30oz_Navy.png',
  width = 300,
  height = 400,
  showGuides = false
}) => {
  // Producto placeholder si no hay imagen
  const hasProductImage = productImage && !productImage.includes('undefined');

  return (
    <div 
      className="relative bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-xl overflow-hidden"
      style={{ width, height }}
    >
      {/* Grid de guías opcional */}
      {showGuides && (
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-0 right-0 h-px bg-yellow-400" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-yellow-400" />
          <div className="absolute top-3/4 left-0 right-0 h-px bg-yellow-400" />
          <div className="absolute left-1/4 top-0 bottom-0 w-px bg-yellow-400" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-yellow-400" />
          <div className="absolute left-3/4 top-0 bottom-0 w-px bg-yellow-400" />
        </div>
      )}

      {/* Imagen del producto */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {hasProductImage ? (
          <img 
            src={productImage} 
            alt="Product preview"
            className="max-w-full max-h-full object-contain drop-shadow-2xl"
          />
        ) : (
          <div className="w-32 h-48 bg-zinc-300 dark:bg-zinc-700 rounded-full opacity-50" />
        )}
      </div>

      {/* Overlay de textos del template */}
      <div className="absolute inset-0">
        {template.texts.map((textObj, idx) => {
          const content = typeof textObj === 'string' ? textObj : textObj.content;
          const fontFamily = typeof textObj === 'string' ? 'Plus Jakarta Sans' : (textObj.fontFamily || 'Plus Jakarta Sans');
          const size = typeof textObj === 'string' ? 1 : (textObj.size || 1);
          const yPosition = typeof textObj === 'string' ? (40 + idx * 25) : (textObj.yPosition || 40 + idx * 25);
          const color = typeof textObj === 'string' ? undefined : textObj.color;

          // Calcular tamaño de fuente base (responsive)
          const baseFontSize = Math.min(width * 0.15 * size, 48);

          return (
            <div
              key={idx}
              className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none"
              style={{
                top: `${yPosition}%`,
                transform: 'translateX(-50%) translateY(-50%)',
                maxWidth: '80%',
              }}
            >
              <span
                className={`block whitespace-nowrap drop-shadow-lg ${FONT_MAP[fontFamily] || 'font-google'}`}
                style={{
                  ...FONT_STYLES[fontFamily],
                  fontSize: `${baseFontSize}px`,
                  color: color || '#1f2937',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
                  WebkitTextStroke: '1px rgba(255,255,255,0.3)',
                  letterSpacing: '0.02em'
                }}
              >
                {content}
              </span>
            </div>
          );
        })}
      </div>

      {/* Indicador de ocasión */}
      <div className="absolute top-2 right-2">
        <span className="text-2xl" title={template.occasion}>
          {template.preview}
        </span>
      </div>

      {/* Nombre del template */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <p className="text-white text-xs font-bold truncate">
          {template.name}
        </p>
      </div>
    </div>
  );
};

export default TemplatePreview;
