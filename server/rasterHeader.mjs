/** Header preflight only; full WASM decode remains mandatory. */
export function imageSize(b){
 const d=new DataView(b.buffer,b.byteOffset,b.byteLength),ascii=(a,z)=>String.fromCharCode(...b.subarray(a,z));
 if(b.length>=24&&ascii(1,4)==='PNG'&&d.getUint32(0)===0x89504e47)return {type:'png',width:d.getUint32(16),height:d.getUint32(20)};
 if(b.length>=12&&b[0]===255&&b[1]===216){
  let i=2;while(i+4<b.length){if(b[i++]!==255)throw Error('Invalid JPEG marker');while(b[i]===255)i++;const marker=b[i++];if(marker===217||marker===218)break;if(marker===1||(marker>=208&&marker<=215))continue;const n=d.getUint16(i);if(n<2||i+n>b.length)throw Error('Truncated JPEG');if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){if(n<8)throw Error('JPEG dimensions missing');return {type:'jpg',height:d.getUint16(i+3),width:d.getUint16(i+5)};}i+=n;
  }
 }
 if(b.length>=30&&ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP'){
  const type=ascii(12,16),u24=i=>b[i]+b[i+1]*256+b[i+2]*65536;
  if(type==='VP8X')return {type:'webp',width:1+u24(24),height:1+u24(27)};
  if(type==='VP8 '&&b[23]===157&&b[24]===1&&b[25]===42)return {type:'webp',width:d.getUint16(26,true)&16383,height:d.getUint16(28,true)&16383};
  if(type==='VP8L'&&b[20]===47){const x=d.getUint32(21,true);return {type:'webp',width:(x&16383)+1,height:((x>>>14)&16383)+1};}
 }
 throw Error('Unsupported or truncated raster header');
}
