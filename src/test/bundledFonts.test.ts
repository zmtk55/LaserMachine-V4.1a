import{describe,it,expect}from'vitest';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{BUNDLED_FONTS,bundledFontFor}from'../../utils/bundledFonts';
import{hasFontFile,productionFont,fontSourceLabel}from'../../utils/fontProvenance';
import{FontOption}from'../../types';

describe('bundledFonts manifest',()=>{
 it('every entry resolves to a real versioned file whose bytes match the pinned sha256',()=>{
  const seen=new Set<string>();
  for(const [id,entry] of Object.entries(BUNDLED_FONTS)){
   expect(Number(id)).toBeGreaterThan(0);
   expect(seen.has(entry.file+id)).toBe(false);seen.add(entry.file+id);
   const bytes=readFileSync(`public/fonts/lm/${entry.file}`);
   expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.sha256);
  }
 });
 it('keeps 106 without a file: its italic would be synthesized, never a real face',()=>{
  expect(BUNDLED_FONTS[106]).toBeUndefined();
 });
 it('matches only the exact catalog alias, never a renamed row',()=>{
  expect(bundledFontFor({id:101,name:'x',cssFamily:'font-industrial'})).toBeDefined();
  expect(bundledFontFor({id:101,name:'x',cssFamily:'font-other'})).toBeUndefined();
  expect(bundledFontFor({id:106,name:'x',cssFamily:'font-script2'})).toBeUndefined();
  expect(bundledFontFor(undefined)).toBeUndefined();
 });
 it('no two entries claim a different real family for the same file',()=>{
  const byFile=new Map<string,string>();
  for(const entry of Object.values(BUNDLED_FONTS)){
   if(byFile.has(entry.file))expect(byFile.get(entry.file)).toBe(entry.family);else byFile.set(entry.file,entry.family);
  }
 });
});

describe('fontProvenance with bundled files',()=>{
 const dataUrl='data:font/ttf;base64,AAAA';
 it('bundled official bytes pass the production gate without becoming workshop files',()=>{
  const font:FontOption={id:101,name:'x',cssFamily:'font-industrial',fileData:dataUrl,bundled:true};
  expect(hasFontFile(font)).toBe(true);
  expect(productionFont(font)).toBe(true);
  expect(font.isCustom).toBeUndefined();
 });
 it('bundled flag without valid bytes still fails',()=>{
  expect(hasFontFile({id:101,name:'x',cssFamily:'font-industrial',bundled:true})).toBe(false);
  expect(hasFontFile({id:101,name:'x',cssFamily:'font-industrial',bundled:true,fileData:'not-a-data-url'})).toBe(false);
 });
 it('plain reference rows still fail the gate',()=>{
  expect(hasFontFile({id:101,name:'x',cssFamily:'font-industrial'})).toBe(false);
 });
 it('source label never calls bundled bytes workshop property',()=>{
  expect(fontSourceLabel({id:101,name:'x',cssFamily:'font-industrial',fileData:dataUrl,bundled:true})).toContain('oficial');
  expect(fontSourceLabel({id:101,name:'x',cssFamily:'font-industrial',fileData:dataUrl,isCustom:true})).toBe('Archivo propio');
  expect(fontSourceLabel({id:101,name:'x',cssFamily:'font-industrial'})).toContain('Referencia:');
 });
 it('inactive bundled font is not a production font',()=>{
  expect(productionFont({id:101,name:'x',cssFamily:'font-industrial',fileData:dataUrl,bundled:true,active:false})).toBe(false);
 });
});
