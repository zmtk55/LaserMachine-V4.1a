import {describe,it,expect,vi} from 'vitest';
vi.mock('../../services/supabaseClient',()=>({supabase:null}));
import {BusinessWorkspace,stripOrderDisplayData} from '../../services/businessPersistence';
describe('business workspace',()=>{
 it('does not seed defaults after empty load',async()=>{
  const store={list:vi.fn().mockResolvedValue([]),save:vi.fn(),remove:vi.fn()};
  const w=new BusinessWorkspace(store as any);await w.load();w.trackInitial('lm_store_private',[{businessName:'demo'}]);await w.save('lm_store_private',[{businessName:'demo'}]);expect(store.save).not.toHaveBeenCalled();
 });
 it('preserves unknown fields and font bytes; only saves edited records',async()=>{
  const font={id:9,name:'Prueba',cssFamily:'engraving',fileData:'data:font/ttf;base64,AA==',privateLicense:'keep'};
  const store={list:vi.fn(async(t)=>t==='lm_fonts'?[{id:'9',revision:2,data:font}]:[]),save:vi.fn(async(_t,r)=>({...r,revision:r.revision+1})),remove:vi.fn()};
  const w=new BusinessWorkspace(store as any);await w.load();w.trackInitial('lm_fonts',[font]);await w.save('lm_fonts',[{id:9,name:'Renombrada',cssFamily:'engraving',fileData:font.fileData}]);expect(store.save).toHaveBeenCalledWith('lm_fonts',expect.objectContaining({revision:2,data:expect.objectContaining({privateLicense:'keep',fileData:font.fileData})}));
 });
 it('blocks saves before successful load',async()=>{
  const store={list:vi.fn().mockRejectedValue(Error('offline')),save:vi.fn()};const w=new BusinessWorkspace(store as any);await expect(w.load()).rejects.toThrow();await expect(w.save('lm_fonts',[])).rejects.toThrow();expect(store.save).not.toHaveBeenCalled();
 });
});

it('never persists hydrated private URLs over immutable asset references',()=>{const order={items:[{backgroundAssetId:'bg',customBackgroundImage:'data:private',frontLogos:[{assetId:'asset',originalAssetId:'original',url:'data:render',originalUrl:'data:original',state:{x:1}}],backLogos:[]}]};const stored=stripOrderDisplayData('lm_orders',order);expect(stored.items[0].frontLogos[0]).not.toHaveProperty('url');expect(stored.items[0].frontLogos[0].originalAssetId).toBe('original');expect(stored.items[0]).not.toHaveProperty('customBackgroundImage');expect(order.items[0].frontLogos[0].url).toBe('data:render');});

it('retries a partially failed save without resending already confirmed records',async()=>{
 const rows=[{id:'a',revision:3,data:{id:'a',name:'A',unknown:'keep'}},{id:'b',revision:7,data:{id:'b',name:'B'}}];
 const store={list:vi.fn(async(t)=>t==='lm_products'?rows:[]),save:vi.fn().mockImplementationOnce(async(_t,r)=>({...r,revision:4})).mockRejectedValueOnce(Error('offline')).mockImplementation(async(_t,r)=>({...r,revision:r.revision+1})),remove:vi.fn()};
 const w=new BusinessWorkspace(store as any);await w.load();const edited=[{id:'a',name:'A2'},{id:'b',name:'B2'}];w.trackInitial('lm_products',rows.map(r=>r.data));await expect(w.save('lm_products',edited)).rejects.toThrow('offline');await w.save('lm_products',edited);expect(store.save.mock.calls.map(c=>c[1].id)).toEqual(['a','b','b']);expect(store.save.mock.calls[2][1].revision).toBe(7);expect(store.save.mock.calls[0][1].data.unknown).toBe('keep');await w.save('lm_products',edited);expect(store.save).toHaveBeenCalledTimes(3);
});
