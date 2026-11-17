import {Order, OrderStatus, Product} from '../types';
export type RabResult = {title:string; description:string; tab:'ORDERS'|'INVENTORY'|'DASHBOARD'; orderId?:string};
export type RabAnswer = {message:string; results:RabResult[]; kind:'answer'|'unsupported'};
const plain=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
const money=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n);
const day=(d:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Hermosillo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const orderDay=(o:Order)=>{const date=new Date(o.createdAt);return Number.isNaN(date.getTime())?'':day(date);};
const totalStock=(p:Product)=>(p.colors??[]).reduce((s,c)=>s+c.stock,0);
const unsupported=():RabAnswer=>({kind:'unsupported',message:'Esa consulta no está disponible en el modo local. Prueba pedidos pendientes, pedidos de hoy, un folio, pedidos de un cliente, precios de productos o stock bajo. No se ha modificado nada.',results:[]});
export function queryRAB(query:string,orders:Order[],products:Product[],now=new Date()):RabAnswer{
 const q=plain(query);
 const answer=(message:string,results:RabResult[]=[]):RabAnswer=>({message,results:results.slice(0,200),kind:'answer'});
 if(/\b(crea|crear|pon|poner|cambia|cambiar|marca|marcar|borra|borrar|elimina|eliminar|paga|pagar|cobrar|cobra|envia|enviar|cancela|cancelar)\b/.test(q))return {kind:'unsupported',message:'RAB sólo consulta datos cargados en el panel. Para cambiar un pedido, cobrar, crear cupones o enviar mensajes, usa sus controles y revisa el cambio antes de guardarlo.',results:[]};
 if(/\b(ayer|semana|mes|ano|manana|entre|desde|hasta el)\b/.test(q))return unsupported();
 const orderRows=(rows:Order[])=>rows.map(o=>({title:`${o.id} · ${o.customerName}`,description:`${o.status} · ${money(o.total)} · Pago ${o.paymentStatus??'PENDIENTE'} · Abonado ${money(o.amountPaid??0)}`,tab:'ORDERS' as const,orderId:o.id}));
 if(/^(ventas hoy|resumen de hoy|resumen hoy|valor de pedidos hoy|cuanto vendimos hoy|cuanto hemos vendido hoy)[?¿.!]*$/.test(q)){
  const rows=orders.filter(o=>orderDay(o)===day(now)&&o.status!==OrderStatus.CANCELLED);
  return answer(`${rows.length} pedidos creados hoy (Hermosillo), sin cancelados. Valor de pedidos: ${money(rows.reduce((s,o)=>s+o.total,0))}. Abonos registrados en esos pedidos: ${money(rows.reduce((s,o)=>s+(o.amountPaid??0),0))}. El valor de pedidos no equivale a dinero cobrado hoy.`,orderRows(rows));
 }
 if(/\b(stock|inventario|productos|precios)\b/.test(q)){
  let rows=[...products];
  const low=q.includes('stock bajo'),pending=/sin confirmar|por confirmar/.test(q),out=q.includes('agotado');
  if(low)rows=rows.filter(p=>(p.colors??[]).length>0&&totalStock(p)>0&&totalStock(p)<=p.stockThreshold);
  if(pending)rows=rows.filter(p=>(p.colors??[]).length===0);
  if(out)rows=rows.filter(p=>(p.colors??[]).length>0&&totalStock(p)===0);
  const max=q.match(/(?:menores?(?:\s+a)?|menos de|hasta)\s*\$?\s*(\d+(?:\.\d+)?)/);if(max)rows=rows.filter(p=>p.price<=Number(max[1]));
  const brand=q.match(/\b(yeti|stanley|rtic|generico)\b/);if(brand)rows=rows.filter(p=>plain(String(p.brand)).includes(brand[1]));
  // Do not quietly treat an unsupported product-name search as the whole catalogue.
  const rest=q.replace(/\b(muestrame|mostrar|dame|ver|el|los|las|de|del|y|con|sin|por|confirmar|stock|bajo|agotados?|inventario|productos|precios|yeti|stanley|rtic|generico|menores?|a|menos|hasta)\b/g,'').replace(/[\d$.,?¿! ]/g,'');
  if(rest)return unsupported();
  return answer(`${rows.length} productos${low?' con stock bajo':pending?' con inventario por confirmar':out?' agotados':''}. Precios base del catálogo; no incluyen extras salvo la tarifa indicada en cada producto.${rows.length>200?' Se muestran los primeros200.':''}`,rows.map(p=>({title:p.name,description:`${money(p.price)} · ${(p.colors??[]).length?`${totalStock(p)} piezas registradas`:'Inventario por confirmar'}`,tab:'INVENTORY'})));
 }
 const clean=q.replace(/[?¿.!]+$/,'');
 const orderRowsFiltered=(rows:Order[],today=false)=>answer(`${rows.length?`${rows.length} pedido${rows.length===1?'':'s'} encontrado${rows.length===1?'':'s'}.`:'No hay pedidos con ese filtro.'}${today?' Fecha de creación en Hermosillo.':''} No se ha modificado ninguno.${rows.length>200?' Se muestran los primeros 200.':''}`,orderRows(rows));
 const id=clean.match(/^(?:(?:pedido|orden|folio|busca|buscar|ver)\s+)?(?:lm[- ]?)?(\d{4,})$/);
 if(id)return orderRowsFiltered(orders.filter(o=>plain(o.id).replace(/^lm[- ]?/,'')===id[1]));
 const customer=clean.match(/^(?:pedidos de|ordenes de|cliente|busca(?:r)?(?: pedidos)?(?: de)?)\s+(.+)$/);
 if(customer&&!/^(hoy|pendientes?|en produccion|produccion|listos?|entregados?|cancelados?)$/.test(customer[1]))return orderRowsFiltered(orders.filter(o=>plain(o.customerName+' '+o.id).includes(customer[1])));
 if(/^(pedidos|ordenes) de hoy$/.test(clean))return orderRowsFiltered(orders.filter(o=>orderDay(o)===day(now)),true);
 const filter=clean.match(/^(?:(?:muestrame|mostrar|ver|dame) )?(?:todos los )?(?:(?:pedidos|ordenes) )?(pendientes?|por aprobar|en produccion|produccion|listos?|entregados?|cancelados?)?(?: de)?( hoy)?$/);
 if(filter&&(filter[1]||filter[2])){let rows=[...orders];const status=filter[1];if(status){if(/pendientes?|por aprobar/.test(status))rows=rows.filter(o=>o.status===OrderStatus.RECEIVED||o.status===OrderStatus.WAITING_APPROVAL);else {const state=/produccion/.test(status)?OrderStatus.IN_PRODUCTION:/listo/.test(status)?OrderStatus.READY:/entregado/.test(status)?OrderStatus.COMPLETED:OrderStatus.CANCELLED;rows=rows.filter(o=>o.status===state);}}if(filter[2])rows=rows.filter(o=>orderDay(o)===day(now));return orderRowsFiltered(rows,!!filter[2]);}
 if(/^(todos los )?(pedidos|ordenes)$/.test(clean))return orderRowsFiltered(orders);
 return unsupported();
}
