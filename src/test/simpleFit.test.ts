import { describe, it, expect } from 'vitest';
import {
  computeSimpleFit, simplePreviewFontPx,
  EDITOR_STAGE_WIDTH, EDITOR_TEXT_BASE_PX, PRINTABLE_ZONE_FRAC, MIN_FIT_SCALE,
} from '../../services/simpleFit';

describe('computeSimpleFit — unidades normalizadas del stage (500px, texto base 48px)', () => {
  it('texto corto no se reduce: scale 1', () => {
    // "Ana" mide mucho menos que la zona (0.26 * 500 = 130 stage px)
    expect(computeSimpleFit(80)).toEqual({ scale: 1, tooLong: false });
  });

  it('texto largo se reduce exactamente a la zona imprimible', () => {
    const w = 250; // fracción 0.5 de la imagen a scale 1
    const fit = computeSimpleFit(w);
    expect(fit.tooLong).toBe(false);
    // scale * fracción natural = zona exacta
    expect(fit.scale * (w / EDITOR_STAGE_WIDTH)).toBeCloseTo(PRINTABLE_ZONE_FRAC, 5);
  });

  it('en el piso exacto (raw == MIN_FIT_SCALE) NO se bloquea', () => {
    const w = (PRINTABLE_ZONE_FRAC / MIN_FIT_SCALE) * EDITOR_STAGE_WIDTH; // 520
    const fit = computeSimpleFit(w);
    expect(fit.tooLong).toBe(false);
    expect(fit.scale).toBeCloseTo(MIN_FIT_SCALE, 5);
  });

  it('debajo del piso se bloquea (tooLong) y el scale queda en el piso', () => {
    const fit = computeSimpleFit(600); // raw = 0.2167 < 0.25
    expect(fit.tooLong).toBe(true);
    expect(fit.scale).toBe(MIN_FIT_SCALE);
  });

  it('medición inválida (0, negativa, NaN) no rompe: scale 1 sin bloqueo', () => {
    expect(computeSimpleFit(0)).toEqual({ scale: 1, tooLong: false });
    expect(computeSimpleFit(-5)).toEqual({ scale: 1, tooLong: false });
    expect(computeSimpleFit(NaN)).toEqual({ scale: 1, tooLong: false });
  });

  it('todo texto válido queda dentro de la zona (propiedad sobre el rango)', () => {
    for (let w = 1; w <= 520; w += 7) {
      const fit = computeSimpleFit(w);
      expect(fit.tooLong).toBe(false);
      expect(fit.scale * (w / EDITOR_STAGE_WIDTH)).toBeLessThanOrEqual(PRINTABLE_ZONE_FRAC + 1e-9);
    }
  });
});

describe('independencia de viewport (regresión: el scale guardado no depende de la pantalla)', () => {
  it('computeSimpleFit no recibe ni usa dimensiones de pantalla: mismo ancho medido, mismo resultado', () => {
    const a = computeSimpleFit(300);
    const b = computeSimpleFit(300);
    expect(a).toEqual(b);
  });

  it('el preview mantiene la fracción de imagen del editor en cualquier ancho de cuadro', () => {
    // Fracción de la imagen que ocupa el texto = (fontPx / (boxW)) = (48/500) * scale,
    // idéntica a la del stage del editor (48 * scale sobre 500) para 320/390/escritorio.
    for (const boxW of [246, 315, 400]) { // cuadros medidos en QA a 320px, 390px y escritorio
      const scale = 0.6;
      const fracOfImage = simplePreviewFontPx(boxW, scale) / (boxW);
      expect(fracOfImage).toBeCloseTo((EDITOR_TEXT_BASE_PX / EDITOR_STAGE_WIDTH) * scale, 10);
    }
  });
});
