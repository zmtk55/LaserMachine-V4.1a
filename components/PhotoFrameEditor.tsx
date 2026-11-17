import{useModalFocus}from'../utils/useModalFocus';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Check, ZoomIn, ZoomOut, Move } from 'lucide-react';

// Encuadre de foto de producto propio: arrastre con un dedo, zoom con dos dedos,
// rueda o control deslizante, y recorte fijo 5:6 (misma proporción del lienzo 500x600).
// Sin dependencias nuevas: Pointer Events + canvas nativo.

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

interface Props {
  imageSrc: string;
  onApply: (croppedDataUrl: string) => void;
  onUseOriginal: () => void;
  onCancel: () => void;
  aspectW?: number;
  aspectH?: number;
  exportPng?: boolean;
  title?: string;
}

const PhotoFrameEditor: React.FC<Props> = ({ imageSrc, onApply, onUseOriginal, onCancel, aspectW = 5, aspectH = 6, exportPng = false, title = 'Ajusta tu foto' }) => {
  const dialogRef=useRef<HTMLDivElement>(null);useModalFocus(true,dialogRef,onCancel);
  const FRAME_W = aspectW;
  const FRAME_H = aspectH;
  const EXPORT_W = aspectW >= aspectH ? 1200 : Math.round(1200 * aspectW / aspectH);
  const EXPORT_H = aspectW >= aspectH ? Math.round(1200 * aspectH / aspectW) : 1200;
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; zoom: number; cx: number; cy: number; ox: number; oy: number } | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [viewSize, setViewSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setExportError('No se pudo cargar la foto. Vuelve a elegirla.');
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    const measure = () => {
      const el = viewportRef.current;
      if (el) setViewSize({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // contain: zoom 1 muestra la foto completa dentro del marco; el relleno blanco coincide con la exportacion
  const baseScale = imgSize && viewSize ? Math.min(viewSize.w / imgSize.w, viewSize.h / imgSize.h) : 1;

  const clampOffset = useCallback((ox: number, oy: number, z: number) => {
    if (!imgSize || !viewSize) return { x: 0, y: 0 };
    const dispW = imgSize.w * baseScale * z;
    const dispH = imgSize.h * baseScale * z;
    const maxX = Math.max(0, (dispW - viewSize.w) / 2);
    const maxY = Math.max(0, (dispH - viewSize.h) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, ox)), y: Math.min(maxY, Math.max(-maxY, oy)) };
  }, [imgSize, viewSize, baseScale]);

  const applyZoom = useCallback((z: number) => {
    const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
    setZoom(nz);
    setOffset(prev => clampOffset(prev.x, prev.y, nz));
  }, [clampOffset]);

  const onPointerDown = (e: React.PointerEvent) => {
    try { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); } catch {}
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) {
      dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      pinchRef.current = null;
    } else if (pointersRef.current.size === 2) {
      dragRef.current = null;
      const [a, b] = Array.from(pointersRef.current.values()) as { x: number; y: number }[];
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        zoom,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
        ox: offset.x,
        oy: offset.y,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchRef.current && pointersRef.current.size >= 2) {
      const [a, b] = Array.from(pointersRef.current.values()) as { x: number; y: number }[];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const p = pinchRef.current;
      const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, p.zoom * (p.dist > 0 ? dist / p.dist : 1)));
      setZoom(nz);
      setOffset(clampOffset(p.ox + (a.x + b.x) / 2 - p.cx, p.oy + (a.y + b.y) / 2 - p.cy, nz));
    } else if (dragRef.current) {
      const d = dragRef.current;
      setOffset(clampOffset(d.ox + e.clientX - d.x, d.oy + e.clientY - d.y, zoom));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) dragRef.current = null;
    else if (pointersRef.current.size === 1) {
      const [p] = Array.from(pointersRef.current.values()) as { x: number; y: number }[];
      dragRef.current = { x: p.x, y: p.y, ox: offset.x, oy: offset.y };
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    applyZoom(zoom * (e.deltaY < 0 ? 1.08 : 0.92));
  };

  const handleApply = () => {
    const img = imgRef.current;
    if (!img || !imgSize || !viewSize || !img.naturalWidth) { setExportError('La foto aún no está lista. Espera un momento.'); return; }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = EXPORT_W;
      canvas.height = EXPORT_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setExportError('No se pudo preparar el recorte.'); return; }
      if (!exportPng) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, EXPORT_W, EXPORT_H); }
      const k = (EXPORT_W / viewSize.w) * baseScale * zoom;
      ctx.setTransform(k, 0, 0, k, EXPORT_W / 2 + offset.x * (EXPORT_W / viewSize.w), EXPORT_H / 2 + offset.y * (EXPORT_H / viewSize.h));
      ctx.drawImage(img, -imgSize.w / 2, -imgSize.h / 2);
      onApply(exportPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.92));
    } catch {
      setExportError('No se pudo aplicar el recorte. Intenta con otra foto.');
    }
  };

  const ready = !!(imgSize && viewSize);
  const dispW = ready ? imgSize!.w * baseScale * zoom : 0;
  const dispH = ready ? imgSize!.h * baseScale * zoom : 0;

  return (
    <div className="lm-customizer-modal lm-photo-editor fixed inset-0 z-[280] bg-black/85 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Ajustar encuadre de la foto">
      <div ref={dialogRef} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center gap-3">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{title}</h3>
          <button aria-label="Cancelar ajuste de foto" onClick={onCancel} className="p-2 text-zinc-500"><X size={24} /></button>
        </div>
        <p className="text-xs text-zinc-500 flex items-center gap-1.5"><Move size={14} /> Arrastra para mover. Pellizca con dos dedos o usa el control para acercar.</p>
        <div
          ref={viewportRef}
          className="relative w-full overflow-hidden rounded-xl bg-white touch-none select-none"
          style={{ aspectRatio: `${FRAME_W} / ${FRAME_H}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          {ready && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt=""
              draggable={false}
              className="absolute pointer-events-none max-w-none max-h-none"
              style={{
                width: `${dispW}px`,
                height: `${dispH}px`,
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
          {!ready && <p className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">Cargando foto…</p>}
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Alejar" onClick={() => applyZoom(zoom / 1.15)} className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"><ZoomOut size={18} /></button>
          <input
            aria-label="Nivel de acercamiento"
            type="range"
            min={MIN_ZOOM * 100}
            max={MAX_ZOOM * 100}
            value={Math.round(zoom * 100)}
            onChange={(e) => applyZoom(Number(e.target.value) / 100)}
            className="flex-1 accent-yellow-400"
          />
          <button aria-label="Acercar" onClick={() => applyZoom(zoom * 1.15)} className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"><ZoomIn size={18} /></button>
        </div>
        {exportError && <p role="alert" className="text-red-500 text-sm">{exportError}</p>}
        <div className="flex flex-col gap-2">
          <button onClick={handleApply} disabled={!ready} className="bg-yellow-400 text-black rounded-xl font-bold p-3 flex items-center justify-center gap-2 disabled:opacity-40"><Check size={18} /> Usar este encuadre</button>
          <button onClick={onUseOriginal} className="border border-zinc-400 dark:border-zinc-600 rounded-xl p-3 text-zinc-700 dark:text-zinc-200">Usar foto completa sin recorte</button>
        </div>
      </div>
    </div>
  );
};

export default PhotoFrameEditor;
