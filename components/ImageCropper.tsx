
import React, { useState, useCallback } from 'react';
import { removeBackground } from '../utils/imageUtils';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, RotateCw, Wand2, Loader2 } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspect?: number; // Default 5/6 for products
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: any, rotation = 0): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
    0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
  );

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
        }
    }, 'image/png', 1); // PNG for transparency
  });
};

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel, aspect = 5 / 6 }) => {
  const [currentImage, setCurrentImage] = useState(imageSrc);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

    const handleRemoveBackground = async () => {
      setIsProcessing(true);
      try {
        const url = await removeBackground(currentImage);
        setCurrentImage(url);
      } catch (error: any) {
        console.error('Error removing background:', error);
        const errorMessage = error?.message || 'Error desconocido al remover el fondo';
        alert(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    };

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(currentImage, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col animate-in fade-in duration-300">
      <div className="relative flex-1 bg-[#09090b] flex items-center justify-center">
        {isProcessing && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                <Loader2 size={48} className="text-yellow-400 animate-spin mb-4"/>
                <p className="text-white font-bold uppercase tracking-widest text-sm">Removiendo Fondo...</p>
                <p className="text-zinc-400 text-xs mt-2">Esto puede tomar unos segundos</p>
            </div>
        )}
        <Cropper
          image={currentImage}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteHandler}
          onZoomChange={onZoomChange}
          objectFit="contain"
          style={{
              containerStyle: { background: '#09090b' },
              cropAreaStyle: { border: '2px solid #f59e0b', boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)' },
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-6 flex flex-col gap-6 pb-10">
          <div className="flex items-center gap-4 justify-center max-w-md mx-auto w-full">
              <ZoomIn size={20} className="text-zinc-400"/>
              <input 
                type="range" 
                value={zoom} 
                min={1} 
                max={3} 
                step={0.1} 
                onChange={(e) => setZoom(Number(e.target.value))} 
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
          </div>
          
          <div className="flex justify-center gap-4 flex-wrap">
              <button onClick={onCancel} className="px-6 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white font-bold uppercase text-xs transition-colors flex items-center gap-2">
                  <X size={16}/> Cancelar
              </button>
              
              <button onClick={() => setRotation(r => (r + 90) % 360)} className="px-4 py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-colors" title="Rotar 90°">
                  <RotateCw size={18}/>
              </button>

              <button 
                onClick={handleRemoveBackground} 
                disabled={isProcessing}
                className="px-6 py-3 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-600/50 hover:bg-purple-600 hover:text-white font-bold uppercase text-xs transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <Wand2 size={16}/> {isProcessing ? 'Procesando...' : 'Quitar Fondo'}
              </button>

              <button onClick={handleSave} className="px-10 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs transition-colors flex items-center gap-2 shadow-lg dark:shadow-none">
                  <Check size={16}/> Guardar
              </button>
          </div>
      </div>
    </div>
  );
};
