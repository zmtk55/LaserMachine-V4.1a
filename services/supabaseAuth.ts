import { supabase } from './supabaseClient';
import { getCaptchaToken } from './turnstile';
import { User,UserRole } from '../types';
export const isFirebaseConfigured=()=>Boolean(supabase); // legacy UI capability alias
async function appUser(authUser:any):Promise<User>{
 if(!supabase)throw Error('Supabase no está configurado');
 const {data,error}=await supabase.rpc('lm_is_admin');
 if(error)throw Error('No se pudo verificar el acceso');
 const ledger=await supabase.from('lm_points_ledger').select('points');
 if(ledger.error)throw Error('No se pudo verificar el saldo de puntos');
 const points=(ledger.data??[]).reduce((sum,row)=>sum+row.points,0);
 const isGuest=authUser.is_anonymous===true;
 return {id:authUser.id,email:authUser.email??'',name:[authUser.user_metadata?.name,authUser.user_metadata?.full_name].find(v=>typeof v==='string'&&v.trim())?.trim()??'',role:data===true&&!isGuest?UserRole.ADMIN:UserRole.CLIENT,laserPoints:points,pointsHistory:[],...(isGuest?{isGuest:true,phone:authUser.user_metadata?.phone}:{})};
}
export async function loginWithEmail(email:string,password:string){
 if(!supabase)throw Error('Supabase no está configurado');
 const captchaToken=await getCaptchaToken();
 const {data,error}=await supabase.auth.signInWithPassword({email,password,options:{captchaToken}});
 if(error||!data.user)throw Error('No se pudo iniciar sesión. Revisa correo y contraseña.');
 return appUser(data.user);
}
export async function logoutUser(){await supabase?.auth.signOut();}
export function onAuthChange(callback:(user:User|null)=>void){
 if(!supabase){callback(null);return ()=>{};}
 let alive=true,generation=0;
 const deliver=async(u:any,version:number)=>{
   if(!alive||version!==generation)return;
   try{const v=u?await appUser(u):null;if(alive&&version===generation)callback(v);}
   catch{if(alive&&version===generation)callback(null);}
 };
 supabase.auth.getSession().then(({data})=>deliver(data.session?.user,0)).catch(()=>{if(alive&&generation===0)callback(null);});
 const {data}=supabase.auth.onAuthStateChange((_event,session)=>{const version=++generation;setTimeout(()=>deliver(session?.user,version),0);});
 return ()=>{alive=false;generation++;data.subscription.unsubscribe();};
}
export const checkRateLimit=(_action?:string)=>true;
export const recordAttempt=(_action?:string)=>{};
export async function loginWithGoogle():Promise<User>{throw Error('Acceso con Google pendiente de configurar. Usa correo y contraseña.');}
// Invitado: sesion anonima real de Supabase (uid propio). El telefono es solo un dato
// de contacto del pedido: NUNCA credencial ni llave de consulta.
export async function createGuestUser(phone:string,name:string):Promise<User>{
 if(!supabase)throw Error('Supabase no está configurado');
 const captchaToken=await getCaptchaToken();
 const {data,error}=await supabase.auth.signInAnonymously({options:{captchaToken,data:{name,phone}}});
 if(error||!data.user)throw Error('No se pudo abrir tu pedido como invitado. Intenta de nuevo en un momento.');
 return {id:data.user.id,email:'',name,role:UserRole.CLIENT,laserPoints:0,pointsHistory:[],phone,isGuest:true};
}
