import React from 'react';
import { DesignTemplate } from '../types';

interface TumblerPreviewProps {
  template: DesignTemplate;
  color?: string;
  className?: string;
  width?: number;
  height?: number;
}

// Fallback: SVG simple de vaso estilo YETI
const SimpleTumblerSVG: React.FC<{ color: string; texts: any[] }> = ({ color, texts }) => {
  const colorMap: Record<string, string> = {
    stainless: '#C4C4C4',
    black: '#1a1a1a',
    navy: '#1e3a5f',
    white: '#f5f5f5',
    pink: '#f8c8dc',
    teal: '#008080',
    copper: '#b87333',
    forest: '#2d5a3d'
  };

  const baseColor = colorMap[color] || colorMap.stainless;

  return (
    <svg viewBox="0 0 200 320" className="w-full h-full">
      {/* Sombra base */}
      <ellipse cx="100" cy="300" rx="70" ry="10" fill="rgba(0,0,0,0.3)" />
      
      {/* Cuerpo del vaso */}
      <path
        d="M 40 60 L 40 280 Q 40 295 55 295 L 145 295 Q 160 295 160 280 L 160 60 Z"
        fill={baseColor}
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="1"
      />
      
      {/* Brillo metálico lateral */}
      <path
        d="M 45 65 L 45 280 Q 45 290 55 290 L 70 290 L 70 65 Z"
        fill="white"
        opacity="0.2"
      />
      
      {/* Borde superior */}
      <ellipse cx="100" cy="60" rx="60" ry="12" fill={baseColor} />
      <ellipse cx="100" cy="58" rx="58" ry="10" fill="rgba(0,0,0,0.1)" />
      
      {/* Tapa */}
      <ellipse cx="100" cy="55" rx="62" ry="14" fill="#2a2a2a" />
      <ellipse cx="100" cy="52" rx="58" ry="11" fill="#3a3a3a" />
      
      {/* Área de texto */}
      <g transform="translate(100, 180)">
        {texts.map((text, idx) => {
          const content = typeof text === 'string' ? text : text.content;
          const fontFamily = typeof text === 'string' ? 'Bebas Neue' : (text.fontFamily || 'Bebas Neue');
          const size = typeof text === 'string' ? 20 : ((text.size || 1) * 20);
          const yOffset = typeof text === 'string' ? (idx - 1) * 30 : ((text.yPosition || 50) - 50) * 1.5;
          // Grabado laser - siempre negro/gris oscuro sobre metal
          const textColor = ['black','navy','forest'].includes(color)?'#e4e4e7':'#52525b';
          
          return (
            <text
              key={idx}
              y={yOffset}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily={fontFamily}
              fontSize={size}
              fontWeight="bold"
              fill={textColor}
              opacity="0.85"
              style={{ 
                letterSpacing: '1px'
              }}
            >
              {content}
            </text>
          );
        })}
      </g>
    </svg>
  );
};

export const TumblerPreview: React.FC<TumblerPreviewProps> = ({
  template,
  color = 'stainless',
  className = '',
  width = 200,
  height = 320
}) => {
  // A template diagram is not a product photo or a stock promise.
  return <div className={className} aria-label="Esquema de plantilla, no es foto de producto" style={{width,height}}><SimpleTumblerSVG color={color} texts={template.texts||[]}/></div>;
};
export default TumblerPreview;
