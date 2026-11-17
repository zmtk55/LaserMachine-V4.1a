import React,{useState,useEffect}from'react';
import{Loader2}from'lucide-react';
import{Product}from'../types';
import{productPreviewImage}from'../utils/productColorPreview';
const formatMXN=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2,minimumFractionDigits:0}).format(n);
export const ShopProductCard = ({ product, onClick }: { product: Product, onClick: () => void, key?: React.Key }) => {
    const [loaded, setLoaded] = useState(false);
    const [failed,setFailed]=useState(false);
    const image=productPreviewImage(product, product.colors?.[0]?.name || 'NEGRO');
    useEffect(()=>{setLoaded(false);setFailed(false);},[image]);
    return (
        <div onClick={onClick} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClick();}}} aria-label={`Diseñar ${product.name}`} className="group cursor-pointer rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="aspect-square bg-white dark:bg-zinc-950 relative overflow-hidden flex items-center justify-center p-2">
                {!loaded && !failed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 z-10 animate-pulse">
                        <Loader2 className="animate-spin text-zinc-400 w-5 h-5"/>
                    </div>
                )}
                {product.illustrativeImage && (
                    <span className="absolute bottom-2 left-2 z-10 text-[9px] font-black uppercase tracking-widest bg-zinc-950/80 text-white px-2 py-1 rounded-md">Foto de referencia</span>
                )}
                {failed ? <div className="text-center text-sm text-zinc-600 dark:text-zinc-300 p-4" role="status">Foto no disponible</div> : <img alt={product.name}
                    src={image}
                    onLoad={() => setLoaded(true)}
                    onError={() => {setLoaded(true);setFailed(true);}}
                    className={`max-w-[94%] max-h-[94%] object-contain group-hover:scale-105 transition-transform duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                />}
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{product.brand}</span>
                <h3 className="font-bold text-sm uppercase tracking-tight leading-snug mt-1 text-zinc-900 dark:text-white">{product.name}</h3>
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mt-3">
                    <p className="font-black text-base text-zinc-900 dark:text-white">{formatMXN(product.price)}</p>
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Diseñar</span>
                </div>
            </div>
        </div>
    );
};

