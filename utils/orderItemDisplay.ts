/** Etiquetas de pedido para taller/cliente: un artículo propio nunca debe parecer producto de catálogo. */
export interface OrderItemDisplaySource{
  productId:string;
  colorName?:string|null;
  isClientItem?:boolean;
  clientItemBrand?:string|null;
  clientItemColor?:string|null;
}
/** Nombre a mostrar: propio → "Producto propio · MARCA"; catálogo → nombre del producto. */
export function itemProductLabel(item:OrderItemDisplaySource,catalogName?:string|null):string{
  if(item.isClientItem){const brand=item.clientItemBrand?.trim();return `Producto propio${brand?` · ${brand}`:''}`;}
  return catalogName||item.productId;
}
/** Color a mostrar: en artículo propio manda el color real declarado por el cliente; el color de la vista previa queda marcado como referencia y nunca como color confirmado. */
export function itemColorLabel(item:OrderItemDisplaySource):string{
  if(item.isClientItem){
    const real=item.clientItemColor?.trim();if(real)return real;
    const ref=item.colorName?.trim();return ref?`Color referencia: ${ref}`:'';
  }
  return item.colorName?.trim()||'';
}
