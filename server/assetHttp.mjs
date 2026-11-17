/** Runtime-neutral authenticated upload HTTP adapter, local preparation only.
 * Authentication service validates JWT, never trusts userId/verified sent by client.
 * No user URLs, SSRF fetch, cookie-based auth or caller-specified storage path.
 */
export function createAssetHandler({auth,assets,maxBytes=5_000_000,allowedOrigin}){
 if(!allowedOrigin||new URL(allowedOrigin).origin!==allowedOrigin)throw Error('Exact app origin required');
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':allowedOrigin,'Vary':'Origin'};
 const reply=(body,status)=>new Response(JSON.stringify(body),{status,headers});
 return async request=>{
  if(request.headers.get('Origin')!==allowedOrigin)return reply({error:'Origin not allowed'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Max-Age':'600'}});
  if(request.method!=='POST')return reply({error:'Method not allowed'},405);
  const authorization=request.headers.get('Authorization')??'';
  if(!/^Bearer [A-Za-z0-9._-]+$/.test(authorization))return reply({error:'Sign in required'},401);
  const {data,error}=await auth.getUser(authorization.slice(7));
  if(error||!data?.user?.id)return reply({error:'Verified user required'},401);
  const mime=(request.headers.get('Content-Type')??'').split(';')[0].trim();
  if(!['image/svg+xml','image/png','image/jpeg','image/webp'].includes(mime))return reply({error:'Unsupported upload format'},415);
  if(Number(request.headers.get('Content-Length'))>maxBytes)return reply({error:'Upload exceeds limit'},413);
  const reader=request.body?.getReader();if(!reader)return reply({error:'Upload bytes required'},400);
  const chunks=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>maxBytes){await reader.cancel();return reply({error:'Upload exceeds limit'},413);}chunks.push(value);}}finally{reader.releaseLock();}
  if(!size)return reply({error:'Upload bytes required'},400);
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{const receipt=await assets.upload({verified:true,userId:data.user.id},Buffer.from(bytes),mime);return reply({asset:receipt},201);}
  catch{return reply({error:'Asset could not be verified or saved. Original remains local; review required.'},422);}
 };
}
