import type {Product} from '../types';
// Original application palette, not a stock or availability list.
export const REFERENCE_COLORS = [
    { name: 'NEGRO', hex: '#000000' },
    { name: 'BLANCO', hex: '#FFFFFF' },
    { name: 'ACERO', hex: '#C0C0C0' },
    { name: 'AZUL MARINO', hex: '#000080' },
    { name: 'AZUL REY', hex: '#4169E1' },
    { name: 'CELESTE', hex: '#87CEEB' },
    { name: 'ROJO', hex: '#FF0000' },
    { name: 'VINO', hex: '#800000' },
    { name: 'ROSA PASTEL', hex: '#FFD1DC' },
    { name: 'FUCSIA', hex: '#FF00FF' },
    { name: 'MORADO', hex: '#800080' },
    { name: 'LILA', hex: '#C8A2C8' },
    { name: 'AMARILLO', hex: '#FFFF00' },
    { name: 'NARANJA', hex: '#FFA500' },
    { name: 'VERDE MILITAR', hex: '#4B5320' },
    { name: 'VERDE BOTELLA', hex: '#006A4E' },
    { name: 'AQUA', hex: '#00FFFF' },
];
// Existing real photos, normalized by transparent crop and proportional resize only.
// A reference photo never changes the product's brand, price, capacity or inventory.
const PHOTO_COLORS=['NEGRO','BLANCO','ACERO','AZUL MARINO'];
export function referencePhotoColor(product:Product|undefined,color:string){
 if(!product?.illustrativeImage||product.colors.find(c=>c.name===color)?.imageUrl)return undefined;
 return PHOTO_COLORS.includes(color)?color:'NEGRO';
}
export function productPreviewImage(product:Product|undefined,color:string,ownPhoto?:string|null){if(ownPhoto)return ownPhoto;if(!product)return undefined;const actual=product.colors.find(c=>c.name===color)?.imageUrl;if(actual)return actual;const reference=referencePhotoColor(product,color);return reference?`/images/products/reference-yeti/${reference}.png`:product.imageUrl;}
export function productColorHex(product:Product|undefined,color:string){const reference=referencePhotoColor(product,color);return product?.colors.find(c=>c.name===color)?.hex||REFERENCE_COLORS.find(c=>c.name===(reference||color))?.hex;}

/** Label the visible reference, never imply it is the selected catalogue colour/model. */
export function productPreviewLabel(product:Product|undefined,color:string,ownPhoto?:string|null){
 if(ownPhoto)return undefined;
 const reference=referencePhotoColor(product,color);
 if(!reference)return undefined;
 return `Muestra YETI 30 oz ${reference.toLowerCase()}${color.trim()&&color.trim().toUpperCase()!=='OTRO'&&reference!==color?` · Solicitado: ${color.toLowerCase()}`:''}`;
}
