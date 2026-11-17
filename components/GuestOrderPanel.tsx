import React from 'react';
import {User,Order} from '../types';
export function GuestOrderPanel({user,orders,onContinue}:{user:User;orders:Order[];onContinue:()=>void}){
 const own=orders.filter(o=>o.userId===user.id);
 return <main className="lm-guest-request min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white p-6 max-w-xl mx-auto" aria-label="Solicitud de invitado">
  <h1 className="text-2xl font-black mb-4">Tu solicitud</h1>
  <p className="mb-6">Tu solicitud queda pendiente de revisión del taller. Recibir un folio no confirma el pago ni la producción.</p>
  {own.length===0?<p className="mb-6">Aún no hay solicitudes recibidas en esta sesión.</p>:own.map(o=><section key={o.id} className="border border-zinc-300 dark:border-zinc-700 rounded-xl p-4 mb-4">
   <p className="text-sm">Folio de solicitud</p><h2 className="font-black text-xl break-all">{o.id}</h2>
   <p className="mt-2">Solicitud recibida, pendiente de confirmación del taller.</p>
   <p className="font-bold mt-2">Total solicitado: {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(o.total))} MXN</p>
   <p className="text-sm mt-2">Sin cobro en línea.</p>
  </section>)}
  <p className="text-sm mb-6">Esta vista está ligada a tu sesión de invitado. Conserva el folio si cierras o borras los datos del navegador.</p>
  <button className="bg-yellow-400 text-black rounded-xl px-5 py-3 font-bold" onClick={onContinue}>Seguir viendo el catálogo</button>
 </main>;
}
