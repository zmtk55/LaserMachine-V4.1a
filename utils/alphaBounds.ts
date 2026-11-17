/** Bounding rectangle of visible pixels. Keeps a small transparent margin without stretching artwork. */
export function alphaBounds(data:ArrayLike<number>,width:number,height:number,padding=8){
 let left=width,top=height,right=-1,bottom=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>=128){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<left)return null;
 left=Math.max(0,left-padding);top=Math.max(0,top-padding);right=Math.min(width-1,right+padding);bottom=Math.min(height-1,bottom+padding);
 return{x:left,y:top,width:right-left+1,height:bottom-top+1};
}
