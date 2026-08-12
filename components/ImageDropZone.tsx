import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Check, Wand2, Crop, Loader2 } from 'lucide-react';
import { removeBackground } from '../utils/imageUtils';

interface ImageDropZoneProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  showPreview?: boolean;
  onCrop?: (url: string) => void;
}

export const ImageDropZone: React.FC<ImageDropZoneProps> = ({
  value,
  onChange,
  label = 'Imagen del producto',
  placeholder = 'Arrastra una imagen aquí o haz clic para seleccionar',
  className = '',
  aspectRatio = 'square',
  showPreview = true,
  onCrop
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(ev.target?.result as string);
      setIsLoading(false);
    };
    reader.onerror = () => {
      alert('Error al cargar la imagen');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = ''; // Reset input
  }, [processFile]);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleRemoveBackground = async () => {
    if (!value) return;
    setIsProcessing(true);
    try {
      const url = await removeBackground(value);
      onChange(url);
    } catch (error: any) {
      console.error('Error removing background:', error);
      // Show more specific error message
      const errorMessage = error?.message || 'Error desconocido al remover el fondo';
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
          {label}
        </label>
      )}
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-200 group
          ${aspectClasses[aspectRatio]}
          ${isDragging 
            ? 'border-amber-500 bg-amber-500/10 scale-[1.02]' 
            : value 
              ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900' 
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-900/50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Image Preview */}
        {!isLoading && value && showPreview && (
          <>
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-full object-contain p-2"
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                title="Cambiar imagen"
              >
                <UploadCloud className="w-5 h-5" />
              </button>
              {value && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBackground();
                    }}
                    disabled={isProcessing}
                    className="p-2 bg-purple-500/80 hover:bg-purple-500 rounded-lg text-white transition-colors disabled:opacity-50"
                    title="Quitar fondo"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  </button>
                  {onCrop && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCrop(value);
                      }}
                      className="p-2 bg-amber-500/80 hover:bg-amber-500 rounded-lg text-white transition-colors"
                      title="Recortar imagen"
                    >
                      <Crop className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-colors"
                title="Eliminar imagen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && !value && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center mb-3
              ${isDragging 
                ? 'bg-amber-500 text-white' 
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
              }
              transition-colors
            `}>
              {isDragging ? <Check className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              {isDragging ? 'Suelta la imagen aquí' : placeholder}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              JPG, PNG, WEBP • Máx 5MB
            </p>
          </div>
        )}

        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-amber-500/5 pointer-events-none" />
        )}
      </div>

      {/* URL Input Alternative */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 relative">
          <ImageIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="O pega una URL de imagen..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        {value && (
          <button
            onClick={handleClear}
            className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
            title="Limpiar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageDropZone;
