/** Import bytes already available to the browser. No privileged URL fetch,
 * credentials, cross-origin redirect or remote gallery URL authorization. */
export async function readLocalDesignImage(value:string):Promise<Blob>{
 let url:URL;
 if(value.startsWith('data:image/'))url=new URL(value);
 else{
  url=new URL(value,window.location.origin);
  if(url.origin!==window.location.origin||url.username||url.password||!['http:','https:'].includes(url.protocol))throw Error('Imagen externa: importa su archivo original antes de guardar el diseño');
 }
 const response=await fetch(url.href,{credentials:'omit',redirect:'error'});
 if(!response.ok)throw Error('No se pudo importar la imagen original');
 const mime=(response.headers.get('Content-Type')??'').split(';')[0].trim();
 if(!['image/svg+xml','image/png','image/jpeg','image/webp'].includes(mime))throw Error('Formato de imagen no compatible');
 if(Number(response.headers.get('Content-Length'))>5_000_000)throw Error('Imagen mayor de 5 MB');
 const reader=response.body?.getReader();if(!reader)throw Error('Imagen vacía');const chunks:Uint8Array[]= [];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>5_000_000){await reader.cancel();throw Error('Imagen mayor de 5 MB');}chunks.push(value);}}finally{reader.releaseLock();}
 if(!size)throw Error('Imagen vacía');return new Blob(chunks,{type:mime});
}
