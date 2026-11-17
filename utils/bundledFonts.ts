import{FontOption}from'../types';

/**
 * Bytes oficiales de las familias estándar que el catálogo ya publica, servidos
 * como recursos versionados del frontend (public/fonts/lm/). No son archivos del
 * taller: son las caras reales de esas familias, verificadas por sha256 al cargar.
 * La entrada 106 queda sin archivo a propósito (su cursiva sería sintetizada).
 */
export interface BundledFontFile{
  file:string;
  sha256:string;
  /** Alias cssFamily que debe tener la fila del catálogo para aceptar el archivo. */
  cssFamily:string;
  family:string;
  weight:number;
}

export const BUNDLED_FONTS:Record<number,BundledFontFile>={
  101:{file:'lm-101-anton.ttf',sha256:'fd9301f2837c99df2be07cc7f0be66e9470f5354d8fcf1606027c67fcd637a53',cssFamily:'font-industrial',family:'Anton',weight:400},
  102:{file:'lm-102-109-permanent-marker.ttf',sha256:'a73712ce4f3b32d3c7a1a657d56c6aaf50c719b7fa7fe0541905fe77f5a9906c',cssFamily:'font-script1',family:'Permanent Marker',weight:400},
  103:{file:'lm-103-110-playfair-700.ttf',sha256:'adefc53e7b3d483f1fa5e85edd82b7689ca79db25a1f6786bd7949cdcfeec601',cssFamily:'font-serif1',family:'Playfair Display',weight:700},
  104:{file:'lm-104-plus-jakarta-800.ttf',sha256:'d9e0ddb4a15a0054ad84b4ded3b4b9f354a0b7df426e21a1363d6933728da9d5',cssFamily:'font-display1',family:'Plus Jakarta Sans ExtraBold',weight:800},
  105:{file:'lm-105-107-jetbrains-mono.ttf',sha256:'44ce4a84f20d60f24539bd0cef11f79c29e38609e0f8adf18551c9794a5d9dc3',cssFamily:'font-mono',family:'JetBrains Mono',weight:400},
  107:{file:'lm-105-107-jetbrains-mono.ttf',sha256:'44ce4a84f20d60f24539bd0cef11f79c29e38609e0f8adf18551c9794a5d9dc3',cssFamily:'font-mono',family:'JetBrains Mono',weight:400},
  108:{file:'lm-108-bebas-neue.ttf',sha256:'939fea723dad24504f40faadc34eeffadfbbee558754f70c3c736e13786b0ab6',cssFamily:'font-bold1',family:'Bebas Neue',weight:400},
  109:{file:'lm-102-109-permanent-marker.ttf',sha256:'a73712ce4f3b32d3c7a1a657d56c6aaf50c719b7fa7fe0541905fe77f5a9906c',cssFamily:'font-script1',family:'Permanent Marker',weight:400},
  110:{file:'lm-103-110-playfair-700.ttf',sha256:'adefc53e7b3d483f1fa5e85edd82b7689ca79db25a1f6786bd7949cdcfeec601',cssFamily:'font-serif1',family:'Playfair Display',weight:700},
  999:{file:'lm-999-plus-jakarta-400.ttf',sha256:'076831b98043f50f829b6c91db3be4a844641f1c95bccff5c886ed87c661a852',cssFamily:'font-google',family:'Plus Jakarta Sans',weight:400},
};

/** El archivo incluido aplica solo si la fila conserva exactamente el alias esperado: nunca se cambia la identidad de una fuente para que coincida. */
export function bundledFontFor(font:FontOption|undefined|null):BundledFontFile|undefined{
  if(!font||font.id==null)return undefined;
  const entry=BUNDLED_FONTS[font.id];
  return entry&&entry.cssFamily===font.cssFamily?entry:undefined;
}

const toHex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');

async function fetchVerifiedDataUrl(entry:BundledFontFile):Promise<string>{
  const response=await fetch(`fonts/lm/${entry.file}`);
  if(!response.ok)throw Error(`Archivo incluido no disponible: ${entry.file}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const digest=await crypto.subtle.digest('SHA-256',bytes.slice().buffer);
  if(toHex(new Uint8Array(digest))!==entry.sha256)throw Error(`Integridad falló: ${entry.file}`);
  let binary='';
  const CHUNK=0x8000;
  for(let i=0;i<bytes.length;i+=CHUNK)binary+=String.fromCharCode(...bytes.subarray(i,i+CHUNK));
  return `data:font/ttf;base64,${btoa(binary)}`;
}

/**
 * Adjunta los bytes oficiales a las filas del catálogo que no traen archivo,
 * marcándolas bundled:true. Solo en memoria: la persistencia remota los excluye
 * (stripOrderDisplayData) para no mutar el catálogo vivo. Una fila cuyo alias no
 * coincide o cuyo archivo falla integridad queda sin archivo, como antes.
 */
export async function resolveBundledFonts(fonts:FontOption[]):Promise<FontOption[]>{
  return Promise.all(fonts.map(async font=>{
    if(font.fileData)return font;
    const entry=bundledFontFor(font);
    if(!entry)return font;
    try{return{...font,fileData:await fetchVerifiedDataUrl(entry),bundled:true};}
    catch{return font;}
  }));
}
