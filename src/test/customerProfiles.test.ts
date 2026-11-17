import {describe,it,expect} from 'vitest';import {customerSummaries,updateCustomerProfile} from '../../utils/customerProfiles';
const order:any={id:'1',customerName:'Old',customerPhone:'123',customerEmail:'old@example.test',total:100,createdAt:'2026-11-06',pointsEarned:5};
describe('independent customer profiles',()=>{
 it('profile edits survive without rewriting order identity or history',()=>{const profiles=updateCustomerProfile([], [order],'123','New','123','new@example.test');expect(profiles[0]).toMatchObject({name:'New',email:'new@example.test'});expect(customerSummaries([order],profiles)[0]).toMatchObject({name:'New',totalSpent:100,totalOrders:1,currentPoints:5});expect(order.customerName).toBe('Old');expect(profiles[0]).not.toHaveProperty('orders');});
 it('keeps zero-order independent profiles',()=>{expect(customerSummaries([],[{id:'c',phone:'123',name:'New'} as any])[0].totalOrders).toBe(0);});
 it('archiving retains historical order',()=>{expect(customerSummaries([order],[{phone:'123',archived:true} as any])).toEqual([]);expect(order.id).toBe('1');});
});

it('orders without contact never become an invented CRM identity',()=>{expect(customerSummaries([{...order,customerPhone:'',customerName:'PRUEBA - NO FABRICAR'}],[])).toEqual([]);});
