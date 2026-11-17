// @vitest-environment node
import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {resolveSvgFonts} from '../../server/svgFonts.mjs';
const fixture='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const svg=(text:string,family='DejaVu Sans')=>`<svg xmlns="http://www.w3.org/2000/svg"><text font-family="${family}">${text}</text></svg>`;
describe('verified SVG fonts',()=>{
 it('does not substitute unrecognized fonts',()=>{expect(()=>resolveSvgFonts(svg('Logo'))).toThrow('font mapping');});
 it('ignores unrelated catalog font aliases for path-only vectors',()=>{expect(resolveSvgFonts('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg>',[{family:'font-custom-42',bytes:new Uint8Array([1,2])}])).toEqual([]);});
 it('does not need fonts for path-only vectors',()=>{expect(resolveSvgFonts('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg>')).toEqual([]);});
 it.skipIf(!existsSync(fixture))('requires embedded family and actual glyph coverage',()=>{const bytes=readFileSync(fixture);expect(resolveSvgFonts(svg('México'),[{family:'DejaVu Sans',bytes}])).toHaveLength(1);expect(()=>resolveSvgFonts(svg('Logo','Alias'),[{family:'Alias',bytes}])).toThrow('embedded');expect(()=>resolveSvgFonts(svg('中'),[{family:'DejaVu Sans',bytes}])).toThrow('glyph');expect(()=>resolveSvgFonts(svg('Logo').replace('<text ','<text font-weight="bold" '),[{family:'DejaVu Sans',bytes}])).toThrow('face');});
});

import {catalogFontEntries,prepareSvgFontRender} from '../../server/svgFonts.mjs';
it.skipIf(!existsSync(fixture))('maps stored custom alias to exact embedded family without changing original',()=>{const bytes=readFileSync(fixture),fonts=catalogFontEntries([{active:true,cssFamily:'font-custom-42',fileData:'data:font/ttf;base64,'+bytes.toString('base64')}]);const source=svg('México','font-custom-42'),plan=prepareSvgFontRender(source,fonts);expect(plan.renderSource).toContain('font-family="DejaVu Sans"');expect(source).toContain('font-custom-42');expect(plan.fontBuffers[0]).toEqual(bytes);expect(()=>prepareSvgFontRender(source.replace('<text ','<text font-weight="bold" '),fonts)).toThrow('face');});
it.skipIf(!existsSync(fixture))('preserves nested text inheritance, escaping and explicit available bold face',()=>{const bytes=readFileSync(fixture),bold=readFileSync('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf');const source='<svg xmlns="http://www.w3.org/2000/svg"><g font-family="DejaVu Sans"><text>A &amp; B<tspan font-weight="bold">México</tspan></text></g></svg>';const p=prepareSvgFontRender(source,[{family:'DejaVu Sans',bytes},{family:'DejaVu Sans',bytes:bold}]);expect(p.fontBuffers).toHaveLength(2);expect(p.renderSource).toContain('A &amp; B');expect(p.renderSource).toContain('font-weight="700"');});
it('rejects unknown alias instead of using fallback',()=>{expect(()=>prepareSvgFontRender(svg('México','font-custom-unknown'),[])).toThrow('mapping');});
