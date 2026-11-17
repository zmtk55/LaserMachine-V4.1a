import {supabase} from './supabaseClient';
import {getCaptchaToken} from './turnstile';
function redirect(){const value=import.meta.env.VITE_AUTH_CALLBACK_URL;if(!value)throw Error('Registro y recuperación pendientes de configurar antes de abrir al público');const url=new URL(value);if(url.origin!==window.location.origin||url.username||url.password)throw Error('URL de recuperación no verificada');return url.href;}
export async function registerAccount(email:string,password:string,name:string){
 if(!supabase)throw Error('Supabase no configurado');const emailRedirectTo=redirect();
 if(!name.trim()||password.length<12)throw Error('Escribe tu nombre y una contraseña de al menos 12 caracteres');
 const captchaToken=await getCaptchaToken();const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo,captchaToken,data:{name:name.trim()}}});if(error)throw Error('No se pudo solicitar el registro. Revisa los datos e intenta más tarde.');
}
export async function requestRecovery(email:string){if(!supabase)throw Error('Supabase no configurado');const redirectTo=redirect();const captchaToken=await getCaptchaToken();const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo,captchaToken});if(error)throw Error('No se pudo solicitar la recuperación. Intenta más tarde.');}
export type AccountLinkResult='recovery'|'signed-in'|false;
function cleanLinkParams(url:URL){for(const k of ['code','error','error_code','error_description'])url.searchParams.delete(k);window.history.replaceState({},'',url);}
export function readAccountLinkError():string|null{const url=new URL(window.location.href);const err=url.searchParams.get('error');if(!err)return null;const desc=url.searchParams.get('error_description');cleanLinkParams(url);return 'El enlace expiró o ya fue usado. Solicita otro.'+(desc?' ('+desc.replace(/\+/g,' ')+')':'');}
export async function exchangeAccountCode():Promise<AccountLinkResult>{if(!supabase)throw Error('Supabase no configurado');const url=new URL(window.location.href),code=url.searchParams.get('code');if(!code)return false;redirect();const {data,error}=await supabase.auth.exchangeCodeForSession(code);cleanLinkParams(url);if(error)throw Error('El enlace expiró o no pertenece a este navegador. Solicita otro.');return (data&&'redirectType' in data?data.redirectType:undefined)==='recovery'?'recovery':'signed-in';}
export async function changeRecoveredPassword(password:string){if(!supabase)throw Error('Supabase no configurado');if(password.length<12)throw Error('Usa al menos 12 caracteres');const {data:{session}}=await supabase.auth.getSession();if(!session)throw Error('Abre primero tu enlace de recuperación');const {error}=await supabase.auth.updateUser({password});if(error)throw Error('No se pudo cambiar la contraseña');}
