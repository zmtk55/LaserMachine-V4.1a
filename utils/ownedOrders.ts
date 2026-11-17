import {Order,User} from '../types';
/** Identity is the authenticated UID. Email/phone are contact data, not access grants. */
export const ownedOrders=(orders:Order[],user:User)=>orders.filter(o=>o.userId===user.id).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
