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
