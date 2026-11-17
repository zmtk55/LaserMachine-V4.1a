import { describe, it, expect } from 'vitest';
import { computeOrderPrice } from '../../services/orderPricing';

const pricing = { baseEngravingPrice: 100, extraSidePrice: 50, logoSurcharge: 50 };
const noDesign = { frontText:false, frontText2:false, frontLogos:0, backText:false, backText2:false, backLogos:0 };
const frontName = { ...noDesign, frontText:true };
const backLogo = { ...frontName, backLogos:1 };

describe('computeOrderPrice — producto con grabado incluido (tarifas Julian 9-nov)', () => {
  const generico = { price: 350, engravingIncluded: true };
  it('nombre al frente está incluido: $350 exactos, sin cargo duplicado', () => {
    expect(computeOrderPrice(generico, frontName, pricing)).toBe(350);
  });
  it('logo/dibujo al reverso suma $50 en total: $400, sin surcharge extra', () => {
    expect(computeOrderPrice(generico, backLogo, pricing)).toBe(400);
  });
  it('sin diseño cobra el precio publicado $350 (incluye el grabado, se use o no)', () => {
    expect(computeOrderPrice(generico, noDesign, pricing)).toBe(350);
  });
  it('logo al frente no tiene tarifa: null (a cotizar)', () => {
    expect(computeOrderPrice(generico, { ...noDesign, frontLogos:1 }, pricing)).toBeNull();
  });
  it('texto al reverso no tiene tarifa: null (a cotizar)', () => {
    expect(computeOrderPrice(generico, { ...frontName, backText:true }, pricing)).toBeNull();
  });
  it('varios logos al reverso no tienen tarifa: null (a cotizar)', () => {
    expect(computeOrderPrice(generico, { ...frontName, backLogos:2 }, pricing)).toBeNull();
  });
  it('no aplica a producto propio (isClientItem)', () => {
    expect(computeOrderPrice(generico, frontName, pricing, true)).toBe(100);
  });
});

describe('computeOrderPrice — producto de catálogo normal (fórmula previa intacta)', () => {
  const normal = { price: 500 };
  it('producto + frente + reverso + 1 logo = fórmula anterior', () => {
    expect(computeOrderPrice(normal, { frontText:true, frontText2:false, frontLogos:1, backText:true, backText2:false, backLogos:0 }, pricing)).toBe(500+100+50+50);
  });
  it('producto propio cobra sólo grabados', () => {
    expect(computeOrderPrice(normal, frontName, pricing, true)).toBe(100);
  });
});
