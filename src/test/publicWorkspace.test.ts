import {describe,it,expect,vi,beforeEach} from 'vitest';
const api=vi.hoisted(()=>({from:vi.fn()}));
vi.mock('../../services/supabaseClient',()=>({supabase:api}));
import {loadPublicWorkspace} from '../../services/publicWorkspace';
describe('public workspace',()=>{
 beforeEach(()=>api.from.mockReset());
 it('reads only explicit projections, skips own orders for anon',async()=>{api.from.mockImplementation(()=>({select:()=>({order:()=>({range:async()=>({data:[],error:null})})})}));const data=await loadPublicWorkspace(false);expect(api.from.mock.calls.map(c=>c[0])).toEqual(['lm_catalog','lm_font_catalog','lm_storefront','lm_public_pricing','lm_public_content']);expect(data.content.banners).toEqual([]);expect(data.orders).toEqual([]);});
 it('loads owner-filtered orders for signed-in customers',async()=>{api.from.mockImplementation(t=>({select:()=>({order:()=>({range:async()=>({data:t==='lm_my_orders'?[{data:{id:'own'}}]:[],error:null})})})}));expect((await loadPublicWorkspace(true)).orders).toEqual([{id:'own'}]);});
 it('fails closed rather than swallowing one failed source',async()=>{api.from.mockImplementation(()=>({select:()=>({order:()=>({range:async()=>({data:null,error:Error('denied')})})})}));await expect(loadPublicWorkspace(false)).rejects.toThrow('denied');});
 it('marks public stock as availability, never literal inventory quantity',async()=>{api.from.mockImplementation(t=>({select:()=>({order:()=>({range:async()=>({data:t==='lm_catalog'?[{data:{id:'p1',colors:[{stock:1}]}}]:[],error:null})})})}));const data=await loadPublicWorkspace(false);expect(data.products[0].availabilityOnly).toBe(true);});
});
