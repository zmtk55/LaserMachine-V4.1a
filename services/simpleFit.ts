/**
 * Ajuste de la ruta sencilla en unidades NORMALIZADAS del diseño.
 *
 * Sistema canónico: el stage del personalizador (components/ProductVisualizer.tsx) y de
 * la ficha técnica del pedido (components/TechnicalPreview.tsx) es FIJO: 500x600 px,
 * texto 1 con fontSize base 48px y tamaño final = 48 * design.scale. La imagen del
 * producto llena el ancho del stage (object-contain sobre lienzo 5:6). Por eso el scale
 * guardado en frontDesignState.scale ya es independiente del viewport en el editor, y
 * aquí se calcula en las MISMAS unidades: la medición se hace con el texto renderizado
 * a 48px fijos (nunca con píxeles de pantalla), así la misma combinación texto+fuente
 * produce el mismo scale y la misma validez en 320px, 390px o escritorio.
 *
 * La imagen del producto es ILUSTRATIVA (no es zona imprimible física certificada):
 * la zona de grabado se deriva de la geometría del arte neutral del termo (cuerpo
 * ≈231/800 = 0.289 del ancho de la imagen a la altura de grabado) con margen.
 */
export const EDITOR_STAGE_WIDTH = 500; // ProductVisualizer.tsx / TechnicalPreview.tsx
export const EDITOR_TEXT_BASE_PX = 48; // fontSize base del texto 1 en el editor
export const PRINTABLE_ZONE_FRAC = 0.26; // fracción del ancho de la imagen (cuerpo 0.289 con margen)
export const MIN_FIT_SCALE = 0.25; // piso de legibilidad; debajo se bloquea con aviso visible

export interface SimpleFit {
  /** scale a guardar en frontDesignState.scale (mismas unidades que el editor). */
  scale: number;
  /** true cuando ni en el piso de legibilidad cabe: no se simula grabado sobre la silueta. */
  tooLong: boolean;
}

/**
 * naturalWidthAtBase: ancho medido del texto renderizado a EDITOR_TEXT_BASE_PX con la
 * fuente ya cargada. Es una medición fija en px, sin viewport: viewport-independiente
 * por construcción.
 */
export function computeSimpleFit(naturalWidthAtBase: number): SimpleFit {
  if (!Number.isFinite(naturalWidthAtBase) || naturalWidthAtBase <= 0) return { scale: 1, tooLong: false };
  const naturalFrac = naturalWidthAtBase / EDITOR_STAGE_WIDTH; // fracción de la imagen a scale 1
  const raw = Math.min(1, PRINTABLE_ZONE_FRAC / naturalFrac);
  const tooLong = raw < MIN_FIT_SCALE;
  return { scale: tooLong ? MIN_FIT_SCALE : raw, tooLong };
}

/**
 * fontSize del preview del modal para que el texto ocupe EXACTAMENTE la misma fracción
 * de la imagen del producto que en el editor (la imagen ocupa 90% del cuadro cuadrado
 * del modal; en el stage del editor ocupa el 100%). Así la vista previa ES el pedido:
 * misma fuente, misma posición (50%, 40%) y mismo scale guardado.
 */
export function simplePreviewFontPx(boxWidthPx: number, scale: number): number {
  return boxWidthPx * (EDITOR_TEXT_BASE_PX / EDITOR_STAGE_WIDTH) * scale;
}
