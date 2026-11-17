import{it,expect}from'vitest';import{productPreviewImage,productColorHex,REFERENCE_COLORS}from'../../utils/productColorPreview';
const product={illustrativeImage:true,imageUrl:'/neutral.svg',colors:[]} as any;
it('uses real reference photos without changing the original palette or inventory',()=>{expect(REFERENCE_COLORS).toHaveLength(17);expect(productPreviewImage(product,'BLANCO')).toBe('/images/products/reference-yeti/BLANCO.png');expect(productColorHex(product,'BLANCO')).toBe('#FFFFFF');expect(product.colors).toEqual([]);});
it('keeps actual photographs and own photos ahead of illustrations',()=>{expect(productPreviewImage({...product,colors:[{name:'BLANCO',hex:'#fff',imageUrl:'/actual.jpg'}]},'BLANCO')).toBe('/actual.jpg');expect(productPreviewImage(product,'BLANCO','data:own')).toBe('data:own');expect(productPreviewImage({...product,illustrativeImage:false},'BLANCO')).toBe('/neutral.svg');});

it('keeps unsupported requested colors as requests, never recolors a photo',()=>{expect(productPreviewImage(product,'ROJO')).toBe('/images/products/reference-yeti/NEGRO.png');expect(productColorHex(product,'ROJO')).toBe('#000000');});

import {productPreviewLabel} from '../../utils/productColorPreview';
it('names the visible model and colour separately from an unsupported request',()=>{expect(productPreviewLabel(product,'ROJO')).toBe('Muestra YETI 30 oz negro · Solicitado: rojo');expect(productPreviewLabel(product,'BLANCO')).toBe('Muestra YETI 30 oz blanco');});
it('does not label actual product or own photographs as YETI references',()=>{expect(productPreviewLabel({...product,colors:[{name:'ROJO',hex:'#f00',imageUrl:'/actual-red.jpg'}]},'ROJO')).toBeUndefined();expect(productPreviewLabel(product,'ROJO','data:own')).toBeUndefined();});

it('does not display the unknown-brand marker as a requested colour',()=>{expect(productPreviewLabel(product,'OTRO')).toBe('Muestra YETI 30 oz negro');});
