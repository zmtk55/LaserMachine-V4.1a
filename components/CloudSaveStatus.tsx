import React from'react';import{Check,UploadCloud,AlertCircle,Loader2}from'lucide-react';
export function CloudSaveStatus({ready,dirty,saving,status,onSave,onRetryLoad}:{ready:boolean;dirty:boolean;saving:boolean;status:string;onSave:()=>void;onRetryLoad?:()=>void}){
 const error=/error|no se|no guard|conservados|conflict|revision|revisión/i.test(status)&&!/confirmado/i.test(status);
 return <div className={'admin-save-status '+(error?'has-error':dirty?'is-dirty':'')} role={error?'alert':'status'} aria-live="polite">
 <span className="admin-save-label">{error?<AlertCircle size={16}/>:saving||!ready?<Loader2 size={16} className="animate-spin"/>:dirty?<UploadCloud size={16}/>:<Check size={16}/>}<span>{error?status:saving?'Guardando cambios…':!ready?'Cargando datos…':dirty?'Cambios sin guardar':'Cambios guardados'}</span></span>
 {!ready&&error&&onRetryLoad?<button onClick={onRetryLoad}>Reintentar carga</button>:(dirty||error)&&<button disabled={!ready||saving} onClick={onSave}>{saving?'Guardando…':error?'Reintentar guardado':'Guardar cambios'}</button>}
 </div>;
}
