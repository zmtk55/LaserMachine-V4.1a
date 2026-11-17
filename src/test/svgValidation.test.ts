import {describe,it,expect} from 'vitest';import {validateEngravingSvg} from '../../server/validateSvg.mjs';
const svg=(body:string)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;
describe('server SVG compatibility preparation',()=>{
 it('preserves legitimate vector geometry and original bytes',()=>{const original=svg('<defs><linearGradient id="ink"><stop offset="0" stop-color="black"/></linearGradient><path id="logo" d="M0 0 L10 10"/></defs><g transform="translate(5 5)"><use href="#logo" fill="url(#ink)"/></g>');const result=validateEngravingSvg(original);expect(result.original).toBe(original);expect(result.sha256).toHaveLength(64);});
 it('preserves engraving text and positions',()=>{expect(validateEngravingSvg(svg('<text x="0" y="30" font-family="Bebas Neue" transform="rotate(10)">México &amp; Luz</text>')).nodes).toBe(2);});
 it.each(['<script>alert(1)</script>','<path onclick="x()" d="M0 0"/>','<foreignObject/>','<use href="https://bad.invalid/x.svg#p"/>','<path fill="url(https://bad.invalid/a)"/>','<path style="fill: black; background: red"/>','<g id="a"/><g id="a"/>','<use href="#missing"/>'])('rejects active or unsupported content %s',body=>{expect(()=>validateEngravingSvg(svg(body))).toThrow();});
 it.each(['<g id="loop"><use href="#loop"/></g>','<g id="a"><use href="#b"/></g><g id="b"><use href="#a"/></g>'])('rejects recursive use graphs',body=>{expect(()=>validateEngravingSvg(svg(body))).toThrow('Recursive');});
 it('rejects DTD/entity expansion',()=>{expect(()=>validateEngravingSvg('<!DOCTYPE svg [<!ENTITY x "bad">]>'+svg('<text>&x;</text>'))).toThrow();});
});
