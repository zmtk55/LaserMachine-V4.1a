import React from 'react';
/** The same editable multiline text geometry in editor, bounds and production preview. */
export function EngravingText({text,fontCss='',baseSize=32,color,lineHeight,lineSizes}:{text:string;fontCss?:string;baseSize?:number;color?:string;lineHeight?:number;lineSizes?:number[]}){
 return <span className={`${fontCss} whitespace-pre font-bold`} style={{display:'inline-grid',fontSize:baseSize,textAlign:'center',color}}>{text.split('\n').map((line,i)=><span key={i} style={{display:'block',fontSize:baseSize*(lineSizes?.[i]??1),lineHeight:lineHeight?`${lineHeight}px`:1}}>{line||' '}</span>)}</span>;
}
