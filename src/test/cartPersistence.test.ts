import {describe,it,expect,vi} from 'vitest';
import {CART_KEY,readCart,writeCart} from '../../services/cartPersistence';
import type {OrderItem} from '../../types';
const item:OrderItem={id:'one',productId:'real',colorName:'NEGRO',frontText:'JULIAN',backText:'REVERSO',frontFontId:15,backFontId:15,frontFontName:'Comic Sans',frontDesignState:{x:42,y:38,scale:1.2,rotate:90},backDesignState:{x:50,y:60,scale:.8,rotate:180},frontLogos:[{id:'logo',url:'data:image/png;base64,abc',originalUrl:'data:image/png;base64,def',state:{x:50,y:50,rotate:0,scale:.6}}],backLogos:[],quantity:2,unitPrice:100,totalPrice:200,isClientItem:true,customBackgroundImage:'data:image/png;base64,photo'};
function store(raw:string|null=null){let data=raw;return {getItem:vi.fn(()=>data),setItem:vi.fn((_k:string,v:string)=>{data=v;}),removeItem:vi.fn(()=>{data=null;})};}
describe('local cart persistence',()=>{
 it('restores full design/photo/rotation/font/quantity exactly',()=>{const s=store();expect(writeCart(s,[item])).toBe('');expect(readCart(s)).toEqual({items:[item],error:''});expect(s.setItem).toHaveBeenCalledWith(CART_KEY,expect.any(String));});
 it('can recover the PR legacy array without importing its backend sync',()=>{expect(readCart(store(JSON.stringify([item]))).items).toEqual([item]);});
 it('clearing the cart removes the saved copy, so deleted items do not return',()=>{const s=store(JSON.stringify([item]));expect(writeCart(s,[])).toBe('');expect(readCart(s).items).toEqual([]);});
 it('reports quota errors and retains the previous saved version',()=>{const s=store(JSON.stringify([item]));s.setItem.mockImplementation(()=>{throw new DOMException('Full','QuotaExceededError');});expect(writeCart(s,[{...item,quantity:4}])).toContain('No se pudo guardar');expect(readCart(s).items[0].quantity).toBe(2);});
 it('does not claim that temporary image object URLs survive a restart',()=>{const s=store();expect(writeCart(s,[{...item,customBackgroundImage:'blob:https://site/image'}])).toContain('No se pudo guardar');expect(s.setItem).not.toHaveBeenCalled();});
 it.each(['{broken',JSON.stringify([{id:'bad'}]),JSON.stringify([item,item]),JSON.stringify({version:2,items:[item]})])('preserves unreadable data and reports the error',raw=>{const s=store(raw);expect(readCart(s)).toEqual({items:[],error:expect.stringContaining('No se pudo recuperar')});expect(s.setItem).not.toHaveBeenCalled();expect(s.removeItem).not.toHaveBeenCalled();});
 it('reports storage denial',()=>{const s=store();s.getItem.mockImplementation(()=>{throw Error('Denied');});expect(readCart(s).error).toBeTruthy();s.removeItem.mockImplementation(()=>{throw Error('Denied');});expect(writeCart(s,[])).toContain('No se pudo guardar');});
});
