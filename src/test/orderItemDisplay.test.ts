import{describe,it,expect}from'vitest';
import{itemProductLabel,itemColorLabel}from'../../utils/orderItemDisplay';
describe('orderItemDisplay',()=>{
 it('own item shows brand, never the catalog product name',()=>{
  expect(itemProductLabel({productId:'termo-generico-20oz',isClientItem:true,clientItemBrand:'YETI'},'Termo 20oz con grabado')).toBe('Producto propio · YETI');
 });
 it('own item without brand stays generic',()=>{
  expect(itemProductLabel({productId:'x',isClientItem:true})).toBe('Producto propio');
 });
 it('catalog item keeps catalog name',()=>{
  expect(itemProductLabel({productId:'termo-generico-20oz'},'Termo 20oz con grabado')).toBe('Termo 20oz con grabado');
 });
 it('real client color wins for own items',()=>{
  expect(itemColorLabel({productId:'x',isClientItem:true,colorName:'NEGRO',clientItemColor:'ROJO'})).toBe('ROJO');
 });
 it('preview color is labeled reference, never confirmed color',()=>{
  expect(itemColorLabel({productId:'x',isClientItem:true,colorName:'NEGRO',clientItemColor:''})).toBe('Color referencia: NEGRO');
 });
 it('catalog item color unchanged',()=>{
  expect(itemColorLabel({productId:'x',colorName:'NEGRO'})).toBe('NEGRO');
 });
});

it('does not expose an unknown-brand marker as a real brand or color',()=>{const item={productId:'x',isClientItem:true,clientItemBrand:'OTRO',colorName:'OTRO'};expect(itemProductLabel(item)).toBe('Producto propio');expect(itemColorLabel(item)).toBe('');});
it('does not mistake a known own brand for its missing color',()=>{expect(itemColorLabel({productId:'x',isClientItem:true,clientItemBrand:'YETI',colorName:'YETI'})).toBe('');});
