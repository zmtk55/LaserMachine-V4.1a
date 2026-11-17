import {Order,OrderStatus} from '../types';
export const localDayKey=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function orderMonthTotals(orders:Order[],now=new Date()){
 const start=new Date(now.getFullYear(),now.getMonth(),1),previous=new Date(now.getFullYear(),now.getMonth()-1,1),end=new Date(now.getFullYear(),now.getMonth()+1,1);
 const current=orders.filter(o=>{const d=new Date(o.createdAt);return o.status!==OrderStatus.CANCELLED&&d>=start&&d<end;}),prior=orders.filter(o=>{const d=new Date(o.createdAt);return o.status!==OrderStatus.CANCELLED&&d>=previous&&d<start;});
 const amount=(a:Order[])=>a.reduce((sum,o)=>sum+o.total,0);const trend=(a:number,b:number)=>({thisMonth:a,lastMonth:b,change:b>0?((a-b)/b)*100:0,direction:a>=b?'up' as const:'down' as const});
 return {revenue:trend(amount(current),amount(prior)),orders:trend(current.length,prior.length)};
}

export function averageOrderValue(orders:Order[]){const active=orders.filter(o=>o.status!==OrderStatus.CANCELLED);return active.length?active.reduce((sum,o)=>sum+o.total,0)/active.length:0;}
