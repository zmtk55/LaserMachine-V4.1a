import React,{useEffect,useRef,useState}from'react';
import{createPortal}from'react-dom';
import{X,ZoomIn,ZoomOut,Download,FileImage}from'lucide-react';
import{useModalFocus}from'../utils/useModalFocus';
import{OrderItem}from'../types';
interface Asset{label:string;url?:string;thumbnail?:string;}
function safeSource(value?:string){return value&&(/^(data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,|blob:|https?:\/\/)/i.test(value))?value:undefined;}
function AssetViewer({asset,onClose}:{asset:Asset;onClose:()=>void}){
 const ref=useRef<HTMLDivElement>(null),[zoom,setZoom]=useState(1),[state,setState]=useState<'loading'|'ready'|'error'>('loading'),[downloadUrl,setDownloadUrl]=useState<string>();
 useModalFocus(true,ref,onClose);
 const source=safeSource(asset.url);
 useEffect(()=>{let active=true,blobUrl:string|undefined;if(!source)return;fetch(source).then(r=>{if(!r.ok)throw Error();return r.blob();}).then(blob=>{if(!active)return;blobUrl=URL.createObjectURL(blob);setDownloadUrl(blobUrl);}).catch(()=>{});return()=>{active=false;if(blobUrl)URL.revokeObjectURL(blobUrl);};},[source]);
 const extension=source?.match(/^data:image\/([^;,]+)/i)?.[1]?.replace('svg+xml','svg')||'png';
 return createPortal(<div className="lm-order-file-overlay"><div ref={ref} className="lm-order-file-viewer" role="dialog" aria-modal="true" aria-label={`Archivo ${asset.label}`}><header><div><span>Archivo del diseño</span><h2>{asset.label}</h2></div><button onClick={onClose} aria-label="Cerrar archivo"><X size={20}/></button></header><div className="lm-order-file-tools"><button onClick={()=>setZoom(z=>Math.max(1,z-.5))} disabled={zoom===1} aria-label="Reducir archivo"><ZoomOut size={18}/></button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(z=>Math.min(4,z+.5))} disabled={zoom===4} aria-label="Ampliar archivo"><ZoomIn size={18}/></button><button onClick={()=>setZoom(1)}>Ajustar</button>{downloadUrl&&<a tabIndex={0} href={downloadUrl} download={`diseno-${asset.label.replace(/[^a-z0-9]+/gi,'-')}.${extension}`}><Download size={16}/> Descargar</a>}</div><div className="lm-order-file-canvas">{!source?<p role="alert">No se pudo cargar este archivo. Vuelve a abrir el pedido para intentar cargarlo.</p>:<>{state==='loading'&&<p role="status">Cargando archivo…</p>}{state==='error'&&<p role="alert">No se pudo mostrar el archivo. Vuelve a abrir el pedido para intentar cargarlo.</p>}<div className="lm-order-file-image" style={{width:`${zoom*100}%`,height:zoom===1?'100%':'auto'}}><img src={source} alt={asset.label} onLoad={()=>setState('ready')} onError={()=>setState('error')} style={{display:state==='error'?'none':undefined,width:zoom===1?'auto':'100%',maxHeight:zoom===1?'100%':undefined}}/></div></>}</div><footer>Vista del archivo guardado. No modifica el diseño ni el pedido.</footer></div></div>,document.body);
}
export function OrderAssetGallery({item}:{item:OrderItem}){
 const[selected,setSelected]=useState<Asset|null>(null);
 const assets:Asset[]=[];
 if(item.customBackgroundImage||item.backgroundAssetId)assets.push({label:'Foto del producto',url:item.customBackgroundImage,thumbnail:item.customBackgroundImage});
 for(const[face,rows]of[['Frente',item.frontLogos],['Reverso',item.backLogos]]as const)(rows||[]).forEach((logo,i)=>assets.push({label:`${face} · Logo ${i+1}`,url:logo.originalAssetId?logo.originalUrl:(logo.originalUrl||logo.url),thumbnail:logo.url}));
 return <div className="lm-order-assets">{!assets.length?<p>Sin archivos adjuntos. El texto se consulta en Diseño.</p>:assets.map((asset,i)=><div className="lm-order-asset" key={i}><button className="lm-order-asset-thumb" onClick={()=>setSelected(asset)} aria-label={`Ver archivo ${asset.label}`}>{safeSource(asset.thumbnail)?<img src={asset.thumbnail} alt={asset.label}/>:<FileImage size={32}/>}</button><div><h5>{asset.label}</h5><button onClick={()=>setSelected(asset)}>Ver archivo</button></div></div>)}{selected&&<AssetViewer asset={selected} onClose={()=>setSelected(null)}/>}</div>;
}
