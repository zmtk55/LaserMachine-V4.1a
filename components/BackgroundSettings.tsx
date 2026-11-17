import React, { useContext, useRef, useState } from 'react';
import { BackgroundContext } from '../contexts/BackgroundContext';

export const BackgroundSettings: React.FC = () => {
  const { bgUrl, setBackgroundFromFile, setBackgroundFromUrl, resetBackground, patternOn, setPatternOn, status } = useContext(BackgroundContext);
  const [query, setQuery] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if(f.size>5_000_000||!f.type.startsWith('image/')){setStatusMessage('Usa una imagen de hasta5MB.');return;}
    console.debug('BackgroundSettings: file selected', f.name, f.size);
    setStatusMessage('Procesando archivo...');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        console.debug('BackgroundSettings: file read complete, length=', (dataUrl || '').length);
        // Quick validation: preload image to ensure the data URL is valid
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = (ev) => reject(new Error('Image preload failed'));
          img.src = dataUrl;
        });
        setBackgroundFromFile(dataUrl);
        setStatusMessage('Fondo preparado. Usa Guardar cambios en Supabase.');
      } catch (err) {
        console.error('BackgroundSettings: error procesando archivo', err);
        setStatusMessage('Error procesando archivo');
      }
    };
    reader.readAsDataURL(f);
  };

  const chooseImageUrl = async () => {
    try {
      const url=new URL(query.trim());
      if(url.protocol!=='https:'||url.username||url.password)throw Error('Usa la dirección HTTPS de una imagen.');
      setStatusMessage('Comprobando imagen…');
      await new Promise<void>((resolve,reject)=>{const img=new Image();const timer=setTimeout(()=>reject(Error('La imagen tardó demasiado.')),15000);img.onload=()=>{clearTimeout(timer);resolve();};img.onerror=()=>{clearTimeout(timer);reject(Error('No se pudo cargar esa imagen. El fondo anterior se conserva.'));};img.src=url.href;});
      setBackgroundFromUrl(url.href);setStatusMessage('Fondo preparado. Guarda los cambios para confirmarlo.');
    } catch(error){setStatusMessage(error instanceof Error?error.message:'No se pudo cargar la imagen.');}
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black uppercase tracking-widest text-zinc-900 dark:text-white">
        Imagen de fondo
      </h3>
      <div className="flex flex-wrap items-center gap-3">
        <button 
          onClick={() => fileRef.current?.click()} 
          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-shadow"
        >
          Subir imagen
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <input 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          aria-label="URL de imagen de fondo" placeholder="https://sitio.com/imagen.jpg" 
          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
        />
        <button 
          onClick={chooseImageUrl} 
          className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-shadow"
        >
          Usar URL de imagen
        </button>
        <button 
          onClick={resetBackground} 
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Restablecer
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-900 dark:text-white">
        <input 
          type="checkbox" 
          checked={patternOn} 
          onChange={e => setPatternOn(e.target.checked)} 
          className="rounded border-zinc-300 dark:border-zinc-600 text-amber-500 focus:ring-amber-500" 
        /> 
        <span className="font-bold uppercase text-xs tracking-widest">Mostrar patrón de puntos</span>
      </label>
      <div className="mt-2">
        <small className="text-zinc-500 dark:text-zinc-400 font-bold uppercase text-xs tracking-widest">Vista previa:</small>
        <div className="mt-2 w-60 h-32 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center rounded-xl overflow-hidden shadow-lg">
          {bgUrl ? <img alt="Imagen de fondo actual" src={bgUrl} className="w-full h-full object-cover" /> : <span className="text-zinc-400 dark:text-zinc-500 text-sm">No hay fondo</span>}
        </div>
        <div role="status" className="text-xs">{status}</div>
        {statusMessage && <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">{statusMessage}</div>}
      </div>
    </div>
  );
};

export default BackgroundSettings;
