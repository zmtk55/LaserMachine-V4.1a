import React, { useContext, useRef, useState } from 'react';
import { BackgroundContext } from '../contexts/BackgroundContext';
import { storage } from '../firebaseConfig';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';

export const BackgroundSettings: React.FC = () => {
  const { bgUrl, setBackgroundFromFile, setBackgroundFromUrl, resetBackground, patternOn, setPatternOn } = useContext(BackgroundContext);
  const [query, setQuery] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
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
        // Try upload to Firebase Storage if available
        if (storage) {
          try {
            setStatusMessage('Subiendo a Firebase Storage...');
            const name = `backgrounds/bg_${Date.now()}`;
            const r = storageRef(storage, name);
            await uploadString(r, dataUrl, 'data_url');
            const url = await getDownloadURL(r);
            console.debug('BackgroundSettings: uploaded to firebase, url=', url);
            setBackgroundFromUrl(url);
            setStatusMessage('Subida completada (Firebase)');
            return;
          } catch (err) {
            console.warn('Firebase upload failed, falling back to local:', err);
            setStatusMessage('La subida a Firebase falló, usando local fallback');
          }
        }
        // fallback local
        setBackgroundFromFile(dataUrl);
        setStatusMessage('Fondo establecido localmente');
      } catch (err) {
        console.error('BackgroundSettings: error procesando archivo', err);
        setStatusMessage('Error procesando archivo');
      }
    };
    reader.readAsDataURL(f);
  };

  const chooseUnsplash = () => {
    const u = `https://source.unsplash.com/1600x900/?${encodeURIComponent(query || 'landscape')}`;
    console.debug('BackgroundSettings: choosing unsplash url=', u);
    setStatusMessage('Cargando Unsplash...');
    // Try fetch -> blob -> objectURL for more robust loading (avoids crossOrigin issues)
    (async () => {
      try {
        const resp = await fetch(u, { cache: 'no-store' });
        if (!resp.ok) throw new Error('Fetch failed: ' + resp.status);
        const blob = await resp.blob();
        const objectUrl = URL.createObjectURL(blob);
        setBackgroundFromUrl(objectUrl);
        setStatusMessage('Fondo Unsplash aplicado');
      } catch (err) {
        console.warn('BackgroundSettings: Unsplash fetch failed, falling back to direct URL', err);
        // Fallback: apply direct URL (CSS background may still load even if fetch failed)
        setBackgroundFromUrl(u);
        setStatusMessage('Fondo Unsplash aplicado (fallback)');
      }
    })();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black uppercase tracking-widest text-zinc-900 dark:text-white">
        Fondo del sistema (global)
      </h3>
      <div className="flex flex-wrap items-center gap-3">
        <button 
          onClick={() => fileRef.current?.click()} 
          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-shadow"
        >
          Subir desde Mac
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        <input 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          placeholder="Unsplash: ej. city, abstract, pattern" 
          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
        />
        <button 
          onClick={chooseUnsplash} 
          className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-shadow"
        >
          Usar Unsplash
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
        <span className="font-bold uppercase text-xs tracking-widest">Mostrar patrón de dots</span>
      </label>
      <div className="mt-2">
        <small className="text-zinc-500 dark:text-zinc-400 font-bold uppercase text-xs tracking-widest">Preview:</small>
        <div className="mt-2 w-60 h-32 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center rounded-xl overflow-hidden shadow-lg">
          {bgUrl ? <img src={bgUrl} className="w-full h-full object-cover" /> : <span className="text-zinc-400 dark:text-zinc-500 text-sm">No hay fondo</span>}
        </div>
        {statusMessage && <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">{statusMessage}</div>}
      </div>
    </div>
  );
};

export default BackgroundSettings;
