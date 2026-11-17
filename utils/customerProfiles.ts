import {CustomerProfile,Order} from '../types';
/** Independent CRM profiles override presentation, never rewrite historical orders. */
export function customerSummaries(orders:Order[],profiles:CustomerProfile[]){
 const map=new Map<string,any>();
 for(const p of profiles)if(!(p as any).archived)map.set(p.phone,{...p,email:p.email||'-',totalOrders:0,totalSpent:0,lastOrderDate:'',orders:[],pointsEarned:0,pointsRedeemed:0});
 const archived=new Set(profiles.filter(p=>(p as any).archived).map(p=>p.phone));
 for(const o of orders){if(!o.customerPhone?.trim())continue;if(archived.has(o.customerPhone))continue;let c=map.get(o.customerPhone);if(!c){c={name:o.customerName,phone:o.customerPhone,email:o.customerEmail||'-',totalOrders:0,totalSpent:0,lastOrderDate:o.createdAt,orders:[],pointsEarned:0,pointsRedeemed:0};map.set(o.customerPhone,c);}c.totalOrders++;c.totalSpent+=o.total;c.orders.push(o);c.pointsEarned+=o.pointsEarned||0;c.pointsRedeemed+=o.pointsRedeemed||0;if(o.createdAt>c.lastOrderDate)c.lastOrderDate=o.createdAt;}
 return [...map.values()].map(c=>({...c,currentPoints:Math.max(0,c.pointsEarned-c.pointsRedeemed)}));
}
export function updateCustomerProfile(profiles:CustomerProfile[],orders:Order[],phone:string,name:string,newPhone:string,email:string){
 const old=profiles.find(p=>p.phone===phone);const summary=customerSummaries(orders,profiles).find(p=>p.phone===phone);
 const next={...(summary??{}),...(old??{}),id:old?.id??`customer-${crypto.randomUUID()}`,name,phone:newPhone,email,tags:old?.tags??[],loyaltyPoints:old?.loyaltyPoints??0};delete next.orders;delete next.currentPoints;return old?profiles.map(p=>p===old?next:p):[...profiles,next];
}
