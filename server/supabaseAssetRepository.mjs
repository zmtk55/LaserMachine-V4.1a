/** Privileged server adapter. Client/session credentials MUST NOT instantiate this.
 * Bucket must be private, no caller writes/deletes; insert-only registry.
 * Storage writes are immutable (upsert:false); a failed DB insert cleans only new IDs.
 */
export function createSupabaseAssetRepository(admin,{bucket='lm-private-designs'}={}){
 const storage=admin.storage.from(bucket);
 return {
  async insertImmutable(record){
   const prefix=`${record.ownerId}/${record.id}`,originalPath=`${prefix}/original`,previewPath=`${prefix}/preview`;const written=[];
   try{
    for(const [path,bytes,mime] of [[originalPath,record.original,record.mimeType],[previewPath,record.preview,record.previewMimeType??'image/png']]){
     const result=await storage.upload(path,bytes,{contentType:mime,upsert:false,cacheControl:'0'});if(result.error)throw result.error;written.push(path);
    }
    const result=await admin.from('lm_verified_assets').insert({id:record.id,owner_id:record.ownerId,sha256:record.sha256,mime_type:record.mimeType,original_path:originalPath,preview_path:previewPath,status:'verified',created_at:record.createdAt});if(result.error)throw result.error;
   }catch(error){
    if(written.length){const cleanup=await storage.remove(written);if(cleanup.error)throw new AggregateError([error,cleanup.error],'Asset upload failed; orphan cleanup needs operator review');}
    throw error;
   }
  },
  async get(id){
   const {data,error}=await admin.from('lm_verified_assets').select('id,owner_id,sha256,mime_type,status,original_path,preview_path').eq('id',id).maybeSingle();if(error)throw error;if(!data)return null;
   return {id:data.id,ownerId:data.owner_id,sha256:data.sha256,mimeType:data.mime_type,status:data.status,originalPath:data.original_path,previewPath:data.preview_path};
  },
 };
}
