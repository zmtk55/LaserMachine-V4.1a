import { createClient } from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if(url&&new URL(url).origin!=='https://uhghmebvpyuwoksbaaje.supabase.co')throw Error('Unexpected Supabase destination');
export const supabase=url&&key?createClient(url,key,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}):null;
export const isSupabaseConfigured=()=>Boolean(supabase);
