import type { PricingConfig } from '../types';

export interface DesignSummary {
  frontText: boolean;
  frontText2: boolean;
  frontLogos: number;
  backText: boolean;
  backText2: boolean;
  backLogos: number;
}

export interface PricedProduct {
  price: number;
  // true = el precio del producto INCLUYE el grabado de nombre al frente (tarifa confirmada por el dueño)
  engravingIncluded?: boolean;
}

// Devuelve el total en MXN, o null cuando la combinación no tiene tarifa publicada (se cotiza, nunca se inventa un cargo).
export function computeOrderPrice(product: PricedProduct, d: DesignSummary, pricing: PricingConfig, isClientItem = false): number | null {
  const frontHas = d.frontText || d.frontText2 || d.frontLogos > 0;
  const backHas = d.backText || d.backText2 || d.backLogos > 0;
  if (product.engravingIncluded && !isClientItem) {
    // Tarifas confirmadas: nombre al frente incluido; logotipo/dibujo al reverso +extraSidePrice en total (sin surcharge extra).
    if (d.frontLogos > 0) return null;        // logo al frente: sin tarifa confirmada
    if (d.backText || d.backText2) return null; // texto al reverso: sin tarifa confirmada
    if (d.backLogos > 1) return null;          // varios logos al reverso: sin tarifa confirmada
    let total = product.price;
    if (d.backLogos === 1) total += pricing.extraSidePrice;
    return total;
  }
  let total = isClientItem ? 0 : product.price;
  if (frontHas) total += pricing.baseEngravingPrice;
  if (backHas) total += pricing.extraSidePrice;
  total += (d.frontLogos + d.backLogos) * pricing.logoSurcharge;
  return total;
}
