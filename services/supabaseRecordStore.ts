/** Low-level preparation for per-record persistence, not yet wired or a schema.
 * Requires server RLS and a validated schema. No automatic import or empty-state
 * upload. Does not handle order checkout, pricing or admin identity decisions.
 */
export interface RevisionedRecord<T> {id:string;revision:number;data:T}
export class PersistenceError extends Error {
 constructor(public code:'auth'|'network'|'server'|'conflict'|'invalid',message:string){super(message);}
}
export interface RecordStoreOptions {
 projectUrl:string;
 publishableKey:string;
 accessToken:()=>Promise<string|null>;
 fetcher?:typeof fetch;
}
const tables=['lm_products','lm_fonts','lm_customers','lm_orders','lm_store_private','lm_pricing','lm_content','lm_admin_notes'] as const;
export type BusinessTable=typeof tables[number];
export function createSupabaseRecordStore(options:RecordStoreOptions){
 const root=new URL(options.projectUrl);
 if(root.protocol!=='https:'||root.hostname!=='uhghmebvpyuwoksbaaje.supabase.co'||root.pathname!=='/'||root.search||root.hash||root.username||root.password)throw new PersistenceError('invalid','Unexpected Supabase destination');
 if(!options.publishableKey)throw new PersistenceError('invalid','Missing publishable key');
 const fetcher=options.fetcher??fetch;
 async function call(table:BusinessTable,query:string,method='GET',body?:unknown){
  if(!tables.includes(table))throw new PersistenceError('invalid','Unexpected persistence table');
  const token=await options.accessToken();
  if(!token)throw new PersistenceError('auth','Sign in before reading or saving private business data');
  let response:Response;
  try{response=await fetcher(`${root.origin}/rest/v1/${table}?${query}`,{method,headers:{apikey:options.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),redirect:'error'});}
  catch{throw new PersistenceError('network','Save/read not confirmed. Keep the edited value.');}
  if(!response.ok)throw new PersistenceError(response.status===401||response.status===403?'auth':response.status===409?'conflict':'server','Server did not confirm this operation');
  let rows:unknown;try{rows=await response.json();}catch{throw new PersistenceError('invalid','Invalid server receipt');}
  if(!Array.isArray(rows))throw new PersistenceError('invalid','Expected server rows');
  return rows as RevisionedRecord<unknown>[];
 }
 return {
  async list<T>(table:BusinessTable):Promise<RevisionedRecord<T>[]>{const all:RevisionedRecord<T>[]=[];for(let offset=0;;offset+=500){const page=await call(table,`select=id,revision,data&order=id&limit=500&offset=${offset}`) as RevisionedRecord<T>[];all.push(...page);if(page.length<500)return all;if(offset>=100000)throw new PersistenceError('invalid','Too many rows. Load not complete.');}},
  async remove(table:BusinessTable,id:string,revision:number){const rows=await call(table,`id=eq.${encodeURIComponent(id)}&revision=eq.${revision}&select=id,revision,data`,'DELETE');if(rows.length!==1)throw new PersistenceError('conflict','Record changed. Reload before deleting.');},
  async read<T>(table:BusinessTable,id:string):Promise<RevisionedRecord<T>|null>{
   const rows=await call(table,`select=id,revision,data&id=eq.${encodeURIComponent(id)}&limit=2`);
   if(rows.length>1)throw new PersistenceError('invalid','Duplicate record');
   if(!rows.length)return null;
   const r=rows[0];if(r.id!==id||!Number.isSafeInteger(r.revision)||r.revision<1||!r.data||typeof r.data!=='object')throw new PersistenceError('invalid','Invalid saved record');
   return structuredClone(r) as RevisionedRecord<T>;
  },
  async save<T extends object>(table:BusinessTable,record:RevisionedRecord<T>):Promise<RevisionedRecord<T>>{
   if(!record.id||!Number.isSafeInteger(record.revision)||record.revision<0||!record.data)throw new PersistenceError('invalid','Invalid edit');
   const revision=record.revision+1;
   const body={id:record.id,revision,data:structuredClone(record.data)};
   const rows=record.revision===0?await call(table,'select=id,revision,data','POST',body):await call(table,`id=eq.${encodeURIComponent(record.id)}&revision=eq.${record.revision}&select=id,revision,data`,'PATCH',body);
   if(rows.length!==1)throw new PersistenceError('conflict','Record changed. Reload before saving.');
   const saved=rows[0];if(saved.id!==record.id||saved.revision!==revision||!saved.data||typeof saved.data!=='object')throw new PersistenceError('invalid','Save receipt does not match edit');
   return structuredClone(saved) as RevisionedRecord<T>;
  },
 };
}
