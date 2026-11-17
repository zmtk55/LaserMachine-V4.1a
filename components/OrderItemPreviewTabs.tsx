import React,{useId,useState} from 'react';
import {OrderItem,Product,FontOption} from '../types';
import {TechnicalPreview} from './TechnicalPreview';
import {productPreviewImage,productColorHex,productPreviewLabel} from '../utils/productColorPreview';
import {previewImageScale,previewInk} from '../utils/designPreview';

/** The same saved composition, one face at a time. No order or design mutation. */
export function OrderItemPreviewTabs({item,product,fonts,label}:{item:OrderItem;product?:Product;fonts:FontOption[];label:string}){
 const [side,setSide]=useState<'front'|'back'>('front');const id=useId();
 const back=side==='back';
 return <div className="lm-client-design">
  <div role="tablist" aria-label={`Caras del diseño · ${label}`} className="lm-client-faces">
   {(['front','back'] as const).map((value,index)=><button key={value} type="button" role="tab" id={`${id}-${value}`} aria-controls={`${id}-panel`} aria-selected={side===value} tabIndex={side===value?0:-1} onClick={()=>setSide(value)} onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?'front':event.key==='End'?'back':side==='front'?'back':'front';setSide(next);document.getElementById(`${id}-${next}`)?.focus();}}>{index===0?'Frente':'Posterior'}</button>)}
  </div>
  <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${side}`} tabIndex={0}>
   <TechnicalPreview referenceLabel={productPreviewLabel(product,item.colorName,item.customBackgroundImage)} key={side} imageScale={previewImageScale(product?.illustrativeImage,item.customBackgroundImage)} inkColor={previewInk(productColorHex(product,item.colorName))} imageUrl={productPreviewImage(product,item.colorName,item.customBackgroundImage)} text={back?item.backText:item.frontText} text2={back?item.backText2:item.frontText2} fontName={back?item.backFontName:item.frontFontName} fontId={back?item.backFontId:item.frontFontId} hideElementCounts hideFontMetadata fontCss={fonts.find(f=>f.id===(back?item.backFontId:item.frontFontId))?.cssFamily||''} font2Css={fonts.find(f=>f.id===(back?item.backFontId2:item.frontFontId2))?.cssFamily} logos={back?item.backLogos:item.frontLogos} designState={back?item.backDesignState:item.frontDesignState} designState2={back?item.backDesignState2:item.frontDesignState2} sideLabel={back?'POSTERIOR':'FRENTE'}/>
  </div>
 </div>;
}
