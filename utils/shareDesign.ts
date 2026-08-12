import type { DesignState, OrderItem } from '../types';

const defaultDesign = (): DesignState => ({ x: 50, y: 50, scale: 1, rotate: 0 });

export type SharePayloadV1 = {
  v: 1;
  productId: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  frontText: string;
  backText: string;
  frontFontId: number;
  backFontId: number;
  frontFontName: string;
  backFontName: string;
  notes?: string;
  isClientItem?: boolean;
  clientItemBrand?: string;
  clientItemColor?: string;
};

export function buildSharePayload(item: OrderItem): SharePayloadV1 {
  return {
    v: 1,
    productId: item.productId,
    colorName: item.colorName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    frontText: item.frontText,
    backText: item.backText,
    frontFontId: item.frontFontId,
    backFontId: item.backFontId,
    frontFontName: item.frontFontName,
    backFontName: item.backFontName || '',
    notes: item.notes,
    isClientItem: item.isClientItem,
    clientItemBrand: item.clientItemBrand,
    clientItemColor: item.clientItemColor
  };
}

export function encodeSharePayload(payload: SharePayloadV1): string {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeSharePayload(encoded: string): SharePayloadV1 | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const p = JSON.parse(json) as SharePayloadV1;
    if (p && p.v === 1 && p.productId) return p;
  } catch {
    /* ignore */
  }
  return null;
}

export function orderItemFromSharePayload(p: SharePayloadV1): OrderItem {
  const q = p.quantity || 1;
  const unit = p.unitPrice || 0;
  return {
    id: `share-${Date.now()}`,
    productId: p.productId,
    colorName: p.colorName,
    frontText: p.frontText || '',
    frontFontId: p.frontFontId || 1,
    frontFontName: p.frontFontName || 'Default',
    frontDesignState: defaultDesign(),
    frontLogos: [],
    backText: p.backText || '',
    backFontId: p.backFontId || 1,
    backFontName: p.backFontName,
    backDesignState: defaultDesign(),
    backLogos: [],
    quantity: q,
    unitPrice: unit,
    totalPrice: unit * q,
    notes: p.notes,
    isClientItem: p.isClientItem,
    clientItemBrand: p.clientItemBrand,
    clientItemColor: p.clientItemColor
  };
}
