import React, { useRef, useEffect, useState } from 'react';
import { DesignTemplate } from '../types';

interface TumblerMockup3DProps {
  template: DesignTemplate;
  color?: string;
  width?: number;
  height?: number;
  showGrid?: boolean;
  className?: string;
}

const TUMBLER_COLORS = {
  'stainless': { base: '#C0C0C0', gradient: 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 50%, #A0A0A0 100%)', shadow: 'rgba(0,0,0,0.3)' },
  'black': { base: '#1a1a1a', gradient: 'linear-gradient(135deg, #333 0%, #1a1a1a 50%, #000 100%)', shadow: 'rgba(0,0,0,0.5)' },
  'navy': { base: '#1e3a5f', gradient: 'linear-gradient(135deg, #2d4a6f 0%, #1e3a5f 50%, #0f1f3f 100%)', shadow: 'rgba(0,0,0,0.4)' },
  'white': { base: '#f5f5f5', gradient: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #e0e0e0 100%)', shadow: 'rgba(0,0,0,0.2)' },
  'pink': { base: '#f8c8dc', gradient: 'linear-gradient(135deg, #ffe4ec 0%, #f8c8dc 50%, #f0a8c8 100%)', shadow: 'rgba(248,200,220,0.4)' },
  'teal': { base: '#008080', gradient: 'linear-gradient(135deg, #20b2aa 0%, #008080 50%, #006666 100%)', shadow: 'rgba(0,128,128,0.4)' },
  'copper': { base: '#b87333', gradient: 'linear-gradient(135deg, #cd853f 0%, #b87333 50%, #8b5a2b 100%)', shadow: 'rgba(184,115,51,0.4)' },
  'gold': { base: '#d4af37', gradient: 'linear-gradient(135deg, #f4d03f 0%, #d4af37 50%, #b8860b 100%)', shadow: 'rgba(212,175,55,0.4)' },
};

export const TumblerMockup3D: React.FC<TumblerMockup3DProps> = ({
  template,
  color = 'stainless',
  width = 400,
  height = 500,
  showGrid = false,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const tumblerStyle = TUMBLER_COLORS[color as keyof typeof TUMBLER_COLORS] || TUMBLER_COLORS.stainless;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with pixel ratio for sharpness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const tumblerWidth = width * 0.65;
    const tumblerHeight = height * 0.85;
    const topY = (height - tumblerHeight) / 2;
    
    // Draw shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX, topY + tumblerHeight + 15, tumblerWidth * 0.6, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = tumblerStyle.shadow;
    ctx.filter = 'blur(15px)';
    ctx.fill();
    ctx.restore();
    
    // Draw tumbler body with 3D effect
    const gradient = ctx.createLinearGradient(centerX - tumblerWidth/2, 0, centerX + tumblerWidth/2, 0);
    const colorStops = tumblerStyle.gradient.match(/#[a-fA-F0-9]{6}/g) || ['#C0C0C0', '#808080', '#404040'];
    gradient.addColorStop(0, colorStops[2] || '#404040');
    gradient.addColorStop(0.2, colorStops[1] || '#808080');
    gradient.addColorStop(0.5, colorStops[0] || '#C0C0C0');
    gradient.addColorStop(0.8, colorStops[1] || '#808080');
    gradient.addColorStop(1, colorStops[2] || '#404040');
    
    // Main body
    ctx.beginPath();
    const cornerRadius = 30;
    ctx.moveTo(centerX - tumblerWidth/2 + cornerRadius, topY + 60);
    ctx.lineTo(centerX + tumblerWidth/2 - cornerRadius, topY + 60);
    ctx.quadraticCurveTo(centerX + tumblerWidth/2, topY + 60, centerX + tumblerWidth/2, topY + 60 + cornerRadius);
    ctx.lineTo(centerX + tumblerWidth/2, topY + tumblerHeight - cornerRadius);
    ctx.quadraticCurveTo(centerX + tumblerWidth/2, topY + tumblerHeight, centerX + tumblerWidth/2 - cornerRadius, topY + tumblerHeight);
    ctx.lineTo(centerX - tumblerWidth/2 + cornerRadius, topY + tumblerHeight);
    ctx.quadraticCurveTo(centerX - tumblerWidth/2, topY + tumblerHeight, centerX - tumblerWidth/2, topY + tumblerHeight - cornerRadius);
    ctx.lineTo(centerX - tumblerWidth/2, topY + 60 + cornerRadius);
    ctx.quadraticCurveTo(centerX - tumblerWidth/2, topY + 60, centerX - tumblerWidth/2 + cornerRadius, topY + 60);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Metallic shine overlay
    const shineGradient = ctx.createLinearGradient(centerX - tumblerWidth/2, 0, centerX + tumblerWidth/2, 0);
    shineGradient.addColorStop(0, 'rgba(255,255,255,0)');
    shineGradient.addColorStop(0.3, 'rgba(255,255,255,0.1)');
    shineGradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
    shineGradient.addColorStop(0.7, 'rgba(255,255,255,0.1)');
    shineGradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shineGradient;
    ctx.fill();
    
    // Top rim
    ctx.beginPath();
    ctx.ellipse(centerX, topY + 60, tumblerWidth/2 - 5, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = colorStops[0];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Inner rim
    ctx.beginPath();
    ctx.ellipse(centerX, topY + 60, tumblerWidth/2 - 15, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
    
    // Lid
    const lidGradient = ctx.createLinearGradient(centerX - tumblerWidth/2, 0, centerX + tumblerWidth/2, 0);
    lidGradient.addColorStop(0, '#1a1a1a');
    lidGradient.addColorStop(0.3, '#333');
    lidGradient.addColorStop(0.5, '#444');
    lidGradient.addColorStop(0.7, '#333');
    lidGradient.addColorStop(1, '#1a1a1a');
    
    ctx.beginPath();
    ctx.ellipse(centerX, topY + 35, tumblerWidth/2 - 2, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = lidGradient;
    ctx.fill();
    
    // Lid top
    ctx.beginPath();
    ctx.ellipse(centerX, topY + 25, tumblerWidth/2 - 10, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();
    
    // Slider
    ctx.beginPath();
    ctx.roundRect(centerX - 25, topY + 15, 50, 20, 4);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Design area clip
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(centerX - tumblerWidth/2 + 20, topY + 100, tumblerWidth - 40, tumblerHeight - 150, 10);
    ctx.clip();
    
    // Grid lines if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 10; i++) {
        const y = topY + 100 + (i * (tumblerHeight - 150) / 10);
        ctx.beginPath();
        ctx.moveTo(centerX - tumblerWidth/2 + 20, y);
        ctx.lineTo(centerX + tumblerWidth/2 - 20, y);
        ctx.stroke();
      }
    }
    
    // Render template texts
    if (template?.texts) {
      template.texts.forEach((textObj, idx) => {
        const content = typeof textObj === 'string' ? textObj : textObj.content;
        const fontFamily = typeof textObj === 'string' ? 'Bebas Neue' : (textObj.fontFamily || 'Bebas Neue');
        const size = typeof textObj === 'string' ? 1 : (textObj.size || 1);
        const yPosition = typeof textObj === 'string' ? 50 + (idx * 20) : (textObj.yPosition || 50);
        const textColor = typeof textObj === 'string' ? '#ffffff' : (textObj.color || '#ffffff');
        
        const fontSize = 16 * size;
        const y = topY + 100 + ((yPosition / 100) * (tumblerHeight - 150));
        
        ctx.save();
        ctx.font = `bold ${fontSize}px "${fontFamily}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text shadow for depth
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText(content, centerX + 2, y + 2);
        
        // Main text
        ctx.fillStyle = textColor;
        ctx.fillText(content, centerX, y);
        
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText(content, centerX, y - 1);
        
        ctx.restore();
      });
    }
    
    ctx.restore();
    
    // Reflection/glare overlay
    const glareGradient = ctx.createLinearGradient(0, topY, 0, topY + tumblerHeight);
    glareGradient.addColorStop(0, 'rgba(255,255,255,0.1)');
    glareGradient.addColorStop(0.5, 'rgba(255,255,255,0)');
    glareGradient.addColorStop(1, 'rgba(255,255,255,0.05)');
    ctx.fillStyle = glareGradient;
    ctx.fill();
    
  }, [template, color, width, height, showGrid]);

  return (
    <div 
      className={`relative ${className}`}
      style={{ width, height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas
        ref={canvasRef}
        style={{ 
          width, 
          height, 
          display: 'block',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.3s ease'
        }}
      />
      
      {/* Color indicator */}
      <div className="absolute bottom-2 right-2 flex gap-1">
        {Object.keys(TUMBLER_COLORS).map((c) => (
          <div
            key={c}
            className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-transform ${
              color === c ? 'border-yellow-400 scale-110' : 'border-transparent hover:scale-110'
            }`}
            style={{ backgroundColor: TUMBLER_COLORS[c as keyof typeof TUMBLER_COLORS].base }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
};

export default TumblerMockup3D;
